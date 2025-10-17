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
  ConfirmModal,
} from '@grafana/ui';
import { css } from '@emotion/css';
import { CanonicalFieldType, formatDynamoTypeLabel, mapDynamoTypeToCanonical } from '../utils/dynamoTypes';

interface PresetManagerProps extends StandardEditorProps<string> {}

interface TableInfo {
  tableName: string;
  attributes: Array<{ name: string; canonicalType: CanonicalFieldType; dynamoType?: string }>;
}

interface SavedPreset {
  id: string;
  name: string;
  description?: string;
  table: string;
  operation: string;
  schema: Array<{
    name: string;
    type: string;
    required: boolean;
    dynamoType?: string;
    description?: string;
  }>;
}

export const PresetManager: React.FC<PresetManagerProps> = ({ value, onChange, context }) => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  
  // Form state
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
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
  const [success, setSuccess] = useState<string>();
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<SavedPreset | null>(null);

  // Load saved presets
  const loadPresets = async () => {
    setLoadingPresets(true);
    setError(undefined);
    
    try {
      const allDs = await getDataSourceSrv().getList();
      const dynamoDs = allDs.find(ds => ds.type === 'fluvio-connect-dynamodb' || ds.type?.includes('dynamodb'));
      
      if (!dynamoDs) {
        setError('⚠️ No DynamoDB datasource found.');
        return;
      }

      const ds = await getDataSourceSrv().get(dynamoDs.uid);
      
      if (typeof (ds as any)?.getResource === 'function') {
        const response = await (ds as any).getResource('presets');
        console.log('📋 Loaded presets:', response);
        setSavedPresets(response?.presets || []);
      }
    } catch (err) {
      console.error('Failed to load presets:', err);
      setError('❌ Failed to load presets. ' + (err instanceof Error ? err.message : ''));
    } finally {
      setLoadingPresets(false);
    }
  };

  // Load tables
  const loadTables = async () => {
    setLoadingTables(true);
    setError(undefined);
    
    try {
      const allDs = await getDataSourceSrv().getList();
      const dynamoDs = allDs.find(ds => ds.type === 'fluvio-connect-dynamodb' || ds.type?.includes('dynamodb'));
      
      if (!dynamoDs) {
        setError('⚠️ No DynamoDB datasource found.');
        return;
      }

      const ds = await getDataSourceSrv().get(dynamoDs.uid);
      
      if (typeof (ds as any)?.getResource === 'function') {
        const response = await (ds as any).getResource('tables');
        const tableNames: string[] = response?.tables || [];
        
        const tableInfos: TableInfo[] = [];
        for (const tableName of tableNames) {
          try {
            const attrResponse = await (ds as any).getResource(`table-attributes?table=${encodeURIComponent(tableName)}`);
            const attrs = attrResponse?.attributes || [];
            const attrTypes = attrResponse?.types || {};
            
            const attributesWithTypes = attrs.map((attrName: string) => {
              const rawType = attrTypes[attrName] || 'S';
              const canonicalType = mapDynamoTypeToCanonical(rawType);
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
            tableInfos.push({
              tableName,
              attributes: [],
            });
          }
        }
        
        setTables(tableInfos);
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
      setError('❌ Failed to load tables.');
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    if (view === 'create' || view === 'edit') {
      loadTables();
    }
  }, [view]);

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

  const handleSave = async () => {
    setError(undefined);
    setSuccess(undefined);
    
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

    const preset: any = {
      id: editingPresetId || presetName.toLowerCase().replace(/\s+/g, '-'),
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

    try {
      const allDs = await getDataSourceSrv().getList();
      const dynamoDs = allDs.find(ds => ds.type === 'fluvio-connect-dynamodb' || ds.type?.includes('dynamodb'));
      
      if (!dynamoDs) {
        setError('⚠️ No DynamoDB datasource found.');
        return;
      }

      const ds = await getDataSourceSrv().get(dynamoDs.uid);
      
      if (typeof (ds as any)?.postResource === 'function') {
        const response = await (ds as any).postResource('presets', preset);
        console.log('✅ Preset saved:', response);
        setSuccess(`✅ Preset "${preset.name}" saved successfully!`);
        
        // Reload presets
        await loadPresets();
        
        // Switch back to list view after a delay
        setTimeout(() => {
          setView('list');
          resetForm();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to save preset:', err);
      setError('❌ Failed to save preset. ' + (err instanceof Error ? err.message : ''));
    }
  };

  const handleEdit = (preset: SavedPreset) => {
    setEditingPresetId(preset.id);
    setPresetName(preset.name);
    setDescription(preset.description || '');
    setSelectedTable(preset.table);
    setOperation(preset.operation);
    setFields(preset.schema.map(f => ({
      name: f.name,
      type: f.type,
      required: f.required,
      dynamoType: f.dynamoType,
      detectedLabel: f.description,
    })));
    setView('edit');
  };

  const handleDeleteClick = (preset: SavedPreset) => {
    setPresetToDelete(preset);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!presetToDelete) return;
    
    try {
      const allDs = await getDataSourceSrv().getList();
      const dynamoDs = allDs.find(ds => ds.type === 'fluvio-connect-dynamodb' || ds.type?.includes('dynamodb'));
      
      if (!dynamoDs) {
        setError('⚠️ No DynamoDB datasource found.');
        return;
      }

      const ds = await getDataSourceSrv().get(dynamoDs.uid);
      
      if (typeof (ds as any)?.deleteResource === 'function') {
        await (ds as any).deleteResource(`presets/${presetToDelete.id}`);
        console.log('✅ Preset deleted:', presetToDelete.id);
        setSuccess(`✅ Preset "${presetToDelete.name}" deleted successfully!`);
        
        // Reload presets
        await loadPresets();
      }
    } catch (err) {
      console.error('Failed to delete preset:', err);
      setError('❌ Failed to delete preset. ' + (err instanceof Error ? err.message : ''));
    } finally {
      setDeleteConfirmOpen(false);
      setPresetToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingPresetId(null);
    setPresetName('');
    setDescription('');
    setSelectedTable('');
    setOperation('insert');
    setFields([]);
    setError(undefined);
    setSuccess(undefined);
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

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className={containerStyles}>
        <Alert severity="info" title="📚 Preset Library">
          <div>Saved upload templates that can be used across all dashboards</div>
        </Alert>

        {error && <Alert severity="error" title="Error">{error}</Alert>}
        {success && <Alert severity="success" title="Success">{success}</Alert>}

        <div className={listHeaderStyles}>
          <Button icon="plus" onClick={() => { resetForm(); setView('create'); }} variant="primary">
            Create New Preset
          </Button>
          <Button icon="sync" onClick={loadPresets} disabled={loadingPresets} variant="secondary">
            Reload
          </Button>
        </div>

        {loadingPresets ? (
          <div className={loadingStyles}>Loading presets...</div>
        ) : savedPresets.length === 0 ? (
          <div className={emptyStateStyles}>
            <Icon name="folder" size="xxl" />
            <div>No presets found</div>
            <div style={{ fontSize: '12px', color: '#999' }}>Create your first preset to get started</div>
          </div>
        ) : (
          <div className={presetsListStyles}>
            {savedPresets.map(preset => (
              <div key={preset.id} className={presetCardStyles}>
                <div className={presetHeaderStyles}>
                  <div>
                    <div className={presetTitleStyles}>{preset.name}</div>
                    {preset.description && <div className={presetDescStyles}>{preset.description}</div>}
                  </div>
                  <div className={presetActionsStyles}>
                    <IconButton name="edit" tooltip="Edit" onClick={() => handleEdit(preset)} />
                    <IconButton name="trash-alt" tooltip="Delete" onClick={() => handleDeleteClick(preset)} />
                  </div>
                </div>
                <div className={presetDetailsStyles}>
                  <div><Icon name="database" /> {preset.table}</div>
                  <div><Icon name="arrow-right" /> {preset.operation.toUpperCase()}</div>
                  <div><Icon name="list-ul" /> {preset.schema?.length || 0} fields</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {deleteConfirmOpen && presetToDelete && (
          <ConfirmModal
            isOpen={true}
            title="Delete Preset"
            body={`Are you sure you want to delete "${presetToDelete.name}"? This action cannot be undone.`}
            confirmText="Delete"
            onConfirm={handleDeleteConfirm}
            onDismiss={() => {
              setDeleteConfirmOpen(false);
              setPresetToDelete(null);
            }}
          />
        )}
      </div>
    );
  }

  // CREATE/EDIT VIEW
  return (
    <div className={containerStyles}>
      <Alert severity="info" title={view === 'edit' ? '✏️ Edit Preset' : '✨ Create New Preset'}>
        <div>{view === 'edit' ? 'Update your template' : 'Create a new upload template'}</div>
      </Alert>

      {error && <Alert severity="error" title="Error">{error}</Alert>}
      {success && <Alert severity="success" title="Success">{success}</Alert>}

      <div className={formActionsStyles}>
        <Button icon="arrow-left" onClick={() => { setView('list'); resetForm(); }} variant="secondary">
          Back to List
        </Button>
      </div>

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
              disabled={view === 'edit'}
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
            💾 {view === 'edit' ? 'Update' : 'Save'} Preset
          </Button>
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

const listHeaderStyles = css`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const loadingStyles = css`
  padding: 40px;
  text-align: center;
  color: #999;
`;

const emptyStateStyles = css`
  padding: 60px 20px;
  text-align: center;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const presetsListStyles = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const presetCardStyles = css`
  padding: 12px;
  background-color: rgba(26, 30, 35, 0.5);
  border: 1px solid #2a2e33;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(26, 30, 35, 0.7);
    border-color: #3a3e43;
  }
`;

const presetHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 8px;
`;

const presetTitleStyles = css`
  font-size: 14px;
  font-weight: 600;
  color: #d8d9da;
`;

const presetDescStyles = css`
  font-size: 11px;
  color: #999;
  margin-top: 4px;
`;

const presetActionsStyles = css`
  display: flex;
  gap: 4px;
`;

const presetDetailsStyles = css`
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #999;
  flex-wrap: wrap;
  
  > div {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const formActionsStyles = css`
  display: flex;
  gap: 8px;
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

