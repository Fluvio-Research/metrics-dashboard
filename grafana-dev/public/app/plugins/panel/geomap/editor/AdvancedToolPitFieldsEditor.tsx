import { useCallback, useEffect, useMemo } from 'react';

import { css } from '@emotion/css';
import {
  DataFrame,
  FieldType,
  GrafanaTheme2,
  getFieldDisplayName,
  SelectableValue,
  StandardEditorProps,
  PanelData,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import {
  Button,
  ColorPicker,
  HorizontalGroup,
  IconButton,
  InlineField,
  Input,
  RadioButtonGroup,
  Select,
  Switch,
  TextArea,
  useStyles2,
} from '@grafana/ui';

import { IconPicker } from '../components/IconPicker';

export type AdvancedToolPitDetailConfig = {
  id: string;
  type: 'field' | 'custom';
  label?: string;
  field?: string; // legacy display value
  fieldKey?: string;
  frameRefId?: string;
  fieldName?: string;
  value?: string;
  showLabel?: boolean;
  labelColor?: string;
  icon?: string;
  iconColor?: string;
  isLink?: boolean;
  linkDisplayText?: string; // Custom text to display when field is treated as a link
  linkTemplate?: string; // Template to build link URL (supports {{value}} and {{fieldName}})
};

export interface AdvancedToolPitFieldOptionData {
  frameIndex: number;
  fieldIndex: number;
  frameRefId?: string;
  fieldName: string;
  display: string;
  fieldType: FieldType;
}

const MAX_DETAIL_ITEMS = 6;

type Props = StandardEditorProps<AdvancedToolPitDetailConfig[]>;

let counter = 0;
const createEntryId = () => `atp-${counter++}`;

export const AdvancedToolPitFieldsEditor = ({ value, onChange, context }: Props) => {
  const styles = useStyles2(getStyles);
  // Context.data can be either PanelData with .series property, or directly the series array
  const frames = Array.isArray(context.data) 
    ? context.data 
    : (context.data as unknown as PanelData | undefined)?.series ?? [];
  const entries = value ?? [];

  const allFieldOptions = useMemo(() => buildFieldOptions(frames), [frames]);
  
  const allowedTypes =
    (context.options as { config?: { fieldTypes?: FieldType[] } } | undefined)?.config?.fieldTypes;
  const fieldOptions = useMemo(() => {
    if (!allowedTypes || !allowedTypes.length) {
      return allFieldOptions;
    }
    return allFieldOptions.filter((option) => {
      const data = option.data as AdvancedToolPitFieldOptionData | undefined;
      return data ? allowedTypes.includes(data.fieldType) : true;
    });
  }, [allFieldOptions, allowedTypes]);

  const resolveOptionForEntry = useCallback(
    (entry: AdvancedToolPitDetailConfig) => {
      if (!fieldOptions.length || entry.type !== 'field') {
        return undefined;
      }

      if (entry.fieldKey) {
        const byKey = fieldOptions.find((opt) => opt.value === entry.fieldKey);
        if (byKey) {
          return byKey;
        }
      }

      if (entry.frameRefId && entry.fieldName) {
        const byRef = fieldOptions.find((opt) => {
          const data = opt.data as AdvancedToolPitFieldOptionData | undefined;
          return data?.frameRefId === entry.frameRefId && data?.fieldName === entry.fieldName;
        });
        if (byRef) {
          return byRef;
        }
      }

      if (entry.fieldName) {
        const byFieldName = fieldOptions.find((opt) => {
          const data = opt.data as AdvancedToolPitFieldOptionData | undefined;
          return data?.fieldName === entry.fieldName;
        });
        if (byFieldName) {
          return byFieldName;
        }
      }

      if (entry.field) {
        const byLabel = fieldOptions.find((opt) => opt.label === entry.field);
        if (byLabel) {
          return byLabel;
        }
      }

      return undefined;
    },
    [fieldOptions]
  );

  useEffect(() => {
    if (!fieldOptions.length || !entries.length) {
      return;
    }

    let mutated = false;
    const next = entries.map((entry) => {
      if (entry.type !== 'field') {
        return entry;
      }

      let option = resolveOptionForEntry(entry);
      if (!option && !entry.fieldKey && !entry.field && !entry.fieldName && fieldOptions[0]) {
        option = fieldOptions[0];
      }

      if (!option) {
        return entry;
      }

      const data = option.data as AdvancedToolPitFieldOptionData | undefined;
      if (!data) {
        return entry;
      }

      if (
        entry.fieldKey === option.value &&
        entry.field === option.label &&
        entry.fieldName === data.fieldName &&
        entry.frameRefId === data.frameRefId
      ) {
        return entry;
      }

      mutated = true;
      return {
        ...entry,
        fieldKey: option.value,
        field: option.label,
        fieldName: data.fieldName,
        frameRefId: data.frameRefId,
      };
    });

    if (mutated) {
      onChange(next);
    }
  }, [entries, fieldOptions, onChange, resolveOptionForEntry]);

  const handleUpdate = (index: number, patch: Partial<AdvancedToolPitDetailConfig>) => {
    const next = entries.map((entry, idx) => (idx === index ? { ...entry, ...patch } : entry));
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = entries.filter((_, idx) => idx !== index);
    onChange(next.length ? next : undefined);
  };

  const handleAdd = (type: 'field' | 'custom') => {
    if (entries.length >= MAX_DETAIL_ITEMS) {
      return;
    }

    const nextEntry: AdvancedToolPitDetailConfig = {
      id: createEntryId(),
      type,
      showLabel: true,
    };
    if (type === 'field' && fieldOptions.length) {
      const first = fieldOptions[0];
      const data = first.data as AdvancedToolPitFieldOptionData | undefined;
      nextEntry.fieldKey = first.value;
      nextEntry.field = first.label;
      nextEntry.fieldName = data?.fieldName;
      nextEntry.frameRefId = data?.frameRefId;
    }
    const next = [...entries, nextEntry];
    onChange(next);
  };

  const moveEntry = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= entries.length) {
      return;
    }
    const next = [...entries];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div className={styles.wrapper}>
      {!fieldOptions.length && (
        <div className={styles.empty}>
          <div style={{ marginBottom: '8px' }}>
            {allowedTypes && allowedTypes.length && allFieldOptions.length
              ? t(
                  'geomap.advanced-toolpit.entry.no-fields-filtered',
                  'No fields match the selected data types. Adjust the filter or add custom text.'
                )
              : t(
                  'geomap.advanced-toolpit.entry.no-fields',
                  'No fields available yet. Run the panel queries or broaden the allowed field types.'
                )}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            Debug: {frames.length} data frames found, {allFieldOptions.length} total fields available
            {frames.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                Frame fields: {frames.map((f: DataFrame, i: number) => `Frame ${i}: ${f.fields.length} fields`).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {entries.map((entry, index) => {
        return (
          <div className={styles.entry} key={entry.id ?? index}>
            <div className={styles.entryHeader}>
              <RadioButtonGroup
                value={entry.type}
                options={[
                  { label: t('geomap.advanced-toolpit.entry-type.field', 'Field'), value: 'field' },
                  { label: t('geomap.advanced-toolpit.entry-type.custom', 'Custom'), value: 'custom' },
                ]}
                onChange={(val) => {
                  const nextType = val as 'field' | 'custom';
                  const patch: Partial<AdvancedToolPitDetailConfig> = { type: nextType };
                  if (nextType === 'field') {
                    const defaultOption = fieldOptions[0];
                    const data = defaultOption?.data as AdvancedToolPitFieldOptionData | undefined;
                    if (defaultOption) {
                      patch.fieldKey = defaultOption.value;
                      patch.field = defaultOption.label;
                      patch.fieldName = data?.fieldName;
                      patch.frameRefId = data?.frameRefId;
                    }
                    patch.value = undefined;
                  } else {
                    patch.fieldKey = undefined;
                    patch.field = undefined;
                    patch.fieldName = undefined;
                    patch.frameRefId = undefined;
                  }
                  handleUpdate(index, patch);
                }}
              />
              <HorizontalGroup spacing="xs">
                <IconButton
                  name="arrow-up"
                  disabled={index === 0}
                  onClick={() => moveEntry(index, -1)}
                  tooltip={t('geomap.advanced-toolpit.entry.move-up', 'Move up')}
                />
                <IconButton
                  name="arrow-down"
                  disabled={index === entries.length - 1}
                  onClick={() => moveEntry(index, 1)}
                  tooltip={t('geomap.advanced-toolpit.entry.move-down', 'Move down')}
                />
                <IconButton
                  name="trash-alt"
                  onClick={() => handleRemove(index)}
                  tooltip={t('geomap.advanced-toolpit.entry.remove', 'Remove row')}
                />
              </HorizontalGroup>
            </div>

            <div className={styles.entryBody}>
              <InlineField label={t('geomap.advanced-toolpit.entry.label', 'Label')} labelWidth={10} grow>
                <Input
                  value={entry.label ?? ''}
                  placeholder={
                    entry.type === 'field'
                      ? t('geomap.advanced-toolpit.entry.label-placeholder', 'Optional label override')
                      : t('geomap.advanced-toolpit.entry.label-placeholder-custom', 'Optional label')
                  }
                  onChange={(e) => handleUpdate(index, { label: e.currentTarget.value })}
                />
              </InlineField>

              <div className={styles.inlineControls}>
                <InlineField label={t('geomap.advanced-toolpit.entry.show-label', 'Show label')} labelWidth={10}>
                  <Switch value={entry.showLabel !== false} onChange={(e) => handleUpdate(index, { showLabel: e.currentTarget.checked })} />
                </InlineField>
                <InlineField label={t('geomap.advanced-toolpit.entry.label-color', 'Label color')} labelWidth={10} grow={false}>
                  <ColorPicker
                    color={entry.labelColor ?? ''}
                    enableNamedColors
                    onChange={(color) =>
                      handleUpdate(index, { labelColor: color && color.trim().length ? color : undefined })
                    }
                  />
                </InlineField>
              </div>

              <InlineField label={t('geomap.advanced-toolpit.entry.icon', 'Icon')} labelWidth={10} grow>
                <IconPicker
                  value={entry.icon ?? ''}
                  placeholder={t('geomap.advanced-toolpit.entry.icon-placeholder', 'Icon name or emoji')}
                  onChange={(icon) => handleUpdate(index, { icon })}
                />
              </InlineField>

              <InlineField label={t('geomap.advanced-toolpit.entry.icon-color', 'Icon color')} labelWidth={10} grow={false}>
                <ColorPicker
                  color={entry.iconColor ?? ''}
                  onChange={(color) =>
                    handleUpdate(index, { iconColor: color && color.trim().length ? color : undefined })
                  }
                  enableNamedColors
                />
              </InlineField>

              {entry.type === 'field' ? (
                <>
                  <InlineField label={t('geomap.advanced-toolpit.entry.field', 'Field')} labelWidth={10} grow>
                    <Select
                      options={fieldOptions}
                      value={
                        resolveOptionForEntry(entry) ??
                        (entry.field
                          ? { label: entry.field, value: entry.field }
                          : undefined)
                      }
                      onChange={(selection) => {
                        if (!selection?.value) {
                          handleUpdate(index, { fieldKey: undefined, field: undefined, fieldName: undefined, frameRefId: undefined });
                          return;
                        }

                        const data = selection.data as AdvancedToolPitFieldOptionData | undefined;
                        if (data) {
                          handleUpdate(index, {
                            fieldKey: selection.value,
                            field: data.display,
                            fieldName: data.fieldName,
                            frameRefId: data.frameRefId,
                          });
                        } else {
                          handleUpdate(index, {
                            fieldKey: undefined,
                            field: selection.label ?? selection.value,
                            fieldName: selection.value,
                            frameRefId: undefined,
                          });
                        }
                      }}
                      isClearable
                      allowCustomValue
                      isDisabled={!fieldOptions.length}
                      noOptionsMessage={
                        fieldOptions.length === 0 
                          ? 'Run query to load fields' 
                          : t('geomap.advanced-toolpit.entry.no-options', 'No matching fields')
                      }
                      placeholder={
                        fieldOptions.length === 0 
                          ? 'Run query first...' 
                          : t('geomap.advanced-toolpit.entry.field-placeholder', 'Select field')
                      }
                      menuShouldPortal
                    />
                  </InlineField>
                  <InlineField 
                    label={t('geomap.advanced-toolpit.entry.field-is-link', 'Field is a link')} 
                    labelWidth={10}
                    tooltip={t(
                      'geomap.advanced-toolpit.entry.field-is-link-description',
                      'When enabled, the field value will be treated as a URL and made clickable.'
                    )}
                  >
                    <Switch 
                      value={entry.isLink === true} 
                      onChange={(e) => handleUpdate(index, { isLink: e.currentTarget.checked })} 
                    />
                  </InlineField>
                  {entry.isLink && (
                    <InlineField
                      label={t('geomap.advanced-toolpit.entry.link-template', 'Link template')}
                      labelWidth={10}
                      grow
                      tooltip={t(
                        'geomap.advanced-toolpit.entry.link-template-description',
                        'Optional URL template. Use {{value}} for this field or {{FieldName}} to reference another field.'
                      )}
                    >
                      <Input
                        value={entry.linkTemplate ?? ''}
                        placeholder={t(
                          'geomap.advanced-toolpit.entry.link-template-placeholder',
                          '/d/uid/slug?var-serial={{value}}'
                        )}
                        onChange={(e) => handleUpdate(index, { linkTemplate: e.currentTarget.value })}
                      />
                    </InlineField>
                  )}
                  {entry.isLink && (
                    <InlineField
                      label={t('geomap.advanced-toolpit.entry.link-display-text', 'Link text')}
                      labelWidth={10}
                      grow
                      tooltip={t(
                        'geomap.advanced-toolpit.entry.link-display-text-description',
                        'Optional custom text to display instead of the URL. Leave empty to show the URL.'
                      )}
                    >
                      <Input
                        value={entry.linkDisplayText ?? ''}
                        placeholder={t('geomap.advanced-toolpit.entry.link-display-text-placeholder', 'e.g., "Click here" or "View details"')}
                        onChange={(e) => handleUpdate(index, { linkDisplayText: e.currentTarget.value })}
                      />
                    </InlineField>
                  )}
                </>
              ) : (
                <>
                  <InlineField
                    label={t('geomap.advanced-toolpit.entry.value', 'Value')}
                    labelWidth={12}
                    grow
                    tooltip={t(
                      'geomap.advanced-toolpit.entry.value-description',
                      'Static text that will appear in the tooltip. Can be a URL if "Treat as link" is enabled.'
                    )}
                  >
                    <TextArea
                      rows={2}
                      value={entry.value ?? ''}
                      placeholder={t('geomap.advanced-toolpit.entry.value-placeholder', 'Enter custom value or URL')}
                      onChange={(e) => handleUpdate(index, { value: e.currentTarget.value })}
                    />
                  </InlineField>
                  <InlineField 
                    label={t('geomap.advanced-toolpit.entry.is-link', 'Treat as link')} 
                    labelWidth={12}
                    tooltip={t(
                      'geomap.advanced-toolpit.entry.is-link-description',
                      'When enabled, the value will be clickable and open in a new tab.'
                    )}
                  >
                    <Switch 
                      value={entry.isLink === true} 
                      onChange={(e) => handleUpdate(index, { isLink: e.currentTarget.checked })} 
                    />
                  </InlineField>
                  {entry.isLink && (
                    <InlineField
                      label={t('geomap.advanced-toolpit.entry.link-template', 'Link template')}
                      labelWidth={12}
                      grow
                      tooltip={t(
                        'geomap.advanced-toolpit.entry.link-template-description',
                        'Optional URL template. Use {{value}} for this entry or {{FieldName}} to reference another field.'
                      )}
                    >
                      <Input
                        value={entry.linkTemplate ?? ''}
                        placeholder={t(
                          'geomap.advanced-toolpit.entry.link-template-placeholder',
                          '/d/uid/slug?var-serial={{value}}'
                        )}
                        onChange={(e) => handleUpdate(index, { linkTemplate: e.currentTarget.value })}
                      />
                    </InlineField>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      <HorizontalGroup spacing="xs">
        <Button
          variant="secondary"
          icon="plus"
          onClick={() => handleAdd('field')}
          disabled={!fieldOptions.length || entries.length >= MAX_DETAIL_ITEMS}
        >
          {t('geomap.advanced-toolpit.entry.add-field', 'Add field')}
        </Button>
        <Button
          variant="secondary"
          icon="plus"
          onClick={() => handleAdd('custom')}
          disabled={entries.length >= MAX_DETAIL_ITEMS}
        >
          {t('geomap.advanced-toolpit.entry.add-custom', 'Add custom text')}
        </Button>
      </HorizontalGroup>
      {entries.length >= MAX_DETAIL_ITEMS && (
        <div className={styles.limitNote}>
          {t('geomap.advanced-toolpit.entry.limit', 'Showing the first 6 items in the tooltip.')}
        </div>
      )}
    </div>
  );
};

export function buildFieldOptions(frames: DataFrame[]): Array<SelectableValue<string>> {
  if (!frames.length) {
    console.warn('[buildFieldOptions] No data frames provided');
    return [];
  }
  const options: Array<SelectableValue<string>> = [];
  for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
    const frame = frames[frameIndex];
    if (!frame || !frame.fields) {
      console.warn(`[buildFieldOptions] Frame ${frameIndex} is invalid or has no fields`);
      continue;
    }
    for (let fieldIndex = 0; fieldIndex < frame.fields.length; fieldIndex++) {
      const field = frame.fields[fieldIndex];
      if (!field) {
        continue;
      }
      const label = getFieldDisplayName(field, frame, frames) || field.name || `Field ${fieldIndex}`;
      const key = `${frameIndex}:${fieldIndex}`;
      options.push({
        label,
        value: key,
        description: field.name ? `${field.name} (${field.type})` : field.type,
        data: {
          frameIndex,
          fieldIndex,
          frameRefId: frame.refId,
          fieldName: field.name,
          display: label,
          fieldType: field.type,
        } as AdvancedToolPitFieldOptionData,
      });
    }
  }
  return options;
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }),
  entry: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(1.5),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    background: theme.colors.background.secondary,
    boxShadow: theme.shadows.z1,
  }),
  entryHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  }),
  entryBody: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  inlineControls: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
  empty: css({
    padding: theme.spacing(1),
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  }),
  limitNote: css({
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing(0.5),
  }),
});
