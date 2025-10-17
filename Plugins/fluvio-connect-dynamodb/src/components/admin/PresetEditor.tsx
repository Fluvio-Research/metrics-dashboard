import React, { useState } from 'react';
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  TextArea,
  Switch,
  HorizontalGroup,
  Alert,
  Icon,
  CodeEditor,
} from '@grafana/ui';
import { css } from '@emotion/css';
import { UploadPreset, UploadOperation } from '../../types';
import { SchemaBuilder } from './SchemaBuilder';

interface PresetEditorProps {
  preset: UploadPreset;
  isNew: boolean;
  existingIds: string[];
  onSave: (preset: UploadPreset) => void;
  onCancel: () => void;
}

export const PresetEditor: React.FC<PresetEditorProps> = ({ preset, isNew, existingIds, onSave, onCancel }) => {
  const [editedPreset, setEditedPreset] = useState<UploadPreset>(preset);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editedPreset.id.trim()) {
      newErrors.id = 'ID is required';
    } else if (isNew && existingIds.includes(editedPreset.id)) {
      newErrors.id = 'ID already exists';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(editedPreset.id)) {
      newErrors.id = 'ID must contain only letters, numbers, hyphens, and underscores';
    }

    if (!editedPreset.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!editedPreset.table.trim()) {
      newErrors.table = 'Table name is required';
    }

    if (['update', 'delete', 'select'].includes(editedPreset.operation) && !editedPreset.partiqlTemplate?.trim()) {
      newErrors.partiqlTemplate = `PartiQL template is required for ${editedPreset.operation} operations`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(editedPreset);
    }
  };

  const operationOptions = [
    { label: 'Insert', value: 'insert' as UploadOperation, description: 'Add new items to the table' },
    { label: 'Update', value: 'update' as UploadOperation, description: 'Modify existing items' },
    { label: 'Delete', value: 'delete' as UploadOperation, description: 'Remove items from the table' },
    { label: 'Select', value: 'select' as UploadOperation, description: 'Query and retrieve items' },
  ];

  return (
    <div className={containerStyles}>
      <Card className={headerCardStyles}>
        <HorizontalGroup justify="space-between">
          <h3 className={titleStyles}>
            <Icon name={isNew ? 'plus' : 'edit'} />
            {isNew ? 'Create New Preset' : `Edit Preset: ${preset.name}`}
          </h3>
          <HorizontalGroup>
            <Button variant="secondary" icon="times" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" icon="save" onClick={handleSave}>
              Save Preset
            </Button>
          </HorizontalGroup>
        </HorizontalGroup>
      </Card>

      <div className={sectionsContainerStyles}>
        {/* Basic Information */}
        <Card className={sectionCardStyles}>
          <h4 className={sectionTitleStyles}>
            <Icon name="info-circle" /> Basic Information
          </h4>

          <Field label="Preset ID" description="Unique identifier for this preset" error={errors.id} invalid={!!errors.id}>
            <Input
              value={editedPreset.id}
              onChange={(e) => setEditedPreset({ ...editedPreset, id: e.currentTarget.value })}
              placeholder="e.g., insert-user-data"
              disabled={!isNew}
            />
          </Field>

          <Field label="Name" description="Display name shown in the upload panel" error={errors.name} invalid={!!errors.name}>
            <Input
              value={editedPreset.name}
              onChange={(e) => setEditedPreset({ ...editedPreset, name: e.currentTarget.value })}
              placeholder="e.g., Insert User Data"
            />
          </Field>

          <Field label="Description" description="Optional description of what this preset does">
            <TextArea
              value={editedPreset.description || ''}
              onChange={(e) => setEditedPreset({ ...editedPreset, description: e.currentTarget.value })}
              placeholder="Describe the purpose of this upload preset..."
              rows={3}
            />
          </Field>
        </Card>

        {/* DynamoDB Configuration */}
        <Card className={sectionCardStyles}>
          <h4 className={sectionTitleStyles}>
            <Icon name="database" /> DynamoDB Configuration
          </h4>

          <Field label="Table Name" description="Target DynamoDB table" error={errors.table} invalid={!!errors.table}>
            <Input
              value={editedPreset.table}
              onChange={(e) => setEditedPreset({ ...editedPreset, table: e.currentTarget.value })}
              placeholder="e.g., Users"
            />
          </Field>

          <Field label="Index (Optional)" description="Global or local secondary index to use">
            <Input
              value={editedPreset.index || ''}
              onChange={(e) => setEditedPreset({ ...editedPreset, index: e.currentTarget.value })}
              placeholder="e.g., EmailIndex"
            />
          </Field>

          <Field label="Operation" description="Type of DynamoDB operation">
            <Select
              options={operationOptions}
              value={editedPreset.operation}
              onChange={(option) => setEditedPreset({ ...editedPreset, operation: option.value! })}
            />
          </Field>

          {['update', 'delete', 'select'].includes(editedPreset.operation) && (
            <Field
              label="PartiQL Template"
              description="PartiQL statement with ? placeholders for parameters"
              error={errors.partiqlTemplate}
              invalid={!!errors.partiqlTemplate}
            >
              <CodeEditor
                value={editedPreset.partiqlTemplate || ''}
                language="sql"
                height={100}
                onChange={(value) => setEditedPreset({ ...editedPreset, partiqlTemplate: value })}
                showLineNumbers={false}
                showMiniMap={false}
              />
            </Field>
          )}
        </Card>

        {/* Schema Definition */}
        <Card className={sectionCardStyles}>
          <h4 className={sectionTitleStyles}>
            <Icon name="list-ul" /> Field Schema
          </h4>
          <Alert severity="info" title="Schema Configuration">
            Define the fields that users can provide when using this preset. The schema is used for validation and form
            generation.
          </Alert>
          <SchemaBuilder
            schema={editedPreset.schema || []}
            onChange={(schema) => setEditedPreset({ ...editedPreset, schema })}
          />
        </Card>

        {/* Options */}
        <Card className={sectionCardStyles}>
          <h4 className={sectionTitleStyles}>
            <Icon name="sliders-v-alt" /> Options
          </h4>

          <Field label="Allow Ad-Hoc Fields" description="Allow users to provide additional fields not in the schema">
            <Switch
              value={editedPreset.allowAdHocFields}
              onChange={(e) => setEditedPreset({ ...editedPreset, allowAdHocFields: e.currentTarget.checked })}
            />
          </Field>

          <Field label="Allow Dry Run" description="Allow users to preview statements before executing">
            <Switch
              value={editedPreset.allowDryRun}
              onChange={(e) => setEditedPreset({ ...editedPreset, allowDryRun: e.currentTarget.checked })}
            />
          </Field>

          <Field label="Response Preview" description="Show response data in the panel after execution">
            <Switch
              value={editedPreset.responsePreview || false}
              onChange={(e) => setEditedPreset({ ...editedPreset, responsePreview: e.currentTarget.checked })}
            />
          </Field>

          <Field
            label="Max Payload Size (KB)"
            description="Maximum allowed payload size in kilobytes (0 = use datasource default)"
          >
            <Input
              type="number"
              min={0}
              value={editedPreset.maxPayloadKB || ''}
              onChange={(e) => {
                const value = parseInt(e.currentTarget.value, 10);
                setEditedPreset({ ...editedPreset, maxPayloadKB: isNaN(value) ? undefined : value });
              }}
              placeholder="512"
            />
          </Field>
        </Card>

        {/* Advanced */}
        <Card className={sectionCardStyles}>
          <div className={advancedHeaderStyles} onClick={() => setShowAdvanced(!showAdvanced)}>
            <h4 className={sectionTitleStyles}>
              <Icon name={showAdvanced ? 'angle-down' : 'angle-right'} />
              <Icon name="cog" /> Advanced
            </h4>
          </div>

          {showAdvanced && (
            <>
              <Field label="Help Text" description="Custom help text displayed to users">
                <TextArea
                  value={editedPreset.helpText || ''}
                  onChange={(e) => setEditedPreset({ ...editedPreset, helpText: e.currentTarget.value })}
                  placeholder="Provide guidance for users on how to use this preset..."
                  rows={4}
                />
              </Field>

              <Field label="Category" description="Optional category for grouping presets">
                <Input
                  value={editedPreset.category || ''}
                  onChange={(e) => setEditedPreset({ ...editedPreset, category: e.currentTarget.value })}
                  placeholder="e.g., Users, Analytics, IoT"
                />
              </Field>
            </>
          )}
        </Card>
      </div>

      {/* Footer Actions */}
      <Card className={footerCardStyles}>
        <HorizontalGroup justify="space-between">
          <Button variant="secondary" icon="times" onClick={onCancel}>
            Cancel
          </Button>
          <HorizontalGroup>
            <Button variant="primary" icon="save" onClick={handleSave}>
              Save Preset
            </Button>
          </HorizontalGroup>
        </HorizontalGroup>
      </Card>
    </div>
  );
};

const containerStyles = css`
  padding: 20px 0;
`;

const headerCardStyles = css`
  padding: 16px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #1a1e23 0%, #252a31 100%);
  border: 1px solid #333;
`;

const titleStyles = css`
  margin: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const sectionsContainerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const sectionCardStyles = css`
  padding: 20px;
  background-color: #1a1e23;
  border: 1px solid #333;
`;

const sectionTitleStyles = css`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const advancedHeaderStyles = css`
  cursor: pointer;
  
  &:hover h4 {
    color: #6e9fff;
  }
`;

const footerCardStyles = css`
  padding: 16px;
  margin-top: 20px;
  background-color: #1a1e23;
  border: 1px solid #333;
  position: sticky;
  bottom: 0;
  z-index: 10;
`;

