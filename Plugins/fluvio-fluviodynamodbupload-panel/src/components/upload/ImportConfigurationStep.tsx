import React, { useState, useEffect } from 'react';
import { Alert, Button, Field, Input, RadioButtonGroup, Select } from '@grafana/ui';
import { css } from '@emotion/css';
import { UploadPresetSummary } from '../../types';
import { CanonicalFieldType } from '../../utils/dynamoTypes';

export interface ImportConfiguration {
  hasHeaders: boolean;
  headerRow: number; // 0-based
  startDataRow: number; // 0-based
  columnMappings: ColumnMapping[];
}

export interface ColumnMapping {
  sourceColumnIndex: number;
  sourceColumnName: string;
  targetField: string | null; // null means skip this column
  detectedType: CanonicalFieldType;
  overrideType?: CanonicalFieldType;
}

interface ImportConfigurationStepProps {
  rawData: string[][]; // Raw CSV rows (all of them)
  preset: UploadPresetSummary;
  onConfigured: (config: ImportConfiguration, processedData: Record<string, unknown>[]) => void;
  onBack: () => void;
}

export const ImportConfigurationStep: React.FC<ImportConfigurationStepProps> = ({
  rawData,
  preset,
  onConfigured,
  onBack,
}) => {
  const [hasHeaders, setHasHeaders] = useState(true);
  const [headerRow, setHeaderRow] = useState(0);
  const [startDataRow, setStartDataRow] = useState(1);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  
  const previewRowCount = 5;

  // Initialize column mappings when raw data or config changes
  useEffect(() => {
    if (rawData.length === 0) {
      return;
    }

    const headerRowData = hasHeaders && rawData[headerRow] ? rawData[headerRow] : [];
    const firstDataRowIndex = hasHeaders ? Math.max(headerRow + 1, startDataRow) : startDataRow;
    const sampleData = rawData.slice(firstDataRowIndex, firstDataRowIndex + 5);

    const numColumns = Math.max(...rawData.slice(0, 10).map(row => row.length));
    const mappings: ColumnMapping[] = [];

    for (let i = 0; i < numColumns; i++) {
      const columnName = hasHeaders && headerRowData[i] 
        ? headerRowData[i].trim() 
        : `Column ${i + 1}`;
      
      // Auto-match to preset fields (if schema exists) OR use column name as-is
      let targetField: string | null = null;
      
      if (preset.schema && preset.schema.length > 0) {
        // Try to match to schema fields
        const matchedField = preset.schema.find(
          f => f.name.toLowerCase() === columnName.toLowerCase()
        );
        targetField = matchedField?.name || null;
      } else {
        // No schema defined, map all columns by their names (auto-map everything)
        targetField = columnName || null;
      }

      // Detect type from sample data
      const sampleValues = sampleData.map(row => row[i]).filter(v => v != null && v !== '');
      const detectedType = detectType(sampleValues);

      mappings.push({
        sourceColumnIndex: i,
        sourceColumnName: columnName,
        targetField,
        detectedType,
      });
    }

    setColumnMappings(mappings);
  }, [rawData, hasHeaders, headerRow, startDataRow, preset.schema]);

  const handleApply = () => {
    // Process data according to configuration
    const firstDataRowIndex = hasHeaders ? Math.max(headerRow + 1, startDataRow) : startDataRow;
    const dataRows = rawData.slice(firstDataRowIndex);

    const processedData: Record<string, unknown>[] = [];

    for (const row of dataRows) {
      const item: Record<string, unknown> = {};
      let hasData = false;

      for (const mapping of columnMappings) {
        if (mapping.targetField && row[mapping.sourceColumnIndex] != null) {
          const rawValue = row[mapping.sourceColumnIndex];
          if (rawValue !== '') {
            const type = mapping.overrideType || mapping.detectedType;
            item[mapping.targetField] = convertValue(rawValue, type);
            hasData = true;
          }
        }
      }

      // Only include rows that have at least one field
      if (hasData) {
        processedData.push(item);
      }
    }

    const config: ImportConfiguration = {
      hasHeaders,
      headerRow,
      startDataRow: firstDataRowIndex,
      columnMappings,
    };

    onConfigured(config, processedData);
  };

  const updateMapping = (index: number, updates: Partial<ColumnMapping>) => {
    setColumnMappings(prev => 
      prev.map((m, i) => i === index ? { ...m, ...updates } : m)
    );
  };

  const previewData = rawData.slice(0, Math.min(headerRow + previewRowCount + 2, rawData.length));
  
  // Build field options: include preset schema fields AND all discovered column names
  const fieldOptionsSet = new Set<string>();
  
  // Add preset schema fields first
  if (preset.schema && preset.schema.length > 0) {
    preset.schema.forEach(f => fieldOptionsSet.add(f.name));
  }
  
  // Add all column names from the data
  columnMappings.forEach(m => {
    if (m.sourceColumnName) {
      fieldOptionsSet.add(m.sourceColumnName);
    }
  });
  
  const fieldOptions = Array.from(fieldOptionsSet)
    .sort()
    .map(name => ({ label: name, value: name }));
  
  fieldOptions.unshift({ label: '(Skip this column)', value: '' });

  const typeOptions: Array<{ label: string; value: CanonicalFieldType }> = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'JSON', value: 'json' },
  ];

  return (
    <div className={containerStyles}>
      <Alert severity="info" title="Configure Import">
        Configure how your file should be imported. Similar to Excel's Text Import Wizard.
      </Alert>

      {/* Step 1: Header and Start Row Configuration */}
      <div className={sectionStyles}>
        <h4 className={sectionTitleStyles}>📍 Data Location</h4>
        
        <Field label="Does your data have headers?">
          <RadioButtonGroup
            options={[
              { label: 'Yes, first row contains headers', value: 'yes' },
              { label: 'No, data starts immediately', value: 'no' },
            ]}
            value={hasHeaders ? 'yes' : 'no'}
            onChange={(value) => {
              const newHasHeaders = value === 'yes';
              setHasHeaders(newHasHeaders);
              setStartDataRow(newHasHeaders ? 1 : 0);
            }}
          />
        </Field>

        {hasHeaders && (
          <Field label="Header row number" description="Which row contains the column names? (1-based)">
            <Input
              type="number"
              min={1}
              max={Math.max(1, rawData.length)}
              value={headerRow + 1}
              onChange={(e) => {
                const row = Math.max(0, parseInt(e.currentTarget.value, 10) - 1);
                setHeaderRow(row);
                setStartDataRow(Math.max(row + 1, startDataRow));
              }}
              width={10}
            />
          </Field>
        )}

        <Field label="Start importing from row" description="Skip rows before this (1-based)">
          <Input
            type="number"
            min={hasHeaders ? headerRow + 2 : 1}
            max={Math.max(1, rawData.length)}
            value={startDataRow + 1}
            onChange={(e) => {
              const row = Math.max(0, parseInt(e.currentTarget.value, 10) - 1);
              setStartDataRow(row);
            }}
            width={10}
          />
        </Field>
      </div>

      {/* Preview of raw data with row numbers */}
      <div className={sectionStyles}>
        <h4 className={sectionTitleStyles}>👀 Data Preview</h4>
        <div className={previewTableStyles}>
          <table>
            <thead>
              <tr>
                <th>Row</th>
                {previewData[0]?.map((_, colIndex) => (
                  <th key={colIndex}>Col {colIndex + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={
                    rowIndex === headerRow && hasHeaders
                      ? headerRowStyles
                      : rowIndex === startDataRow
                      ? startRowStyles
                      : rowIndex > startDataRow
                      ? dataRowStyles
                      : ''
                  }
                >
                  <td className={rowNumberStyles}>
                    {rowIndex + 1}
                    {rowIndex === headerRow && hasHeaders && ' 📋'}
                    {rowIndex === startDataRow && ' ▶️'}
                  </td>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell || <span style={{ opacity: 0.3 }}>(empty)</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={legendStyles}>
          <span className={headerLegendStyles}>📋 Header Row</span>
          <span className={startLegendStyles}>▶️ Data Starts Here</span>
          <span className={dataLegendStyles}>Data Rows</span>
        </div>
      </div>

      {/* Step 2: Column Mapping */}
      <div className={sectionStyles}>
        <h4 className={sectionTitleStyles}>🔗 Column Mapping & Types</h4>
        <div className={mappingTableStyles}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '30px' }}>#</th>
                <th>Source Column</th>
                <th>Target Field</th>
                <th>Detected Type</th>
                <th>Override Type</th>
              </tr>
            </thead>
            <tbody>
              {columnMappings.map((mapping, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{mapping.sourceColumnName}</strong>
                  </td>
                  <td>
                    <Select
                      options={fieldOptions}
                      value={mapping.targetField || ''}
                      onChange={(option) => updateMapping(index, { targetField: option.value || null })}
                      placeholder="Skip"
                    />
                  </td>
                  <td>
                    <span className={typeChipStyles(mapping.detectedType)}>
                      {mapping.detectedType}
                    </span>
                  </td>
                  <td>
                    <Select
                      options={typeOptions}
                      value={mapping.overrideType || mapping.detectedType}
                      onChange={(option) => updateMapping(index, { overrideType: option.value as CanonicalFieldType })}
                      placeholder="Auto"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className={actionsStyles}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={handleApply}>
          Apply & Continue
        </Button>
      </div>
    </div>
  );
};

// Helper functions
function detectType(values: string[]): CanonicalFieldType {
  if (values.length === 0) {
    return 'string';
  }

  let allNumbers = true;
  let allBooleans = true;

  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed === '') {
      continue;
    }

    // Check if it's a number
    if (allNumbers && isNaN(Number(trimmed))) {
      allNumbers = false;
    }

    // Check if it's a boolean
    if (allBooleans && !['true', 'false', '0', '1', 'yes', 'no'].includes(trimmed.toLowerCase())) {
      allBooleans = false;
    }
  }

  if (allNumbers) {
    return 'number';
  }
  if (allBooleans) {
    return 'boolean';
  }
  return 'string';
}

function sanitizeControlCharacters(value: string): string {
  // Remove control characters (0x00-0x1F except tab, newline, carriage return)
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function convertValue(value: string, type: CanonicalFieldType): unknown {
  // First sanitize control characters
  const sanitized = sanitizeControlCharacters(value);
  const trimmed = sanitized.trim();

  switch (type) {
    case 'number':
      const num = Number(trimmed);
      return isNaN(num) ? trimmed : num;
    
    case 'boolean':
      const lower = trimmed.toLowerCase();
      if (['true', '1', 'yes'].includes(lower)) {
        return true;
      }
      if (['false', '0', 'no'].includes(lower)) {
        return false;
      }
      return trimmed;
    
    case 'json':
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    
    case 'string':
    default:
      return trimmed;
  }
}

// Styles
const containerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const sectionStyles = css`
  background-color: #252a31;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #333;
`;

const sectionTitleStyles = css`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px 0;
`;

const previewTableStyles = css`
  overflow-x: auto;
  border: 1px solid #333;
  border-radius: 4px;
  margin-bottom: 8px;

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  th {
    background-color: #1a1e23;
    padding: 8px;
    text-align: left;
    border-bottom: 2px solid #333;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  td {
    padding: 6px 8px;
    border-bottom: 1px solid #333;
  }

  tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const rowNumberStyles = css`
  background-color: #1a1e23;
  font-weight: 600;
  text-align: center;
  position: sticky;
  left: 0;
  z-index: 1;
`;

const headerRowStyles = css`
  background-color: rgba(110, 159, 255, 0.15) !important;
  font-weight: 600;
`;

const startRowStyles = css`
  background-color: rgba(82, 196, 26, 0.15) !important;
`;

const dataRowStyles = css`
  background-color: rgba(82, 196, 26, 0.05);
`;

const legendStyles = css`
  display: flex;
  gap: 16px;
  font-size: 12px;
`;

const headerLegendStyles = css`
  color: #6e9fff;
`;

const startLegendStyles = css`
  color: #52c41a;
`;

const dataLegendStyles = css`
  color: #52c41a;
  opacity: 0.7;
`;

const mappingTableStyles = css`
  overflow-x: auto;
  border: 1px solid #333;
  border-radius: 4px;

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  th {
    background-color: #1a1e23;
    padding: 10px;
    text-align: left;
    border-bottom: 2px solid #333;
    font-weight: 600;
  }

  td {
    padding: 8px 10px;
    border-bottom: 1px solid #333;
  }
`;

const typeChipStyles = (type: string) => css`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background-color: ${type === 'number' ? 'rgba(24, 144, 255, 0.2)' : type === 'boolean' ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 152, 48, 0.2)'};
  color: ${type === 'number' ? '#1890ff' : type === 'boolean' ? '#52c41a' : '#ff9830'};
`;

const actionsStyles = css`
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #333;
`;

