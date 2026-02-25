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

export type AdvancedTooltipDetailConfig = {
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

export interface AdvancedTooltipFieldOptionData {
  frameIndex: number;
  fieldIndex: number;
  frameRefId?: string;
  fieldName: string;
  display: string;
  fieldType: FieldType;
}

const MAX_DETAIL_ITEMS = 50; // Increased from 6 to support more tooltip content

type Props = StandardEditorProps<AdvancedTooltipDetailConfig[]>;

let counter = 0;
const createEntryId = () => `atp-${counter++}`;

export const AdvancedTooltipFieldsEditor = ({ value, onChange, context }: Props) => {
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
      const data = option.data as AdvancedTooltipFieldOptionData | undefined;
      return data ? allowedTypes.includes(data.fieldType) : true;
    });
  }, [allFieldOptions, allowedTypes]);

  const resolveOptionForEntry = useCallback(
    (entry: AdvancedTooltipDetailConfig) => {
      if (!fieldOptions.length || entry.type !== 'field') {
        return undefined;
      }

      // Priority 1: Try by fieldName first (most stable identifier)
      if (entry.fieldName) {
        // First try with frameRefId if available
        if (entry.frameRefId) {
          const byNameAndRef = fieldOptions.find((opt) => {
            const data = opt.data as AdvancedTooltipFieldOptionData | undefined;
            return data?.frameRefId === entry.frameRefId && data?.fieldName === entry.fieldName;
          });
          if (byNameAndRef) {
            return byNameAndRef;
          }
        }
        
        // Then try by fieldName alone (in case frameRefId changed)
        const byFieldName = fieldOptions.find((opt) => {
          const data = opt.data as AdvancedTooltipFieldOptionData | undefined;
          return data?.fieldName === entry.fieldName;
        });
        if (byFieldName) {
          return byFieldName;
        }
      }

      // Priority 2: Try by fieldKey (frame:field index) only if fieldName didn't work
      if (entry.fieldKey) {
        const byKey = fieldOptions.find((opt) => opt.value === entry.fieldKey);
        if (byKey) {
          return byKey;
        }
      }

      // Priority 3: Fallback to legacy field label
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

      // Only auto-resolve if the entry is completely empty (no field reference at all)
      const hasValidReference = entry.fieldKey || entry.fieldName || entry.field;
      if (!hasValidReference && fieldOptions[0]) {
        // Auto-fill completely empty field entries with the first available field
        const option = fieldOptions[0];
        const data = option.data as AdvancedTooltipFieldOptionData | undefined;
        mutated = true;
        return {
          ...entry,
          fieldKey: option.value,
          field: option.label,
          fieldName: data?.fieldName,
          frameRefId: data?.frameRefId,
        };
      }

      // Try to resolve the entry to check if the field still exists
      const option = resolveOptionForEntry(entry);
      if (option) {
        // Field still exists - update fieldKey (index can change) but preserve the display label
        // Only update if fieldKey changed (field index changed due to reordering)
        if (entry.fieldKey !== option.value) {
          mutated = true;
          return {
            ...entry,
            fieldKey: option.value, // Update the index
            // Keep entry.field (custom label) as-is
            // Keep entry.fieldName (database name) as-is
            // Keep entry.frameRefId as-is
          };
        }
        
        // Everything matches, no changes needed
        return entry;
      }

      // Field no longer exists in current data - keep entry as-is
      // The user will see it as "not found" and can manually update
      return entry;
    });

    if (mutated) {
      onChange(next);
    }
  }, [entries, fieldOptions, onChange, resolveOptionForEntry]);

  const handleUpdate = (index: number, patch: Partial<AdvancedTooltipDetailConfig>) => {
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

    const nextEntry: AdvancedTooltipDetailConfig = {
      id: createEntryId(),
      type,
      showLabel: true,
    };
    if (type === 'field' && fieldOptions.length) {
      const first = fieldOptions[0];
      const data = first.data as AdvancedTooltipFieldOptionData | undefined;
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
          <div>
            {allowedTypes && allowedTypes.length && allFieldOptions.length
              ? t(
                  'geomap.advanced-tooltip.entry.no-fields-filtered',
                  'No fields match the selected data types. Adjust the filter or add custom text.'
                )
              : t(
                  'geomap.advanced-tooltip.entry.no-fields',
                  'No fields available yet. Run the panel queries or broaden the allowed field types.'
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
                  { label: t('geomap.advanced-tooltip.entry-type.field', 'Field'), value: 'field' },
                  { label: t('geomap.advanced-tooltip.entry-type.custom', 'Custom'), value: 'custom' },
                ]}
                onChange={(val) => {
                  const nextType = val as 'field' | 'custom';
                  const patch: Partial<AdvancedTooltipDetailConfig> = { type: nextType };
                  if (nextType === 'field') {
                    const defaultOption = fieldOptions[0];
                    const data = defaultOption?.data as AdvancedTooltipFieldOptionData | undefined;
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
                  tooltip={t('geomap.advanced-tooltip.entry.move-up', 'Move up')}
                />
                <IconButton
                  name="arrow-down"
                  disabled={index === entries.length - 1}
                  onClick={() => moveEntry(index, 1)}
                  tooltip={t('geomap.advanced-tooltip.entry.move-down', 'Move down')}
                />
                <IconButton
                  name="trash-alt"
                  onClick={() => handleRemove(index)}
                  tooltip={t('geomap.advanced-tooltip.entry.remove', 'Remove row')}
                />
              </HorizontalGroup>
            </div>

            <div className={styles.entryBody}>
              {/* Row 1: Label */}
              <InlineField 
                label={t('geomap.advanced-tooltip.entry.label', 'Label')} 
                labelWidth={18} 
                grow
                tooltip={t('geomap.advanced-tooltip.entry.label-tooltip', 'Custom label text to display before the value')}
              >
                <Input
                  value={entry.label ?? ''}
                  placeholder={
                    entry.type === 'field'
                      ? t('geomap.advanced-tooltip.entry.label-placeholder', 'Auto (uses field name)')
                      : t('geomap.advanced-tooltip.entry.label-placeholder-custom', 'e.g., "Location", "Status"')
                  }
                  onChange={(e) => handleUpdate(index, { label: e.currentTarget.value })}
                />
              </InlineField>

              {/* Row 2: Show label */}
              <InlineField 
                label={t('geomap.advanced-tooltip.entry.show-label', 'Show label')} 
                labelWidth={18}
                tooltip={t('geomap.advanced-tooltip.entry.show-label-tooltip', 'Display the label text in the tooltip')}
              >
                <Switch value={entry.showLabel !== false} onChange={(e) => handleUpdate(index, { showLabel: e.currentTarget.checked })} />
              </InlineField>

              {/* Row 3: Label color */}
              <InlineField 
                label={t('geomap.advanced-tooltip.entry.label-color', 'Label color')} 
                labelWidth={18}
                tooltip={t('geomap.advanced-tooltip.entry.label-color-tooltip', 'Custom color for the label text')}
              >
                <ColorPicker
                  color={entry.labelColor ?? ''}
                  enableNamedColors
                  onChange={(color) =>
                    handleUpdate(index, { labelColor: color && color.trim().length ? color : undefined })
                  }
                />
              </InlineField>

              {/* Row 4: Icon */}
              <InlineField 
                label={t('geomap.advanced-tooltip.entry.icon', 'Icon')} 
                labelWidth={18} 
                grow
                tooltip={t('geomap.advanced-tooltip.entry.icon-tooltip', 'Icon or emoji to display before the label')}
              >
                <IconPicker
                  value={entry.icon ?? ''}
                  placeholder={t('geomap.advanced-tooltip.entry.icon-placeholder', 'e.g., "map-marker" or 📍')}
                  onChange={(icon) => handleUpdate(index, { icon })}
                />
              </InlineField>

              {/* Row 5: Icon color */}
              <InlineField 
                label={t('geomap.advanced-tooltip.entry.icon-color', 'Icon color')} 
                labelWidth={18}
                tooltip={t('geomap.advanced-tooltip.entry.icon-color-tooltip', 'Custom color for the icon')}
              >
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
                  {/* Row 6: Field selector */}
                  <InlineField 
                    label={t('geomap.advanced-tooltip.entry.field', 'Field')} 
                    labelWidth={18} 
                    grow
                    tooltip={t('geomap.advanced-tooltip.entry.field-tooltip', 'Select which data field to display')}
                  >
                      <Select
                        options={fieldOptions}
                        value={
                          resolveOptionForEntry(entry) ??
                          (entry.fieldName || entry.field
                            ? { 
                                label: `${entry.label || entry.field || entry.fieldName} (not found)`, 
                                value: entry.fieldName || entry.field || '',
                                description: 'Field not found in current data'
                              }
                            : undefined)
                        }
                        onChange={(selection) => {
                          if (!selection?.value) {
                            handleUpdate(index, { fieldKey: undefined, field: undefined, fieldName: undefined, frameRefId: undefined });
                            return;
                          }

                          const data = selection.data as AdvancedTooltipFieldOptionData | undefined;
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
                            : t('geomap.advanced-tooltip.entry.no-options', 'No matching fields')
                        }
                        placeholder={
                          fieldOptions.length === 0 
                            ? 'Run query first...' 
                            : t('geomap.advanced-tooltip.entry.field-placeholder', 'Select a field')
                        }
                        menuShouldPortal
                      />
                    </InlineField>

                  {/* Row 7: Treat as URL switch */}
                  <InlineField 
                    label={t('geomap.advanced-tooltip.entry.field-is-link', 'Treat as URL')} 
                    labelWidth={18}
                    tooltip={t(
                      'geomap.advanced-tooltip.entry.field-is-link-description',
                      'When enabled, the field value will be treated as a clickable URL that navigates in the same tab.'
                    )}
                  >
                    <Switch 
                      value={entry.isLink === true} 
                      onChange={(e) => handleUpdate(index, { isLink: e.currentTarget.checked })} 
                    />
                  </InlineField>

                  {/* Row 8: URL template (conditional) */}
                  {entry.isLink && (
                    <InlineField
                      label={t('geomap.advanced-tooltip.entry.link-template', 'URL template')}
                      labelWidth={18}
                      grow
                      tooltip={t(
                        'geomap.advanced-tooltip.entry.link-template-description',
                        'Optional URL template with variables. Use {{value}} for this field or {{FieldName}} to reference other fields.'
                      )}
                    >
                      <Input
                        value={entry.linkTemplate ?? ''}
                        placeholder={t(
                          'geomap.advanced-tooltip.entry.link-template-placeholder',
                          'e.g., /d/dashboard?var-id={{value}}'
                        )}
                        onChange={(e) => handleUpdate(index, { linkTemplate: e.currentTarget.value })}
                      />
                    </InlineField>
                  )}

                  {/* Row 9: Display text (conditional) */}
                  {entry.isLink && (
                    <InlineField
                      label={t('geomap.advanced-tooltip.entry.link-display-text', 'Display text')}
                      labelWidth={18}
                      grow
                      tooltip={t(
                        'geomap.advanced-tooltip.entry.link-display-text-description',
                        'Custom text to show for the link. Leave empty to display the URL or field value.'
                      )}
                    >
                      <Input
                        value={entry.linkDisplayText ?? ''}
                        placeholder={t('geomap.advanced-tooltip.entry.link-display-text-placeholder', 'e.g., "View details" or "Open dashboard"')}
                        onChange={(e) => handleUpdate(index, { linkDisplayText: e.currentTarget.value })}
                      />
                    </InlineField>
                  )}
                </>
              ) : (
                <>
                  {/* Row 6: Custom value textarea */}
                  <InlineField
                    label={t('geomap.advanced-tooltip.entry.value', 'Custom value')}
                    labelWidth={18}
                    grow
                    tooltip={t(
                      'geomap.advanced-tooltip.entry.value-description',
                      'Static text or URL to display in the tooltip. Enable "Treat as URL" below to make it clickable.'
                    )}
                  >
                    <TextArea
                      rows={2}
                      value={entry.value ?? ''}
                      placeholder={t('geomap.advanced-tooltip.entry.value-placeholder', 'e.g., "Contact support" or https://example.com')}
                      onChange={(e) => handleUpdate(index, { value: e.currentTarget.value })}
                    />
                  </InlineField>

                  {/* Row 7: Treat as URL switch */}
                  <InlineField 
                    label={t('geomap.advanced-tooltip.entry.is-link', 'Treat as URL')} 
                    labelWidth={18}
                    tooltip={t(
                      'geomap.advanced-tooltip.entry.is-link-description',
                      'When enabled, the value will be rendered as a clickable link that navigates in the same tab.'
                    )}
                  >
                    <Switch 
                      value={entry.isLink === true} 
                      onChange={(e) => handleUpdate(index, { isLink: e.currentTarget.checked })} 
                    />
                  </InlineField>

                  {/* Row 8: URL template (conditional) */}
                  {entry.isLink && (
                    <InlineField
                      label={t('geomap.advanced-tooltip.entry.link-template', 'URL template')}
                      labelWidth={18}
                      grow
                      tooltip={t(
                        'geomap.advanced-tooltip.entry.link-template-description',
                        'Optional URL template with variables. Use {{value}} for this entry or {{FieldName}} to reference other fields.'
                      )}
                    >
                      <Input
                        value={entry.linkTemplate ?? ''}
                        placeholder={t(
                          'geomap.advanced-tooltip.entry.link-template-placeholder',
                          'e.g., /d/dashboard?var-id={{value}}'
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
          {t('geomap.advanced-tooltip.entry.add-field', 'Add field')}
        </Button>
        <Button
          variant="secondary"
          icon="plus"
          onClick={() => handleAdd('custom')}
          disabled={entries.length >= MAX_DETAIL_ITEMS}
        >
          {t('geomap.advanced-tooltip.entry.add-custom', 'Add custom text')}
        </Button>
      </HorizontalGroup>
      {entries.length >= MAX_DETAIL_ITEMS && (
        <div className={styles.limitNote}>
          {t('geomap.advanced-tooltip.entry.limit', `Maximum ${MAX_DETAIL_ITEMS} items reached.`)}
        </div>
      )}
    </div>
  );
};

export function buildFieldOptions(frames: DataFrame[]): Array<SelectableValue<string>> {
  if (!frames.length) {
    return [];
  }
  const options: Array<SelectableValue<string>> = [];
  for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
    const frame = frames[frameIndex];
    if (!frame || !frame.fields) {
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
                        } as AdvancedTooltipFieldOptionData,
      });
    }
  }
  return options;
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    width: '100%',
    maxWidth: '100%',
  }),
  entry: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    background: theme.colors.background.secondary,
    boxShadow: theme.shadows.z1,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    '&:hover': {
      borderColor: theme.colors.border.strong,
      boxShadow: theme.shadows.z2,
    },
  }),
  entryHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  entryBody: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(0.5),
    width: '100%',
    '& > *': {
      width: '100%',
      maxWidth: '100%',
    },
  }),
  empty: css({
    padding: theme.spacing(2),
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    border: `1px dashed ${theme.colors.border.weak}`,
  }),
  limitNote: css({
    fontSize: theme.typography.size.sm,
    color: theme.colors.warning.text,
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    background: theme.colors.warning.transparent,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.warning.border}`,
  }),
});
