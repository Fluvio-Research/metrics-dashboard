import { useMemo } from 'react';

import { css } from '@emotion/css';
import {
  DataFrame,
  GrafanaTheme2,
  getFieldDisplayName,
  SelectableValue,
  StandardEditorProps,
  PanelData,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import {
  Button,
  HorizontalGroup,
  IconButton,
  InlineField,
  Input,
  Select,
  Switch,
  useStyles2,
} from '@grafana/ui';

import { IconPicker } from '../components/IconPicker';

export type VariableMapping = {
  id: string;
  fieldName?: string; // Field name to get value from
  variableName: string; // Dashboard variable name (without $)
};

export type AdvancedTooltipButtonConfig = {
  enabled: boolean;
  buttonText?: string;
  buttonIcon?: string;
  variableMappings?: VariableMapping[];
};

export interface AdvancedTooltipFieldOptionData {
  frameIndex: number;
  fieldIndex: number;
  frameRefId?: string;
  fieldName: string;
  display: string;
  fieldType: any;
}

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

type Props = StandardEditorProps<AdvancedTooltipButtonConfig>;

let mappingCounter = 0;
const createMappingId = () => `var-mapping-${mappingCounter++}`;

export const AdvancedTooltipButtonEditor = ({ value, onChange, context }: Props) => {
  const styles = useStyles2(getStyles);
  
  // Context.data can be either PanelData with .series property, or directly the series array
  const frames = Array.isArray(context.data) 
    ? context.data 
    : (context.data as unknown as PanelData | undefined)?.series ?? [];
  
  const config: AdvancedTooltipButtonConfig = value ?? {
    enabled: false,
    buttonText: 'Update Variables',
    buttonIcon: 'sync',
    variableMappings: [],
  };

  const fieldOptions = useMemo(() => buildFieldOptions(frames), [frames]);

  const update = (patch: Partial<AdvancedTooltipButtonConfig>) => {
    onChange({ ...config, ...patch });
  };

  const handleAddMapping = () => {
    const newMapping: VariableMapping = {
      id: createMappingId(),
      variableName: '',
    };
    update({ variableMappings: [...(config.variableMappings ?? []), newMapping] });
  };

  const handleUpdateMapping = (index: number, patch: Partial<VariableMapping>) => {
    const mappings = [...(config.variableMappings ?? [])];
    mappings[index] = { ...mappings[index], ...patch };
    update({ variableMappings: mappings });
  };

  const handleRemoveMapping = (index: number) => {
    const mappings = (config.variableMappings ?? []).filter((_, idx) => idx !== index);
    update({ variableMappings: mappings.length ? mappings : undefined });
  };

  const moveMapping = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    const mappings = config.variableMappings ?? [];
    if (target < 0 || target >= mappings.length) {
      return;
    }
    const next = [...mappings];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    update({ variableMappings: next });
  };

  const resolveFieldOption = (fieldName?: string): SelectableValue<string> | undefined => {
    if (!fieldName || !fieldOptions.length) {
      return undefined;
    }
    return fieldOptions.find((opt) => {
      const data = opt.data as AdvancedTooltipFieldOptionData | undefined;
      return data?.fieldName === fieldName;
    });
  };

  return (
    <div className={styles.wrapper}>
      <InlineField 
        label={t('geomap.advanced-tooltip.button.enabled', 'Enable button')} 
        labelWidth={18}
        tooltip={t('geomap.advanced-tooltip.button.enabled-tooltip', 'Show a button in the tooltip to update dashboard variables')}
      >
        <Switch 
          value={config.enabled} 
          onChange={(e) => update({ enabled: e.currentTarget.checked })} 
        />
      </InlineField>

      {config.enabled && (
        <>
          <InlineField 
            label={t('geomap.advanced-tooltip.button.text', 'Button text')} 
            labelWidth={18} 
            grow
            tooltip={t('geomap.advanced-tooltip.button.text-tooltip', 'Text to display on the button')}
          >
            <Input
              value={config.buttonText ?? ''}
              placeholder={t('geomap.advanced-tooltip.button.text-placeholder', 'e.g., "Update Variables", "Apply Filters"')}
              onChange={(e) => update({ buttonText: e.currentTarget.value })}
            />
          </InlineField>

          <InlineField 
            label={t('geomap.advanced-tooltip.button.icon', 'Button icon')} 
            labelWidth={18} 
            grow
            tooltip={t('geomap.advanced-tooltip.button.icon-tooltip', 'Icon to display on the button')}
          >
            <IconPicker
              value={config.buttonIcon ?? ''}
              placeholder={t('geomap.advanced-tooltip.button.icon-placeholder', 'e.g., "sync", "filter"')}
              onChange={(icon) => update({ buttonIcon: icon })}
            />
          </InlineField>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h6 className={styles.sectionTitle}>
                {t('geomap.advanced-tooltip.button.variable-mappings', 'Variable Mappings')}
              </h6>
              <span className={styles.sectionDescription}>
                {t('geomap.advanced-tooltip.button.variable-mappings-description', 'Map table fields to dashboard variables')}
              </span>
            </div>

            {!fieldOptions.length && (
              <div className={styles.empty}>
                {t('geomap.advanced-tooltip.button.no-fields', 'No fields available. Run the panel queries first.')}
              </div>
            )}

            {(config.variableMappings ?? []).map((mapping, index) => (
              <div className={styles.mapping} key={mapping.id ?? index}>
                <div className={styles.mappingHeader}>
                  <span className={styles.mappingLabel}>
                    {t('geomap.advanced-tooltip.button.mapping', 'Mapping')} {index + 1}
                  </span>
                  <HorizontalGroup spacing="xs">
                    <IconButton
                      name="arrow-up"
                      disabled={index === 0}
                      onClick={() => moveMapping(index, -1)}
                      tooltip={t('geomap.advanced-tooltip.button.move-up', 'Move up')}
                    />
                    <IconButton
                      name="arrow-down"
                      disabled={index === (config.variableMappings?.length ?? 0) - 1}
                      onClick={() => moveMapping(index, 1)}
                      tooltip={t('geomap.advanced-tooltip.button.move-down', 'Move down')}
                    />
                    <IconButton
                      name="trash-alt"
                      onClick={() => handleRemoveMapping(index)}
                      tooltip={t('geomap.advanced-tooltip.button.remove', 'Remove mapping')}
                    />
                  </HorizontalGroup>
                </div>

                <div className={styles.mappingBody}>
                  <InlineField 
                    label={t('geomap.advanced-tooltip.button.field', 'Field')} 
                    labelWidth={14} 
                    grow
                    tooltip={t('geomap.advanced-tooltip.button.field-tooltip', 'Select the field to get the value from')}
                  >
                    <Select
                      options={fieldOptions}
                      value={
                        resolveFieldOption(mapping.fieldName) ??
                        (mapping.fieldName
                          ? { 
                              label: `${mapping.fieldName} (not found)`, 
                              value: mapping.fieldName,
                              description: 'Field not found in current data'
                            }
                          : undefined)
                      }
                      onChange={(selection) => {
                        if (!selection?.value) {
                          handleUpdateMapping(index, { fieldName: undefined });
                          return;
                        }
                        const data = selection.data as AdvancedTooltipFieldOptionData | undefined;
                        handleUpdateMapping(index, { fieldName: data?.fieldName ?? selection.value });
                      }}
                      isClearable
                      isDisabled={!fieldOptions.length}
                      placeholder={
                        fieldOptions.length === 0 
                          ? t('geomap.advanced-tooltip.button.field-placeholder-empty', 'Run query first...') 
                          : t('geomap.advanced-tooltip.button.field-placeholder', 'Select a field')
                      }
                      menuShouldPortal
                    />
                  </InlineField>

                  <InlineField 
                    label={t('geomap.advanced-tooltip.button.variable', 'Variable name')} 
                    labelWidth={14} 
                    grow
                    tooltip={t('geomap.advanced-tooltip.button.variable-tooltip', 'Dashboard variable name (without $)')}
                  >
                    <Input
                      value={mapping.variableName ?? ''}
                      placeholder={t('geomap.advanced-tooltip.button.variable-placeholder', 'e.g., "cluster_id", "status"')}
                      onChange={(e) => handleUpdateMapping(index, { variableName: e.currentTarget.value })}
                    />
                  </InlineField>
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              icon="plus"
              onClick={handleAddMapping}
              disabled={!fieldOptions.length}
            >
              {t('geomap.advanced-tooltip.button.add-mapping', 'Add variable mapping')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    width: '100%',
  }),
  section: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  sectionHeader: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  }),
  sectionTitle: css({
    margin: 0,
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.h6.fontWeight,
    color: theme.colors.text.primary,
  }),
  sectionDescription: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  mapping: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    background: theme.colors.background.primary,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      borderColor: theme.colors.border.strong,
      boxShadow: theme.shadows.z1,
    },
  }),
  mappingHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  mappingLabel: css({
    fontSize: theme.typography.h6.fontSize,
    fontWeight: 500,
    color: theme.colors.text.primary,
  }),
  mappingBody: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }),
  empty: css({
    padding: theme.spacing(2),
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    border: `1px dashed ${theme.colors.border.weak}`,
    textAlign: 'center',
  }),
});











































