import React, { useState } from 'react';
import { Button, Card, Icon, HorizontalGroup, Alert, ConfirmModal } from '@grafana/ui';
import { css } from '@emotion/css';
import { UploadPreset } from '../../types';
import { PresetEditor } from './PresetEditor';

interface PresetManagerProps {
  presets: UploadPreset[];
  onChange: (presets: UploadPreset[]) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({ presets, onChange }) => {
  const [editingPreset, setEditingPreset] = useState<UploadPreset | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingPreset({
      id: '',
      name: '',
      description: '',
      table: '',
      operation: 'insert',
      schema: [],
      allowAdHocFields: false,
      allowDryRun: true,
      maxPayloadKB: 512,
      responsePreview: false,
    });
  };

  const handleEdit = (preset: UploadPreset) => {
    setIsCreating(false);
    setEditingPreset({ ...preset });
  };

  const handleSave = (preset: UploadPreset) => {
    if (isCreating) {
      onChange([...presets, preset]);
    } else {
      onChange(presets.map((p) => (p.id === preset.id ? preset : p)));
    }
    setEditingPreset(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    onChange(presets.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  const handleDuplicate = (preset: UploadPreset) => {
    const newPreset = {
      ...preset,
      id: `${preset.id}_copy`,
      name: `${preset.name} (Copy)`,
    };
    onChange([...presets, newPreset]);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const imported = JSON.parse(text);
          if (Array.isArray(imported)) {
            onChange([...presets, ...imported]);
          } else {
            onChange([...presets, imported]);
          }
        } catch (error) {
          alert('Failed to import presets: Invalid JSON');
        }
      }
    };
    input.click();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(presets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dynamodb-presets.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (editingPreset) {
    return (
      <PresetEditor
        preset={editingPreset}
        isNew={isCreating}
        existingIds={presets.map((p) => p.id)}
        onSave={handleSave}
        onCancel={() => {
          setEditingPreset(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className={containerStyles}>
      <div className={headerStyles}>
        <h3 className={titleStyles}>
          <Icon name="list-ul" /> Upload Presets
        </h3>
        <HorizontalGroup>
          <Button icon="plus" onClick={handleCreate}>
            Create Preset
          </Button>
          <Button icon="import" variant="secondary" onClick={handleImport}>
            Import
          </Button>
          {presets.length > 0 && (
            <Button icon="download-alt" variant="secondary" onClick={handleExport}>
              Export
            </Button>
          )}
        </HorizontalGroup>
      </div>

      {presets.length === 0 ? (
        <Alert severity="info" title="No presets defined">
          <div>Create your first upload preset to allow controlled data uploads from Grafana dashboards.</div>
          <div style={{ marginTop: '8px' }}>
            <Button icon="plus" onClick={handleCreate}>
              Create First Preset
            </Button>
          </div>
        </Alert>
      ) : (
        <div className={presetsGridStyles}>
          {presets.map((preset) => (
            <Card key={preset.id} className={presetCardStyles}>
              <div className={cardHeaderStyles}>
                <div>
                  <h4 className={presetTitleStyles}>{preset.name}</h4>
                  <div className={presetMetaStyles}>
                    <span className={badgeStyles(preset.operation)}>{preset.operation.toUpperCase()}</span>
                    <span>
                      <Icon name="database" /> {preset.table}
                    </span>
                    {preset.schema && (
                      <span>
                        <Icon name="list-ul" /> {preset.schema.length} field{preset.schema.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {preset.description && <p className={descriptionStyles}>{preset.description}</p>}

              <div className={cardFooterStyles}>
                <Button size="sm" icon="edit" onClick={() => handleEdit(preset)}>
                  Edit
                </Button>
                <Button size="sm" icon="copy" variant="secondary" onClick={() => handleDuplicate(preset)}>
                  Duplicate
                </Button>
                <Button
                  size="sm"
                  icon="trash-alt"
                  variant="destructive"
                  onClick={() => setDeleteConfirm(preset.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          isOpen={true}
          title="Delete Preset"
          body={`Are you sure you want to delete the preset "${presets.find((p) => p.id === deleteConfirm)?.name}"?`}
          confirmText="Delete"
          onConfirm={() => handleDelete(deleteConfirm)}
          onDismiss={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

const containerStyles = css`
  margin-top: 24px;
`;

const headerStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const titleStyles = css`
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const presetsGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
`;

const presetCardStyles = css`
  padding: 16px;
  background-color: #1a1e23;
  border: 1px solid #333;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const cardHeaderStyles = css`
  margin-bottom: 12px;
`;

const presetTitleStyles = css`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
`;

const presetMetaStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #999;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const badgeStyles = (operation: string) => css`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  background-color: ${operation === 'insert'
    ? '#52c41a'
    : operation === 'update'
    ? '#1890ff'
    : operation === 'delete'
    ? '#f5222d'
    : '#fa8c16'};
  color: white;
`;

const descriptionStyles = css`
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #d8d9da;
  line-height: 1.5;
`;

const cardFooterStyles = css`
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #333;
`;

