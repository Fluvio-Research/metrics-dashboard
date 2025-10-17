import React, { useState } from 'react';
import { Button, Field, Input, Select, Switch, Icon, HorizontalGroup, IconButton } from '@grafana/ui';
import { css } from '@emotion/css';
import { UploadField } from '../../types';

interface SchemaBuilderProps {
  schema: UploadField[];
  onChange: (schema: UploadField[]) => void;
}

export const SchemaBuilder: React.FC<SchemaBuilderProps> = ({ schema, onChange }) => {
  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set());

  const typeOptions = [
    { label: 'String', value: 'string', description: 'Text value' },
    { label: 'Number', value: 'number', description: 'Numeric value' },
    { label: 'Boolean', value: 'boolean', description: 'True or false' },
    { label: 'JSON', value: 'json', description: 'JSON object or array' },
    { label: 'Auto', value: 'auto', description: 'Automatically infer type' },
  ];

  const handleAddField = () => {
    const newField: UploadField = {
      name: '',
      type: 'string',
      required: false,
      description: '',
    };
    onChange([...schema, newField]);
    setExpandedFields(new Set([...expandedFields, schema.length]));
  };

  const handleUpdateField = (index: number, updates: Partial<UploadField>) => {
    const updated = [...schema];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleDeleteField = (index: number) => {
    onChange(schema.filter((_, i) => i !== index));
    setExpandedFields((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const updated = [...schema];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) {
      return;
    }
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    onChange(updated);
  };

  const toggleExpanded = (index: number) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className={containerStyles}>
      {schema.length === 0 ? (
        <div className={emptyStateStyles}>
          <p>No fields defined yet. Add fields to define the schema for this preset.</p>
        </div>
      ) : (
        <div className={fieldsListStyles}>
          {schema.map((field, index) => {
            const isExpanded = expandedFields.has(index);
            return (
              <div key={index} className={fieldCardStyles}>
                <div className={fieldHeaderStyles} onClick={() => toggleExpanded(index)}>
                  <div className={fieldHeaderLeftStyles}>
                    <Icon name={isExpanded ? 'angle-down' : 'angle-right'} />
                    <span className={fieldNameStyles}>{field.name || '(unnamed field)'}</span>
                    <span className={fieldTypeStyles}>{field.type || 'string'}</span>
                    {field.required && <span className={requiredBadgeStyles}>Required</span>}
                  </div>
                  <HorizontalGroup spacing="xs">
                    <IconButton
                      name="arrow-up"
                      tooltip="Move up"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveField(index, 'up');
                      }}
                      disabled={index === 0}
                      size="sm"
                    />
                    <IconButton
                      name="arrow-down"
                      tooltip="Move down"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveField(index, 'down');
                      }}
                      disabled={index === schema.length - 1}
                      size="sm"
                    />
                    <IconButton
                      name="trash-alt"
                      tooltip="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteField(index);
                      }}
                      size="sm"
                    />
                  </HorizontalGroup>
                </div>

                {isExpanded && (
                  <div className={fieldBodyStyles}>
                    <Field label="Field Name" description="Name of the field in the DynamoDB item">
                      <Input
                        value={field.name}
                        onChange={(e) => handleUpdateField(index, { name: e.currentTarget.value })}
                        placeholder="e.g., userId"
                      />
                    </Field>

                    <Field label="Type" description="Data type for validation and coercion">
                      <Select
                        options={typeOptions}
                        value={field.type}
                        onChange={(option) => handleUpdateField(index, { type: option.value })}
                      />
                    </Field>

                    <Field label="Description" description="Help text shown to users">
                      <Input
                        value={field.description || ''}
                        onChange={(e) => handleUpdateField(index, { description: e.currentTarget.value })}
                        placeholder="Describe this field..."
                      />
                    </Field>

                    <Field label="Default Value" description="Optional default value">
                      <Input
                        value={field.defaultValue || ''}
                        onChange={(e) => handleUpdateField(index, { defaultValue: e.currentTarget.value })}
                        placeholder="Default value..."
                      />
                    </Field>

                    <Field label="Required" description="Make this field mandatory">
                      <Switch
                        value={field.required || false}
                        onChange={(e) => handleUpdateField(index, { required: e.currentTarget.checked })}
                      />
                    </Field>

                    {field.validation && (
                      <div className={validationSectionStyles}>
                        <h5>Validation Rules</h5>
                        <Field label="Pattern (Regex)" description="Regular expression for validation">
                          <Input
                            value={field.validation.pattern || ''}
                            onChange={(e) =>
                              handleUpdateField(index, {
                                validation: { ...field.validation, pattern: e.currentTarget.value },
                              })
                            }
                            placeholder="e.g., ^[a-zA-Z0-9]+$"
                          />
                        </Field>
                        <Field label="Min Length">
                          <Input
                            type="number"
                            min={0}
                            value={field.validation.minLength || ''}
                            onChange={(e) => {
                              const val = parseInt(e.currentTarget.value, 10);
                              handleUpdateField(index, {
                                validation: { ...field.validation, minLength: isNaN(val) ? undefined : val },
                              });
                            }}
                          />
                        </Field>
                        <Field label="Max Length">
                          <Input
                            type="number"
                            min={0}
                            value={field.validation.maxLength || ''}
                            onChange={(e) => {
                              const val = parseInt(e.currentTarget.value, 10);
                              handleUpdateField(index, {
                                validation: { ...field.validation, maxLength: isNaN(val) ? undefined : val },
                              });
                            }}
                          />
                        </Field>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      icon="plus"
                      onClick={() =>
                        handleUpdateField(index, {
                          validation: field.validation || { pattern: '', minLength: undefined, maxLength: undefined },
                        })
                      }
                      disabled={!!field.validation}
                    >
                      Add Validation Rules
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Button icon="plus" onClick={handleAddField}>
        Add Field
      </Button>
    </div>
  );
};

const containerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const emptyStateStyles = css`
  text-align: center;
  padding: 32px;
  background-color: #0b0c0e;
  border: 2px dashed #333;
  border-radius: 4px;
  color: #999;
`;

const fieldsListStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const fieldCardStyles = css`
  background-color: #252a31;
  border: 1px solid #333;
  border-radius: 4px;
  overflow: hidden;
`;

const fieldHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2a3038;
  }
`;

const fieldHeaderLeftStyles = css`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const fieldNameStyles = css`
  font-weight: 600;
  color: #d8d9da;
`;

const fieldTypeStyles = css`
  font-size: 12px;
  color: #999;
  background-color: #1a1e23;
  padding: 2px 8px;
  border-radius: 4px;
`;

const requiredBadgeStyles = css`
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background-color: #f5222d;
  padding: 2px 6px;
  border-radius: 4px;
`;

const fieldBodyStyles = css`
  padding: 16px;
  border-top: 1px solid #333;
  background-color: #1a1e23;
`;

const validationSectionStyles = css`
  margin-top: 12px;
  padding: 12px;
  background-color: #0b0c0e;
  border: 1px solid #333;
  border-radius: 4px;

  h5 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  }
`;

