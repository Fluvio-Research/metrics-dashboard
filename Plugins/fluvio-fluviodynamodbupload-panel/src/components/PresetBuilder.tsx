import React, { useState, useEffect } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import {
  Button,
  Field,
  Input,
  Select,
  Icon,
  Alert,
  IconButton,
} from '@grafana/ui';
import { css } from '@emotion/css';
import { CanonicalFieldType, formatDynamoTypeLabel, mapDynamoTypeToCanonical } from '../utils/dynamoTypes';

interface PresetBuilderProps extends StandardEditorProps<string> {}

interface TableInfo {
  tableName: string;
  attributes: Array<{ name: string; canonicalType: CanonicalFieldType; dynamoType?: string }>;
}

export const PresetBuilder: React.FC<PresetBuilderProps> = ({ value, onChange, context }) => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [presetName, setPresetName] = useState('');
  const [operation, setOperation] = useState('insert');
  const [fields, setFields] = useState<
    Array<{ name: string; type: string; required: boolean; dynamoType?: string; detectedLabel?: string }>
  >([]);
  const [error, setError] = useState<string>();
  const [description, setDescription] = useState('');

  // Load tables from DynamoDB
  const loadTables = async () => {
    setLoadingTables(true);
    setError(undefined);
    
    try {
      // Get all datasources
      const allDs = await getDataSourceSrv().getList();
      const dynamoDs = allDs.find(ds => ds.type === 'fluvio-connect-dynamodb' || ds.type?.includes('dynamodb'));
      
      if (!dynamoDs) {
        setError('⚠️ No DynamoDB datasource found. Please go to Connections → Data Sources and add a Fluvio DynamoDB datasource first.');
        return;
      }

      const ds = await getDataSourceSrv().get(dynamoDs.uid);
      
      // Get tables list
      if (typeof (ds as any)?.getResource === 'function') {
        const response = await (ds as any).getResource('tables');
        const tableNames: string[] = response?.tables || [];
        
        // For each table, try to get attributes with types
        const tableInfos: TableInfo[] = [];
        for (const tableName of tableNames) {
          try {
            const attrResponse = await (ds as any).getResource(`table-attributes?table=${encodeURIComponent(tableName)}`);
            console.log(`📊 Table "${tableName}" response:`, attrResponse);
            
            const attrs = attrResponse?.attributes || [];
            const attrTypes = attrResponse?.types || {};
            
            console.log(`  - Attributes: ${attrs.join(', ')}`);
            console.log(`  - Types:`, attrTypes);
            
            const attributesWithTypes = attrs.map((attrName: string) => {
              const rawType = attrTypes[attrName] || 'S';
              const canonicalType = mapDynamoTypeToCanonical(rawType);
              const label = formatDynamoTypeLabel(canonicalType, rawType);
              console.log(`    ✓ ${attrName}:`);
              console.log(`      - Raw DynamoDB Type: "${rawType}"`);
              console.log(`      - Canonical Type: "${canonicalType}"`);
              console.log(`      - Label: "${label}"`);
              return {
                name: attrName,
                canonicalType,
                dynamoType: rawType,
              };
            });
            
            tableInfos.push({
              tableName,
              attributes: attributesWithTypes,
            });
          } catch (err) {
            console.error(`❌ Failed to load attributes for table "${tableName}":`, err);
            // If we can't get attributes, just add the table with no attributes
            tableInfos.push({
              tableName,
              attributes: [],
            });
          }
        }
        
        setTables(tableInfos);
      } else {
        setError('Datasource does not support table listing');
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
      setError('❌ Failed to load tables. Make sure your DynamoDB datasource is configured with valid AWS credentials.');
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleAddField = () => {
    setFields([
      ...fields,
      { name: '', type: 'string', required: false, dynamoType: undefined, detectedLabel: undefined },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const handleLoadFieldsFromTable = () => {
    if (!selectedTable) return;
    
    const table = tables.find(t => t.tableName === selectedTable);
    if (table && table.attributes) {
      const newFields = table.attributes.map(attr => ({
        name: attr.name,
        type: attr.canonicalType,
        required: false,
        dynamoType: attr.dynamoType,
        detectedLabel: formatDynamoTypeLabel(attr.canonicalType, attr.dynamoType),
      }));
      setFields(newFields);
    }
  };

  const handleSave = () => {
    if (!presetName.trim()) {
      setError('❌ Please enter a template name');
      return;
    }
    if (!selectedTable) {
      setError('❌ Please select a table');
      return;
    }
    if (fields.length === 0) {
      setError('❌ Please add at least one field');
      return;
    }

    const preset = {
      id: presetName.toLowerCase().replace(/\s+/g, '-'),
      name: presetName,
      description: description || undefined,
      table: selectedTable,
      operation,
      schema: fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required,
        description: f.detectedLabel ? `Auto-detected as ${f.detectedLabel}` : undefined,
        dynamoType: f.dynamoType,
      })),
      allowDryRun: true,
      allowAdHocFields: true,
      maxPayloadKB: 512,
    };

    // Save as JSON string
    const presetJson = JSON.stringify(preset, null, 2);
    onChange(presetJson);
    console.log('✅ Preset saved to panel options:', preset);
    setError(undefined);
  };

  const tableOptions = tables.map(t => ({
    label: t.tableName,
    value: t.tableName,
    description: `${t.attributes?.length || 0} attributes`,
  }));

  const operationOptions = [
    { label: '➕ Insert (Add New Records)', value: 'insert' },
    { label: '✏️ Update (Modify Records)', value: 'update' },
    { label: '🗑️ Delete (Remove Records)', value: 'delete' },
    { label: '🔍 Select (Query Records)', value: 'select' },
  ];

  const typeOptions = [
    { label: '📝 String', value: 'string', description: 'String (S), Binary (B)' },
    { label: '🔢 Number', value: 'number', description: 'Number (N), IDs, Counts' },
    { label: '✓ Boolean', value: 'boolean', description: 'Boolean (BOOL), true/false' },
    { label: '{ } JSON', value: 'json', description: 'Map (M), List (L), Sets (SS/NS/BS)' },
  ];

  return (
    <div className={containerStyles}>
      <Alert severity="info" title="✨ Easy Preset Builder">
        <div>Create upload templates in 3 simple steps:</div>
        <div style={{ marginTop: '4px', fontSize: '12px' }}>
          Choose table → Name it → Auto-load fields → Save!
        </div>
      </Alert>

      {error && (
        <Alert severity="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Step 1: Choose Table */}
      <div className={stepContainerStyles}>
        <div className={stepHeaderStyles}>
          <Icon name="database" size="lg" className={stepIconStyles} />
          <div>
            <div className={stepTitleStyles}>Step 1: Choose Database Table</div>
            <div className={stepDescStyles}>Pick which table you want to upload data to</div>
          </div>
        </div>
        
        <Field label="Select Table">
          <div className={fieldGroupStyles}>
            <Select
              options={tableOptions}
              value={selectedTable}
              onChange={(option) => setSelectedTable(option?.value || '')}
              placeholder={loadingTables ? 'Loading...' : 'Choose a table'}
              disabled={loadingTables}
            />
            <Button icon="sync" onClick={loadTables} disabled={loadingTables} size="sm" variant="secondary">
              Reload
            </Button>
          </div>
        </Field>
      </div>

      {/* Step 2: Configure Upload */}
      {selectedTable && (
        <div className={stepContainerStyles}>
          <div className={stepHeaderStyles}>
            <Icon name="cog" size="lg" className={stepIconStyles} />
            <div>
              <div className={stepTitleStyles}>Step 2: Name & Configure</div>
              <div className={stepDescStyles}>Give it a name and choose what to do</div>
            </div>
          </div>

          <Field label="Template Name" description="What should we call this?">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.currentTarget.value)}
              placeholder="e.g., Add New Locations"
            />
          </Field>

          <Field label="Description (Optional)" description="Explain what this template does">
            <Input
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              placeholder="e.g., Upload location data for Solomon Islands sites"
            />
          </Field>

          <Field label="What Action?" description="What do you want to do with the data?">
            <Select
              options={operationOptions}
              value={operation}
              onChange={(option) => setOperation(option?.value || 'insert')}
            />
          </Field>
        </div>
      )}

      {/* Step 3: Add Fields */}
      {selectedTable && presetName && (
        <div className={stepContainerStyles}>
          <div className={stepHeaderStyles}>
            <Icon name="list-ul" size="lg" className={stepIconStyles} />
            <div className={stepTitleContainerStyles}>
              <div className={stepTitleStyles}>Step 3: Add Fields</div>
              <div className={stepDescStyles}>Choose which fields users can fill in</div>
            </div>
          </div>
          <div className={stepActionsStyles}>
            <Button size="sm" icon="download-alt" onClick={handleLoadFieldsFromTable} variant="primary">
              Auto-Load Fields
            </Button>
            <Button size="sm" icon="plus" variant="secondary" onClick={handleAddField}>
              Add Manually
            </Button>
          </div>

          {fields.length === 0 ? (
            <Alert severity="info" title="💡 Tip">
              Click "Auto-Load Fields" to automatically add all fields from your table with their correct types!
            </Alert>
          ) : (
            <div className={fieldsListStyles}>
              <div className={fieldsHeaderStyles}>
                <span style={{ flex: '1 1 180px' }}>Field Name</span>
                <span style={{ flex: '0 0 140px' }}>Type</span>
                <span style={{ flex: '0 0 80px', textAlign: 'center' }}>Required?</span>
                <span style={{ flex: '0 0 40px' }}></span>
              </div>
              {fields.map((field, index) => (
                <div key={index} className={fieldCardStyles}>
                  <div className={fieldRowStyles}>
                    <Input
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.currentTarget.value)}
                      placeholder="field_name"
                      className={fieldInputStyles}
                    />
                    
                    <Select
                      options={typeOptions}
                      value={field.type}
                      onChange={(option) => handleFieldChange(index, 'type', option?.value)}
                      className={fieldTypeStyles}
                    />
                    
                    <div className={checkboxContainerStyles}>
                      <label className={checkboxLabelContainerStyles}>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                          className={checkboxStyles}
                        />
                        <span className={checkboxLabelStyles}>Required</span>
                      </label>
                    </div>
                    
                    <IconButton
                      name="trash-alt"
                      tooltip="Remove"
                      onClick={() => handleRemoveField(index)}
                      size="sm"
                      className={deleteButtonStyles}
                    />
                  </div>
                  {field.detectedLabel && (
                    <div className={detectedTypeStyles}>
                      🤖 DynamoDB type: <strong>{field.detectedLabel}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      {selectedTable && presetName && fields.length > 0 && (
        <div className={saveSection}>
          <Button size="lg" icon="save" variant="primary" onClick={handleSave} className={saveButtonStyles}>
            💾 Save Upload Template
          </Button>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className={previewStyles}>
          <div className={previewHeaderStyles}>
            <Icon name="check-circle" style={{ color: '#52c41a' }} />
            <span>Template Saved Successfully!</span>
          </div>
          <div className={previewContentStyles}>
            <details>
              <summary>View Configuration</summary>
              <pre>{value}</pre>
            </details>
            <div className={saveDashboardReminderStyles}>
              <Icon name="info-circle" style={{ color: '#ff9830' }} />
              <span><strong>💾 Important:</strong> Don't forget to save the dashboard to persist this template! Use the Save button at the top of Grafana.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
`;

const stepContainerStyles = css`
  padding: 12px;
  background-color: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
`;

const stepHeaderStyles = css`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
`;

const stepIconStyles = css`
  color: #6e9fff;
  flex-shrink: 0;
  margin-top: 2px;
`;

const stepTitleContainerStyles = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const stepTitleStyles = css`
  font-size: 14px;
  font-weight: 500;
  color: #d8d9da;
  line-height: 1.2;
`;

const stepDescStyles = css`
  font-size: 11px;
  color: #999;
  line-height: 1.3;
`;

const stepActionsStyles = css`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const fieldGroupStyles = css`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: start;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const fieldsListStyles = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const fieldsHeaderStyles = css`
  display: none;
`;

const fieldCardStyles = css`
  padding: 8px;
  background-color: rgba(26, 30, 35, 0.5);
  border: 1px solid #2a2e33;
  border-radius: 2px;
  margin-bottom: 4px;
`;

const fieldRowStyles = css`
  display: grid;
  grid-template-columns: 1fr 140px 80px 32px;
  gap: 8px;
  align-items: center;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`;

const fieldInputStyles = css`
  @media (max-width: 600px) {
    grid-column: 1 / -1;
  }
`;

const fieldTypeStyles = css`
  @media (max-width: 600px) {
    grid-column: 1 / -1;
  }
`;

const checkboxContainerStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 600px) {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
`;

const checkboxLabelContainerStyles = css`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
`;

const checkboxStyles = css`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const checkboxLabelStyles = css`
  font-size: 11px;
  color: #d8d9da;
  user-select: none;
`;

const deleteButtonStyles = css`
  @media (max-width: 600px) {
    grid-column: 1 / -1;
  }
`;

const detectedTypeStyles = css`
  margin-top: 4px;
  padding: 4px 6px;
  background-color: rgba(82, 196, 26, 0.1);
  border-left: 2px solid #52c41a;
  font-size: 10px;
  color: #95de64;
  border-radius: 2px;
`;

const saveSection = css`
  margin-top: 8px;
  padding: 12px;
  background: rgba(82, 196, 26, 0.15);
  border-radius: 4px;
  border: 1px solid rgba(82, 196, 26, 0.3);
`;

const saveButtonStyles = css`
  width: 100%;
  font-size: 13px;
  font-weight: 600;
`;

const previewStyles = css`
  margin-top: 8px;
  padding: 8px;
  background-color: rgba(82, 196, 26, 0.1);
  border: 1px solid rgba(82, 196, 26, 0.3);
  border-radius: 4px;
  
  details {
    cursor: pointer;
    
    summary {
      font-size: 11px;
      color: #52c41a;
      padding: 4px;
      font-weight: 500;
      
      &:hover {
        color: #95de64;
      }
    }
  }
`;

const previewHeaderStyles = css`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #52c41a;
`;

const previewContentStyles = css`
  pre {
    margin: 6px 0 0 0;
    padding: 6px;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    color: #d8d9da;
    font-size: 10px;
    max-height: 150px;
  }
`;

const saveDashboardReminderStyles = css`
  margin-top: 12px;
  padding: 8px;
  background-color: rgba(255, 152, 48, 0.1);
  border: 1px solid rgba(255, 152, 48, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #ff9830;
`;
