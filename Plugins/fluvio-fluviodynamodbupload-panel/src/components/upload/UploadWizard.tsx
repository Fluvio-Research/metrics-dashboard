import React, { useState, useEffect, useRef } from 'react';
import { Alert, Button, HorizontalGroup, Spinner } from '@grafana/ui';
import { css } from '@emotion/css';
import { ParsedFileData, UploadPresetSummary, ValidationError } from '../../types';
import { DataPreview } from './DataPreview';
import { ImportConfigurationStep, ImportConfiguration } from './ImportConfigurationStep';
import { Validators } from '../../utils/validators';
import { HelpTooltip } from '../shared/HelpTooltip';
import { loadPapaParse, loadRequiredLibraries } from '../../utils/externalLibs';
import type { ParseResult as PapaParseResult } from 'papaparse';

interface UploadWizardProps {
  preset: UploadPresetSummary;
  onComplete: (items: Record<string, unknown>[]) => void;
  onCancel: () => void;
}

type WizardStep = 'upload' | 'configure' | 'preview' | 'confirm';

export const UploadWizard: React.FC<UploadWizardProps> = ({ preset, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [parsedData, setParsedData] = useState<ParsedFileData[]>([]);
  const [rawCsvData, setRawCsvData] = useState<string[][]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedItems, setProcessedItems] = useState<Record<string, unknown>[]>([]); // Store typed data
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [librariesLoading, setLibrariesLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load external libraries on mount (but don't block UI)
  useEffect(() => {
    loadRequiredLibraries()
      .then(() => {
        console.log('Libraries loaded successfully');
      })
      .catch((error) => {
        console.warn('Failed to preload libraries:', error);
        // Don't set error here - we'll try again when user uploads a file
      });
  }, []);

  const handleFileUploaded = async (file: File) => {
    // Clear all previous data first
    setRawCsvData([]);
    setParsedData([]);
    setProcessedItems([]);
    setValidationErrors([]);
    setUploadError(undefined);
    setIsProcessingFile(true);
    
    setUploadedFile(file);
    setSelectedFileName(file.name);

    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    try {
      // CSV files
      if (fileName.endsWith('.csv') || fileType === 'text/csv') {
        setLibrariesLoading(true);
        const Papa = await loadPapaParse(); 

        let text = await file.text();
        
        // Sanitize control characters from the CSV text BEFORE parsing
        // Remove control characters (0x00-0x1F except tab, newline, carriage return)
        // eslint-disable-next-line no-control-regex
        text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        Papa.parse<string[]>(text, {
          skipEmptyLines: true,
          complete: (result: PapaParseResult<string[]>) => {
            const nonEmptyRows = result.data.filter((row) =>
              row.some((cell) => cell != null && cell.toString().trim() !== '')
            );
            setRawCsvData(nonEmptyRows);
            setCurrentStep('configure');
          },
          error: (error: Error) => {
            setUploadError(`Failed to parse CSV: ${error.message}`);
          },
        });
      }
      // JSON files
      else if (fileName.endsWith('.json') || fileType === 'application/json') {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        // Handle different JSON structures
        let dataArray: Record<string, unknown>[];
        if (Array.isArray(jsonData)) {
          dataArray = jsonData;
        } else if (jsonData.items && Array.isArray(jsonData.items)) {
          dataArray = jsonData.items;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          dataArray = jsonData.data;
        } else {
          dataArray = [jsonData]; // Single object
        }

        // Convert JSON objects to tabular format
        if (dataArray.length > 0) {
          // Get all unique keys across all objects
          const allKeys = new Set<string>();
          dataArray.forEach(obj => {
            Object.keys(obj).forEach(key => allKeys.add(key));
          });
          const headers = Array.from(allKeys);
          
          // Create rows with headers
          const rows: string[][] = [headers];
          dataArray.forEach(obj => {
            const row = headers.map(key => {
              const value = obj[key];
              return value != null ? String(value) : '';
            });
            rows.push(row);
          });
          
          setRawCsvData(rows);
          setCurrentStep('configure');
        } else {
          setUploadError('JSON file is empty or has no data');
        }
      }
      else {
        setUploadError('Unsupported file format. Please upload CSV (.csv) or JSON (.json) files.');
      }
    } catch (error) {
      setUploadError(`Failed to parse file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessingFile(false);
      setLibrariesLoading(false);
    }
  };

  const handleConfigured = (config: ImportConfiguration, processedData: Record<string, unknown>[]) => {
    // Store the properly typed processed data
    setProcessedItems(processedData);

    // Convert to ParsedFileData format (cast unknown to string for validation)
    const stringifiedData = processedData.map(row => {
      const stringRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        stringRow[key] = String(value);
      }
      return stringRow;
    });

    const fileData: ParsedFileData = {
      fileName: uploadedFile?.name || 'imported-data.csv',
      headers: config.columnMappings.filter(m => m.targetField).map(m => m.targetField!),
      rows: stringifiedData,
      rowCount: stringifiedData.length,
    };

    setParsedData([fileData]);

    // Validate
    if (preset.schema && preset.schema.length > 0) {
      const errors = Validators.validateAllRows(stringifiedData, preset.schema);
      setValidationErrors(errors);
    }

    setCurrentStep('preview');
  };

  const handleNext = () => {
    if (currentStep === 'preview') {
      const hasErrors = validationErrors.some((e) => e.severity === 'error');
      if (hasErrors) {
        setUploadError('Please fix all validation errors before proceeding');
        return;
      }
      setCurrentStep('confirm');
    } else if (currentStep === 'confirm') {
      // Use the properly typed processed items (not stringified data)
      onComplete(processedItems.length > 0 ? processedItems : parsedData.flatMap((fileData) => fileData.rows));
    }
  };

  const handleBack = () => {
    if (currentStep === 'configure') {
      // Going back to upload - clear everything
      setCurrentStep('upload');
      setRawCsvData([]);
      setUploadedFile(null);
      setSelectedFileName('');
      setParsedData([]);
      setProcessedItems([]);
      setValidationErrors([]);
      setUploadError(undefined);
    } else if (currentStep === 'preview') {
      if (rawCsvData.length > 0) {
        setCurrentStep('configure');
      } else {
        setCurrentStep('upload');
        // Clear data when going back to upload
        setRawCsvData([]);
        setUploadedFile(null);
        setSelectedFileName('');
      }
      setParsedData([]);
      setProcessedItems([]);
      setValidationErrors([]);
      setUploadError(undefined);
    } else if (currentStep === 'confirm') {
      setCurrentStep('preview');
    }
  };

  const stepTitles = {
    upload: 'Step 1: Upload File',
    configure: 'Step 2: Configure Import',
    preview: 'Step 3: Review Data',
    confirm: 'Step 4: Confirm Upload',
  };

  const totalRows = parsedData.reduce((sum, file) => sum + file.rowCount, 0);
  const errorCount = validationErrors.filter((e) => e.severity === 'error').length;

  return (
    <div className={containerStyles}>
      {/* Progress Indicator */}
      <div className={progressStyles}>
        <div className={stepIndicatorStyles}>
          <div className={stepStyles(currentStep === 'upload', true)}>
            <div className={stepNumberStyles}>1</div>
            <div>Upload</div>
          </div>
          <div className={lineStyles(currentStep !== 'upload')} />
          <div className={stepStyles(currentStep === 'configure', currentStep !== 'upload')}>
            <div className={stepNumberStyles}>2</div>
            <div>Configure</div>
          </div>
          <div className={lineStyles(currentStep === 'preview' || currentStep === 'confirm')} />
          <div className={stepStyles(currentStep === 'preview', currentStep === 'preview' || currentStep === 'confirm')}>
            <div className={stepNumberStyles}>3</div>
            <div>Preview</div>
          </div>
          <div className={lineStyles(currentStep === 'confirm')} />
          <div className={stepStyles(currentStep === 'confirm', currentStep === 'confirm')}>
            <div className={stepNumberStyles}>4</div>
            <div>Confirm</div>
          </div>
        </div>
      </div>

      {/* Step Title */}
      <h3 className={titleStyles}>
        {stepTitles[currentStep]}
        <HelpTooltip
          content={
            currentStep === 'upload'
              ? 'Upload CSV or JSON files to use the import wizard with header detection and type mapping'
              : currentStep === 'configure'
              ? 'Configure headers, column mappings, and data types like Excel Text Import Wizard'
              : currentStep === 'preview'
              ? 'Review the parsed data and fix any validation errors'
              : 'Confirm your data before uploading to DynamoDB'
          }
        />
      </h3>

      {/* Step Content */}
      <div className={contentStyles}>
        {currentStep === 'upload' && (
          <>
            <Alert severity="info" title={`Uploading to: ${preset.table}`}>
              <div><strong>Operation:</strong> {preset.operation.toUpperCase()}</div>
              {preset.description && <div>{preset.description}</div>}
            </Alert>
            <Alert severity="info" title="Upload File - CSV or JSON">
              <div style={{ marginBottom: '12px' }}>
                Upload a comma-separated file (recommended) or JSON export to configure headers, mappings, and types before sending to DynamoDB.
                <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                  <strong>Supported formats:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    <li>📊 <strong>CSV</strong> (.csv) - Comma-separated values with a header row</li>
                    <li>📄 <strong>JSON</strong> (.json) - Array of objects or {`{ items: [...] }`}</li>
                  </ul>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUploaded(file);
                    }
                  }}
                  disabled={isProcessingFile}
                  style={{ display: 'none' }}
                />
                <HorizontalGroup spacing="sm" align="center">
                  <Button
                    icon="upload"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFile}
                  >
                    {isProcessingFile ? 'Uploading…' : 'Select CSV or JSON'}
                  </Button>
                  {(librariesLoading || isProcessingFile) && <Spinner size={16} />}
                </HorizontalGroup>
                <div style={{ fontSize: '12px', color: '#d8d9da', minHeight: '18px' }}>
                  {selectedFileName
                    ? `Selected file: ${selectedFileName}`
                    : 'Choose a CSV file to get started.'}
                </div>
              </div>
            </Alert>
          </>
        )}

        {currentStep === 'configure' && rawCsvData.length > 0 && (
          <ImportConfigurationStep
            rawData={rawCsvData}
            preset={preset}
            onConfigured={handleConfigured}
            onBack={handleBack}
          />
        )}

        {currentStep === 'preview' && parsedData.length > 0 && (
          <>
            <Alert
              severity={errorCount > 0 ? 'warning' : 'success'}
              title={`${totalRows} row${totalRows !== 1 ? 's' : ''} loaded from ${parsedData.length} file${
                parsedData.length !== 1 ? 's' : ''
              }`}
            >
              {errorCount > 0 ? (
                <div>Found {errorCount} validation error{errorCount !== 1 ? 's' : ''}. Please review below.</div>
              ) : (
                <div>All data validated successfully. Ready to proceed.</div>
              )}
            </Alert>
            <DataPreview data={parsedData} validationErrors={validationErrors} />
          </>
        )}

        {currentStep === 'confirm' && (
          <>
            <Alert severity="warning" title="Ready to Upload">
              <div>
                You are about to upload <strong>{totalRows}</strong> row{totalRows !== 1 ? 's' : ''} to the{' '}
                <strong>{preset.table}</strong> table using the <strong>{preset.operation.toUpperCase()}</strong>{' '}
                operation.
              </div>
              <div style={{ marginTop: '8px' }}>This action cannot be undone.</div>
            </Alert>
            
            <div className={summaryStyles}>
              <h4>Upload Summary</h4>
              <ul>
                <li><strong>Target Table:</strong> {preset.table}</li>
                {preset.index && <li><strong>Index:</strong> {preset.index}</li>}
                <li><strong>Operation:</strong> {preset.operation.toUpperCase()}</li>
                <li><strong>Total Rows:</strong> {totalRows}</li>
                <li><strong>Files:</strong> {parsedData.map((f) => f.fileName).join(', ')}</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Error Display */}
      {uploadError && (
        <Alert severity="error" title="Error">
          {uploadError}
        </Alert>
      )}

      {/* Navigation Buttons (hidden on configure step as it has its own buttons) */}
      {currentStep !== 'configure' && (
        <HorizontalGroup justify="space-between" className={actionsStyles}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <HorizontalGroup>
            {currentStep !== 'upload' && (
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            )}
            {currentStep !== 'upload' && (
              <Button
                variant={currentStep === 'confirm' ? 'primary' : 'secondary'}
                onClick={handleNext}
                disabled={currentStep === 'preview' && errorCount > 0}
              >
                {currentStep === 'confirm' ? 'Upload to DynamoDB' : 'Next'}
              </Button>
            )}
          </HorizontalGroup>
        </HorizontalGroup>
      )}
    </div>
  );
};

const containerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  background-color: #1a1e23;
  border-radius: 8px;
  border: 1px solid #333;
`;

const progressStyles = css`
  padding: 16px 0;
`;

const stepIndicatorStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
`;

const stepStyles = (isActive: boolean, isCompleted: boolean) => css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: ${isActive ? '#6e9fff' : isCompleted ? '#52c41a' : '#666'};
  font-size: 13px;
  font-weight: ${isActive ? '600' : '400'};
`;

const stepNumberStyles = css`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`;

const lineStyles = (isCompleted: boolean) => css`
  width: 100px;
  height: 2px;
  background-color: ${isCompleted ? '#52c41a' : '#333'};
  margin: 0 16px;
  margin-bottom: 24px;
`;

const titleStyles = css`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const contentStyles = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 300px;
`;

const summaryStyles = css`
  background-color: #252a31;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #333;

  h4 {
    margin: 0 0 12px 0;
    font-size: 15px;
    font-weight: 600;
  }

  ul {
    margin: 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 6px;
  }
`;

const actionsStyles = css`
  padding-top: 16px;
  border-top: 1px solid #333;
`;
