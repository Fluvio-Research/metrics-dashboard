import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PanelProps, SelectableValue } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import {
  Alert,
  Button,
  CodeEditor,
  HorizontalGroup,
  InlineField,
  Input,
  RadioButtonGroup,
  Select,
  Spinner,
  TextArea,
  Card,
  Icon,
} from '@grafana/ui';
import { css } from '@emotion/css';
import {
  UploadPanelOptions,
  UploadPresetSummary,
  UploadPreviewResponse,
  UploadExecuteResponse,
  UploadField,
  ParsedFileData,
  ValidationError,
  UploadInputMode,
} from '../types';
import { FileUploader } from './upload/FileUploader';
import { DataPreview } from './upload/DataPreview';
import { UploadWizard } from './upload/UploadWizard';
import { HelpTooltip } from './shared/HelpTooltip';
import { ValidationFeedback } from './shared/ValidationFeedback';
import { Validators } from '../utils/validators';
import { resolveFieldType } from '../utils/dynamoTypes';
import { autoConvertIfDynamoFormat } from '../utils/dynamoConverter';

type Props = PanelProps<UploadPanelOptions>;

export const UploadPanelEnhanced: React.FC<Props> = ({ options, width, height }) => {
  // Check if a preset has been configured for this panel (viewers won't see preset selection)
  const isPresetConfiguredByAdmin = Boolean(options.selectedPresetId);
  
  const [presets, setPresets] = useState<UploadPresetSummary[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [presetError, setPresetError] = useState<string | undefined>();
  const [selectedPresetId, setSelectedPresetId] = useState(options.selectedPresetId ?? options.presetId ?? '');
  const [inputMode, setInputMode] = useState<UploadInputMode>(options.inputMode ?? 'form');
  const [selectedDatasource, setSelectedDatasource] = useState<SelectableValue<string>>();
  const [datasources, setDatasources] = useState<Array<SelectableValue<string>>>([]);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [extraFieldsJson, setExtraFieldsJson] = useState<string>('');
  const [jsonPayload, setJsonPayload] = useState<string>('');
  const [parsedFiles, setParsedFiles] = useState<ParsedFileData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [preview, setPreview] = useState<UploadPreviewResponse | null>(null);
  const [executeResult, setExecuteResult] = useState<UploadExecuteResponse | null>(null);
  const [actionError, setActionError] = useState<string | undefined>();
  const [actionLoading, setActionLoading] = useState<'preview' | 'execute' | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [dynamoConversionInfo, setDynamoConversionInfo] = useState<string | undefined>();

  // Update selected preset when admin configuration changes
  useEffect(() => {
    const configuredPresetId = options.selectedPresetId ?? options.presetId ?? '';
    setSelectedPresetId(configuredPresetId);
  }, [options.selectedPresetId, options.presetId]);

  useEffect(() => {
    if (options.inputMode) {
      setInputMode(options.inputMode);
    }
  }, [options.inputMode]);

  const selectedDatasourceKey = selectedDatasource?.value || options.datasource?.uid;

  // Load available datasources on mount
  useEffect(() => {
    const loadDatasources = async () => {
      try {
        const allDs = await getDataSourceSrv().getList();
        const dynamoDbDs = allDs
          .filter((ds) => ds.type === 'fluvio-connect-dynamodb' || ds.type?.includes('dynamodb'))
          .map((ds) => ({
            label: ds.name,
            value: ds.uid,
            description: ds.type,
          }));
        setDatasources(dynamoDbDs);
        
        // Auto-select first datasource if available and none selected
        if (dynamoDbDs.length > 0 && !selectedDatasource) {
          setSelectedDatasource(dynamoDbDs[0]);
        }
      } catch (error) {
        console.error('Failed to load datasources:', error);
      }
    };
    loadDatasources();
  }, []);

  const fetchPresets = useCallback(async () => {
    setLoadingPresets(true);
    setPresetError(undefined);
    
    try {
      // If a preset has been configured for this panel, search all datasources for it
      if (isPresetConfiguredByAdmin) {
        const allDs = await getDataSourceSrv().getList();
        const dynamoDbDs = allDs.filter(
          (ds) => ds.type === 'fluvio-connect-dynamodb' || ds.type?.includes('dynamodb')
        );

        let allPresets: UploadPresetSummary[] = [];
        
        // Load presets from all datasources
        for (const dsInfo of dynamoDbDs) {
          try {
            const ds = await getDataSourceSrv().get(dsInfo.uid);
            const response = await (ds as any).getResource('presets');
            if (response?.presets && Array.isArray(response.presets)) {
              allPresets = [...allPresets, ...response.presets];
            }
          } catch (err) {
            console.warn(`Failed to load presets from ${dsInfo.name}:`, err);
          }
        }

        setPresets(allPresets);
        
        // Verify the configured preset exists
        const configuredPreset = allPresets.find(p => p.id === options.selectedPresetId);
        if (!configuredPreset) {
          setPresetError(`Configured preset "${options.selectedPresetId}" not found`);
        }
      } else {
        // User mode: require datasource selection
        if (!selectedDatasourceKey) {
          setPresets([]);
          setPresetError('Select a Fluvio DynamoDB datasource');
          return;
        }

        const ds = await getDataSourceSrv().get(selectedDatasourceKey);
        const supportsResources = typeof (ds as any)?.getResource === 'function';
        if (!supportsResources) {
          throw new Error('Selected datasource does not support upload resources');
        }

        const response = await (ds as any).getResource('presets');
        console.log('📚 Loaded presets from files:', response);
        const loaded: UploadPresetSummary[] = response?.presets ?? [];
        setPresets(loaded);

        if (loaded.length > 0) {
          const initialId = options.presetId ?? selectedPresetId ?? loaded[0].id;
          setSelectedPresetId(initialId);
        } else {
          setSelectedPresetId('');
          setPresetError('Datasource does not define any upload presets yet');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load presets';
      setPresetError(message);
      setPresets([]);
      if (!isPresetConfiguredByAdmin) {
        setSelectedPresetId('');
      }
    } finally {
      setLoadingPresets(false);
    }
  }, [selectedDatasourceKey, options.presetId, options.selectedPresetId, selectedPresetId, isPresetConfiguredByAdmin]);

  // Load presets from file-based storage
  useEffect(() => {
    console.log('🔄 Loading presets from file storage...');
    fetchPresets();
  }, [fetchPresets]);

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId),
    [presets, selectedPresetId]
  );

  useEffect(() => {
    if (!selectedPreset) {
      setFormValues({});
      setExtraFieldsJson('');
      setParsedFiles([]);
      setValidationErrors([]);
      return;
    }

    setFormValues((prev) => {
      const next: Record<string, string> = {};
      selectedPreset.schema?.forEach((field) => {
        next[field.name] = prev[field.name] ?? field.defaultValue ?? '';
      });
      return next;
    });
    setExtraFieldsJson('');
    setActionError(undefined);
    setPreview(null);
    setExecuteResult(null);
  }, [selectedPreset]);

  // Validate form values in real-time
  useEffect(() => {
    if (inputMode === 'form' && selectedPreset?.schema) {
      const errors = Validators.validateRow(formValues, selectedPreset.schema);
      setValidationErrors(errors);
    } else if (inputMode === 'json' && jsonPayload.trim()) {
      // Validate JSON syntax
      try {
        const parsed = JSON.parse(jsonPayload);
        if (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) {
          setValidationErrors([]);
        } else {
          setValidationErrors([{
            row: 0,
            field: 'json',
            message: 'JSON must be an object or array',
            severity: 'error'
          }]);
        }
      } catch (err) {
        setValidationErrors([{
          row: 0,
          field: 'json',
          message: `Invalid JSON: ${err instanceof Error ? err.message : 'Parse failed'}`,
          severity: 'error'
        }]);
      }
    } else {
      setValidationErrors([]);
    }
  }, [formValues, selectedPreset, inputMode, jsonPayload]);

  const panelStyles = useMemo(
    () =>
      css`
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px;
        background-color: #0b0c0e;
        box-sizing: border-box;
      `,
    []
  );

  const presetOptions = presets.map((preset) => ({
    label: `${preset.name} (${preset.operation.toUpperCase()})`,
    value: preset.id,
    description: preset.description,
  }));

  const handleFieldChange = (field: UploadField, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field.name]: value,
    }));
  };

  const handleFilesParsed = (data: ParsedFileData[]) => {
    setParsedFiles(data);
    setActionError(undefined);

    if (selectedPreset?.schema) {
      const allErrors: ValidationError[] = [];
      data.forEach((fileData) => {
        const errors = Validators.validateAllRows(fileData.rows, selectedPreset.schema!);
        allErrors.push(...errors);
      });
      setValidationErrors(allErrors);
    }
  };

  const buildItems = () => {
    if (!selectedPreset) {
      throw new Error('Select an upload preset');
    }

    if (inputMode === 'file') {
      if (parsedFiles.length === 0) {
        throw new Error('Upload at least one file');
      }
      // Apply type coercion to file data based on schema
      return parsedFiles.flatMap((fileData) => 
        fileData.rows.map(row => coerceRowTypes(row, selectedPreset))
      );
    }

    if (inputMode === 'json') {
      if (!jsonPayload.trim()) {
        throw new Error('Provide a JSON payload');
      }
      let parsed;
      try {
        parsed = JSON.parse(jsonPayload);
        console.log('✅ Parsed JSON payload:', parsed);
      } catch (err) {
        console.error('❌ JSON parse error:', err);
        throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : 'Parse failed'}`);
      }
      
      // Auto-convert DynamoDB AttributeValue format to simplified format
      const { converted, data } = autoConvertIfDynamoFormat(parsed);
      
      if (converted) {
        console.log('🔄 Auto-converted from DynamoDB AttributeValue format to simplified format');
        console.log('📥 Original:', parsed);
        console.log('📤 Converted:', data);
        setDynamoConversionInfo('Auto-converted from DynamoDB AttributeValue format to simplified format');
        parsed = data;
      } else {
        setDynamoConversionInfo(undefined);
      }
      
      let items: Record<string, unknown>[];
      
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          throw new Error('Provide at least one JSON item');
        }
        console.log(`📦 Uploading ${parsed.length} items from JSON array`);
        items = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        console.log('📦 Uploading 1 item from JSON object');
        items = [parsed];
      } else {
        throw new Error('JSON payload must be an object or array of objects');
      }
      
      // Apply type coercion to JSON data based on schema
      return items.map(row => coerceRowTypes(row, selectedPreset));
    }

    // Form mode
    const item: Record<string, unknown> = {};
    selectedPreset.schema?.forEach((field) => {
      const raw = formValues[field.name];
      if (!raw) {
        if (field.required) {
          throw new Error(`Field "${field.name}" is required`);
        }
        return;
      }
      item[field.name] = coerceFormValue(field, raw);
    });

    if (selectedPreset.allowAdHocFields && extraFieldsJson.trim()) {
      const additional = JSON.parse(extraFieldsJson);
      if (Array.isArray(additional)) {
        throw new Error('Additional fields JSON must be an object');
      }
      Object.assign(item, additional);
    }

    if (Object.keys(item).length === 0) {
      throw new Error('Provide at least one field value');
    }

    return [item];
  };

  const executeAction = async (path: 'upload/preview' | 'upload/execute', dryRun = false) => {
    console.log(`🚀 Executing action: ${path}, dryRun: ${dryRun}, mode: ${inputMode}`);
    
    if (!selectedDatasourceKey) {
      throw new Error('Datasource not configured');
    }
    const ds = await getDataSourceSrv().get(selectedDatasourceKey);
    const supportsResources = typeof (ds as any)?.postResource === 'function';
    if (!supportsResources) {
      throw new Error('Datasource does not support upload actions');
    }
    const items = buildItems();
    console.log(`📤 Submitting ${items.length} items:`, items);
    
    // Sanitize items to remove control characters from string values (recursive)
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        // Remove control characters (ASCII < 32 except space, and DEL character 127)
        return value.replace(/[\x00-\x1F\x7F]/g, '');
      } else if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      } else if (value !== null && typeof value === 'object') {
        const sanitized: any = {};
        for (const [k, v] of Object.entries(value)) {
          sanitized[k] = sanitizeValue(v);
        }
        return sanitized;
      }
      return value;
    };
    
    const sanitizedItems = items.map(sanitizeValue);
    
    console.log(`🧹 Sanitized items:`, sanitizedItems);
    
    const payload = {
      presetId: selectedPresetId,
      items: sanitizedItems,
      dryRun,
    };
    
    // Log the payload as JSON to see if there are any issues
    try {
      const jsonTest = JSON.stringify(payload);
      console.log(`✅ Payload serializes successfully (${jsonTest.length} chars)`);
    } catch (err) {
      console.error(`❌ Payload serialization error:`, err);
      throw new Error(`Failed to serialize payload: ${err}`);
    }
    
    return (ds as any).postResource(path, payload);
  };

  const handlePreview = async () => {
    if (!selectedPreset) {
      setActionError('Select an upload preset');
      return;
    }
    setActionError(undefined);
    setActionLoading('preview');
    setPreview(null);
    try {
      const response: UploadPreviewResponse = await executeAction('upload/preview', true);
      setPreview(response);
    } catch (error) {
      const message = extractErrorMessage(error);
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecute = async () => {
    if (!selectedPreset) {
      setActionError('Select an upload preset');
      return;
    }

    // Check for validation errors
    const hasErrors = validationErrors.some((e) => e.severity === 'error');
    if (hasErrors) {
      setActionError('Please fix all validation errors before uploading');
      return;
    }

    setActionError(undefined);
    setActionLoading('execute');
    setExecuteResult(null);
    try {
      const response: UploadExecuteResponse = await executeAction('upload/execute', false);
      setExecuteResult(response);
      setPreview(null);
    } catch (error) {
      const message = extractErrorMessage(error);
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleWizardComplete = async (items: Record<string, unknown>[]) => {
    setShowWizard(false);
    setActionError(undefined);
    setActionLoading('execute');
    setExecuteResult(null);
    
    try {
      if (!selectedDatasourceKey) {
        throw new Error('Datasource not configured');
      }
      
      // Deep sanitize all items to remove control characters
      const sanitizedItems = items.map(item => sanitizeItemDeep(item));
      
      const ds = await getDataSourceSrv().get(selectedDatasourceKey);
      const payload = {
        presetId: selectedPresetId,
        items: sanitizedItems,
        dryRun: false,
      };
      const response: UploadExecuteResponse = await (ds as any).postResource('upload/execute', payload);
      setExecuteResult(response);
    } catch (error) {
      const message = extractErrorMessage(error);
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Deep sanitization function to remove control characters from all string values
  const sanitizeItemDeep = (item: Record<string, unknown>): Record<string, unknown> => {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string') {
        // Remove control characters (0x00-0x1F except tab, newline, carriage return)
        // eslint-disable-next-line no-control-regex
        sanitized[key] = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitizeItemDeep(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(v => 
          typeof v === 'string' 
            // eslint-disable-next-line no-control-regex
            ? v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') 
            : v
        );
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };

  if (showWizard && selectedPreset) {
    return (
      <div className={panelStyles}>
        <UploadWizard
          preset={selectedPreset}
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className={panelStyles}>
      {/* Header */}
      <Card className={headerCardStyles}>
        <div className={headerStyles}>
          <div className={titleSectionStyles}>
            <Icon name="cloud-upload" size="lg" />
            <h3 className={titleStyles}>DynamoDB Upload Panel</h3>
            <HelpTooltip
              title="Upload Data to DynamoDB"
              content="Select a preset, choose your input method, and upload data to DynamoDB. Use Form mode for single records, JSON for custom payloads, File mode for bulk uploads, or Wizard for guided multi-file uploads."
            />
          </div>
        </div>
      </Card>

      {/* Datasource and Preset Selection - Hidden when preset is configured in panel settings */}
      {!isPresetConfiguredByAdmin && (
        <Card className={sectionCardStyles}>
          <div className={responsiveRowStyles}>
            <InlineField 
              label="Datasource"
              labelWidth={14} 
              grow
            >
              <Select
                options={datasources}
                value={selectedDatasource}
                onChange={(value) => setSelectedDatasource(value)}
                placeholder="Select datasource"
                isClearable={false}
              />
            </InlineField>
          </div>

          <div className={responsiveRowStyles}>
            <InlineField label="Preset" labelWidth={14} grow>
              {loadingPresets ? (
                <HorizontalGroup>
                  <Spinner />
                  <span style={{ fontSize: '12px' }}>Loading...</span>
                </HorizontalGroup>
              ) : (
                <Select
                  options={presetOptions}
                  value={selectedPresetId}
                  onChange={(value) => {
                    setSelectedPresetId(value?.value ?? '');
                  }}
                  placeholder="Select preset"
                  isClearable
                />
              )}
            </InlineField>
          </div>

          <div className={responsiveRowStyles}>
            <div style={{ marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>Input Mode</div>
            <RadioButtonGroup
              options={[
                { label: 'Form', value: 'form' },
                { label: 'JSON', value: 'json' },
                { label: 'File', value: 'file' },
                { label: 'Wizard', value: 'wizard' },
              ]}
              value={inputMode}
              onChange={(value) => {
                if (value === 'wizard') {
                  setShowWizard(true);
                } else {
                  setInputMode(value as UploadInputMode);
                }
              }}
              fullWidth
            />
          </div>
        </Card>
      )}
      
      {/* Input Mode for panel-configured preset */}
      {isPresetConfiguredByAdmin && (
        <Card className={sectionCardStyles}>
          <div className={responsiveRowStyles}>
            <div style={{ marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>Input Mode</div>
            <RadioButtonGroup
              options={[
                { label: 'Form', value: 'form' },
                { label: 'JSON', value: 'json' },
                { label: 'File', value: 'file' },
                { label: 'Wizard', value: 'wizard' },
              ]}
              value={inputMode}
              onChange={(value) => {
                if (value === 'wizard') {
                  setShowWizard(true);
                } else {
                  setInputMode(value as UploadInputMode);
                }
              }}
              fullWidth
            />
          </div>
        </Card>
      )}

      {presetError && (
        <Alert severity="error" title="Preset Error">
          {presetError}
        </Alert>
      )}

      {selectedPreset && (
        <>
          {/* Preset Information */}
          <Card className={sectionCardStyles}>
            <Alert severity="info" title={selectedPreset.name}>
              <div className={presetInfoStyles}>
                <div>
                  <Icon name="database" /> <strong>Table:</strong> {selectedPreset.table}
                </div>
                {selectedPreset.index && (
                  <div>
                    <Icon name="list-ul" /> <strong>Index:</strong> {selectedPreset.index}
                  </div>
                )}
                <div>
                  <Icon name="arrow-right" /> <strong>Operation:</strong> {selectedPreset.operation.toUpperCase()}
                </div>
                {selectedPreset.allowDryRun && (
                  <div>
                    <Icon name="check-circle" /> Dry run supported
                  </div>
                )}
              </div>
              {selectedPreset.description && <div className={descriptionStyles}>{selectedPreset.description}</div>}
              {selectedPreset.helpText && (
                <Alert severity="info" title="Help">
                  {selectedPreset.helpText}
                </Alert>
              )}
            </Alert>
          </Card>

          {/* Input Section */}
          <Card className={sectionCardStyles}>
            {inputMode === 'form' && (
              <div style={{ width: '100%' }}>
                {selectedPreset.schema && selectedPreset.schema.length > 0 ? (
                  <>
                    {selectedPreset.schema.map((field) => (
                      <div key={field.name} className={formFieldStyles}>
                        <InlineField
                          label={
                            <>
                              {field.name}
                              {field.required && <span className={requiredStyles}>*</span>}
                            </>
                          }
                          labelWidth={14}
                          grow
                          error={validationErrors.find((e) => e.field === field.name)?.message}
                          invalid={!!validationErrors.find((e) => e.field === field.name)}
                        >
                          <Input
                            value={formValues[field.name] ?? ''}
                            placeholder={field.required ? 'Required' : 'Optional'}
                            onChange={(event) => handleFieldChange(field, event.currentTarget.value)}
                          />
                        </InlineField>
                      </div>
                    ))}
                  </>
                ) : (
                  <Alert severity="warning" title="No schema defined">
                    This preset does not define a schema. Use JSON mode to provide payloads.
                  </Alert>
                )}

                {selectedPreset.allowAdHocFields && (
                  <div className={formFieldStyles}>
                    <InlineField
                      label="Additional fields"
                      labelWidth={14}
                      grow
                    >
                      <TextArea
                        rows={3}
                        value={extraFieldsJson}
                        onChange={(event) => setExtraFieldsJson(event.currentTarget.value)}
                        placeholder='{"field": "value"}'
                      />
                    </InlineField>
                  </div>
                )}
              </div>
            )}

            {inputMode === 'json' && (
              <div style={{ width: '100%' }}>
                <div className={editorLabelStyles}>
                  JSON Payload
                  <HelpTooltip content="Paste JSON in any format - simplified or DynamoDB AttributeValue format. Auto-conversion will handle DynamoDB format automatically." />
                </div>
                {dynamoConversionInfo && (
                  <Alert severity="success" title="Auto-Converted">
                    <div>{dynamoConversionInfo}</div>
                    <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.9 }}>
                      Your DynamoDB format JSON was automatically converted. Check browser console for details.
                    </div>
                  </Alert>
                )}
                {!dynamoConversionInfo && (
                  <Alert severity="info" title="JSON Format">
                    You can paste JSON in either format - we'll auto-convert DynamoDB AttributeValue format:
                    <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
                      <div style={{ color: '#52c41a' }}>✅ Simplified: {`{"name": "John", "age": 30}`}</div>
                      <div style={{ color: '#1890ff', marginTop: '4px' }}>🔄 DynamoDB: {`{"name": {"S": "John"}, "age": {"N": "30"}}`}</div>
                    </div>
                  </Alert>
                )}
                <div style={{ width: '100%', minWidth: '300px' }}>
                  <CodeEditor
                    language="json"
                    height={Math.max(400, height / 1.5)}
                    width="100%"
                    value={jsonPayload}
                    onChange={(value) => setJsonPayload(value ?? '')}
                    showMiniMap={false}
                    showLineNumbers={true}
                  />
                </div>
              </div>
            )}

            {inputMode === 'file' && (
              <div style={{ width: '100%' }}>
                <FileUploader onFilesParsed={handleFilesParsed} onError={setActionError} multiple={true} />
                {parsedFiles.length > 0 && <DataPreview data={parsedFiles} validationErrors={validationErrors} />}
              </div>
            )}
          </Card>

          {/* Validation Feedback */}
          {validationErrors.length > 0 && <ValidationFeedback errors={validationErrors} />}

          {/* Action Buttons */}
          <Card className={sectionCardStyles}>
            <div className={buttonGroupStyles}>
              {selectedPreset.allowDryRun && (
                <Button
                  icon={actionLoading === 'preview' ? undefined : 'search'}
                  onClick={handlePreview}
                  disabled={actionLoading !== null || validationErrors.some((e) => e.severity === 'error')}
                  title="Preview statements"
                  size="sm"
                >
                  {actionLoading === 'preview' ? <Spinner /> : 'Preview'}
                </Button>
              )}
              <Button
                icon={actionLoading === 'execute' ? undefined : 'cloud-upload'}
                variant="primary"
                onClick={handleExecute}
                disabled={actionLoading !== null || validationErrors.some((e) => e.severity === 'error')}
                title="Execute upload"
                size="sm"
              >
                {actionLoading === 'execute' ? <Spinner /> : 'Upload'}
              </Button>
              <Button
                variant="secondary"
                icon="times"
                onClick={() => {
                  setFormValues({});
                  setJsonPayload('');
                  setParsedFiles([]);
                  setExtraFieldsJson('');
                  setPreview(null);
                  setExecuteResult(null);
                  setActionError(undefined);
                  setValidationErrors([]);
                }}
                disabled={actionLoading !== null}
                size="sm"
              >
                Clear
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Error Display */}
      {actionError && (
        <Alert severity="error" title="Upload Error">
          {actionError}
        </Alert>
      )}

      {/* Preview Results */}
      {preview && (
        <Card className={sectionCardStyles}>
          <Alert
            severity="info"
            title={`Preview (${preview.itemCount} statement${preview.itemCount === 1 ? '' : 's'})`}
          >
            <div>
              <strong>Payload size:</strong> {formatBytes(preview.payloadSizeBytes)}
            </div>
            {preview.estimatedCapacity && (
              <div>
                <strong>Estimated capacity:</strong> {preview.estimatedCapacity.toFixed(2)} units
              </div>
            )}
            <div className={statementsContainerStyles}>
              <strong>Statements:</strong>
              {preview.statements.map((statement, index) => (
                <pre key={index} className={statementStyles}>
                  {statement}
                </pre>
              ))}
            </div>
          </Alert>
        </Card>
      )}

      {/* Execute Results */}
      {executeResult && (
        <Card className={sectionCardStyles}>
          <Alert
            severity="success"
            title={`✓ Upload Complete (${executeResult.itemCount} item${executeResult.itemCount === 1 ? '' : 's'})`}
          >
            <div className={resultInfoStyles}>
              <div>
                <Icon name="database" /> <strong>Payload size:</strong> {formatBytes(executeResult.payloadSizeBytes)}
              </div>
              {executeResult.consumedCapacity && executeResult.consumedCapacity.length > 0 && (
                <div>
                  <Icon name="chart-line" /> <strong>Consumed Capacity:</strong>
                  <ul>
                    {executeResult.consumedCapacity.map((entry, idx) => (
                      <li key={idx}>
                        {entry.tableName || 'table'}: <strong>{entry.capacityUnits.toFixed(3)}</strong> units
                        {entry.readUnits && entry.readUnits > 0 && <span> (Read: {entry.readUnits.toFixed(3)})</span>}
                        {entry.writeUnits && entry.writeUnits > 0 && (
                          <span> (Write: {entry.writeUnits.toFixed(3)})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {executeResult.results && executeResult.results.length > 0 && (
              <div>
                <strong>Results:</strong>
                <CodeEditor
                  value={JSON.stringify(executeResult.results, null, 2)}
                  language="json"
                  height={Math.max(120, height / 3)}
                  readOnly
                  showMiniMap={false}
                  showLineNumbers={true}
                />
              </div>
            )}
            {executeResult.warnings && executeResult.warnings.length > 0 && (
              <Alert severity="warning" title="Warnings">
                <ul>
                  {executeResult.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </Alert>
        </Card>
      )}
    </div>
  );
};

function extractErrorMessage(error: unknown): string {
  if (!error) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  const data = (error as any)?.data;
  if (typeof data === 'string') {
    return data;
  }
  if (data?.error) {
    return data.error;
  }
  if (data?.message) {
    return data.message;
  }
  return 'Unexpected error';
}

/**
 * Coerce a row of data to proper types based on preset schema
 */
function coerceRowTypes(row: Record<string, unknown>, preset: UploadPresetSummary): Record<string, unknown> {
  const coercedRow: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(row)) {
    // Find matching field in schema
    const field = preset.schema?.find(f => f.name === key);
    
    if (field && typeof value === 'string') {
      // Apply type coercion based on schema
      try {
        coercedRow[key] = coerceFormValue(field, value);
      } catch (error) {
        // If coercion fails, keep original value
        console.warn(`Failed to coerce field "${key}":`, error);
        coercedRow[key] = value;
      }
    } else if (typeof value === 'string') {
      // For fields without schema, try best-effort type inference
      coercedRow[key] = inferTypeFromString(value);
    } else {
      // Keep non-string values as-is (already properly typed)
      coercedRow[key] = value;
    }
  }
  
  return coercedRow;
}

/**
 * Best-effort type inference for strings without schema
 */
function inferTypeFromString(value: string): unknown {
  const trimmed = value.trim();
  
  // Try boolean
  if (trimmed.toLowerCase() === 'true') {
    return true;
  }
  if (trimmed.toLowerCase() === 'false') {
    return false;
  }
  
  // Try number
  if (trimmed !== '' && !isNaN(Number(trimmed))) {
    return Number(trimmed);
  }
  
  // Keep as string
  return trimmed;
}

function coerceFormValue(field: UploadField, raw: string): unknown {
  const trimmed = raw.trim();
  const effectiveType = resolveFieldType(field);

  switch (effectiveType) {
    case 'number': {
      if (trimmed === '') {
        return undefined;
      }
      const numeric = Number(trimmed);
      if (Number.isNaN(numeric)) {
        throw new Error(`Field "${field.name}" must be a valid number`);
      }
      return numeric;
    }
    case 'boolean': {
      if (['true', 'false'].includes(trimmed.toLowerCase())) {
        return trimmed.toLowerCase() === 'true';
      }
      throw new Error(`Field "${field.name}" must be true or false`);
    }
    case 'json': {
      if (!trimmed) {
        return undefined;
      }
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        throw new Error(`Field "${field.name}" must contain valid JSON`);
      }
    }
    case 'string':
    default:
      return trimmed;
  }
}

function formatBytes(bytes: number): string {
  if (!bytes) {
    return '0 B';
  }
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${sizes[i]}`;
}

// Styles
const headerCardStyles = css`
  margin-bottom: 8px;
  background: linear-gradient(135deg, #1a1e23 0%, #252a31 100%);
  border: 1px solid #333;
`;

const headerStyles = css`
  padding: 8px 12px;
`;

const titleSectionStyles = css`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const titleStyles = css`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #d8d9da;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const sectionCardStyles = css`
  margin-bottom: 8px;
  background-color: #1a1e23;
  border: 1px solid #333;
  padding: 12px;
  
  @media (max-width: 768px) {
    padding: 8px;
  }
`;

const presetInfoStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  
  & > div {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  @media (max-width: 768px) {
    font-size: 11px;
    gap: 6px;
  }
`;

const descriptionStyles = css`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #333;
  color: #d8d9da;
  font-size: 13px;
`;

const requiredStyles = css`
  color: #f55;
  margin-left: 2px;
`;

const editorLabelStyles = css`
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const statementsContainerStyles = css`
  margin-top: 8px;
`;

const statementStyles = css`
  background-color: #0b0c0e;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #333;
  margin: 4px 0;
  overflow-x: auto;
  font-size: 11px;
  color: #52c41a;
  word-break: break-all;
  
  @media (max-width: 768px) {
    font-size: 10px;
    padding: 6px;
  }
`;

const resultInfoStyles = css`
  font-size: 13px;
  
  & > div {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  
  ul {
    margin: 4px 0 0 20px;
    padding: 0;
  }
  
  li {
    margin-bottom: 4px;
  }
  
  @media (max-width: 768px) {
    font-size: 12px;
    
    ul {
      margin-left: 16px;
    }
  }
`;

const responsiveRowStyles = css`
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const formFieldStyles = css`
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const buttonGroupStyles = css`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
  
  button {
    flex: 0 1 auto;
    min-width: 80px;
  }
  
  @media (max-width: 768px) {
    gap: 6px;
    
    button {
      font-size: 12px;
      padding: 4px 8px;
    }
  }
`;
