import { css } from '@emotion/css';
import { useMemo } from 'react';

import { FieldType, GrafanaTheme2, StandardEditorProps, PanelData } from '@grafana/data';
import { t } from '@grafana/i18n';
import { ColorPicker, InlineField, Input, Select, Switch, useStyles2 } from '@grafana/ui';

import { buildFieldOptions } from './AdvancedToolPitFieldsEditor';
import { IconPicker } from '../components/IconPicker';

export interface AdvancedToolPitHeaderConfig {
  fieldKey?: string;
  fieldName?: string;
  customText?: string;
  icon?: string;
  iconColor?: string;
  hideDuplicate?: boolean;
}

type Props = StandardEditorProps<AdvancedToolPitHeaderConfig>;

export const AdvancedToolPitHeaderEditor = ({ value, onChange, context }: Props) => {
  const styles = useStyles2(getStyles);
  const header: AdvancedToolPitHeaderConfig = { hideDuplicate: true, ...(value ?? {}) };
  // Context.data can be either PanelData with .series property, or directly the series array
  const frames = Array.isArray(context.data) 
    ? context.data 
    : (context.data as unknown as PanelData | undefined)?.series ?? [];

  const allOptions = useMemo(() => buildFieldOptions(frames), [frames]);
  
  const allowedTypes =
    (context.options as { config?: { fieldTypes?: FieldType[] } } | undefined)?.config?.fieldTypes;
  const fieldOptions = useMemo(() => {
    if (!allowedTypes || !allowedTypes.length) {
      return allOptions;
    }
    return allOptions.filter((option) => {
      const data = option.data as { fieldType: FieldType } | undefined;
      return data ? allowedTypes.includes(data.fieldType) : true;
    });
  }, [allOptions, allowedTypes]);

  const update = (patch: Partial<AdvancedToolPitHeaderConfig>) => {
    onChange({ ...header, ...patch });
  };

  const selectedOption =
    header.fieldKey && fieldOptions.length
      ? fieldOptions.find((opt) => opt.value === header.fieldKey)
      : undefined;

  return (
    <div className={styles.wrapper}>
      <InlineField label={t('geomap.advanced-toolpit.header.field', 'Field')} labelWidth={10} grow>
        <Select
          options={fieldOptions}
          value={selectedOption}
          placeholder={
            fieldOptions.length === 0 
              ? 'Run query first...' 
              : t('geomap.advanced-toolpit.header.field-placeholder', 'Select field')
          }
          isClearable
          isDisabled={!fieldOptions.length}
          noOptionsMessage={
            fieldOptions.length === 0 
              ? 'Run query to load fields' 
              : t('geomap.advanced-toolpit.header.no-options', 'No fields available')
          }
          menuShouldPortal
          onChange={(selection) => {
            if (!selection?.value) {
              update({ fieldKey: undefined, fieldName: undefined });
              return;
            }
            const data = selection.data as FieldOptionData | undefined;
            update({
              fieldKey: selection.value,
              fieldName: data?.display ?? selection.label ?? selection.value,
            });
          }}
        />
      </InlineField>

      <InlineField
        label={t('geomap.advanced-toolpit.header.custom-text', 'Fallback text')}
        labelWidth={10}
        grow
        tooltip={t(
          'geomap.advanced-toolpit.header.custom-text-tooltip',
          'Used when no field is selected or the field has no value.'
        )}
      >
        <Input
          value={header.customText ?? ''}
          onChange={(event) => update({ customText: event.currentTarget.value })}
          placeholder={t('geomap.advanced-toolpit.header.custom-text-placeholder', 'Enter custom title')}
        />
      </InlineField>

      <InlineField
        label={t('geomap.advanced-toolpit.header.hide-duplicate', 'Hide duplicate row')}
        labelWidth={12}
        tooltip={t(
          'geomap.advanced-toolpit.header.hide-duplicate-tooltip',
          'Hide matching detail rows that use the same field as the header.'
        )}
      >
        <Switch
          value={header.hideDuplicate !== false}
          onChange={(e) => update({ hideDuplicate: e.currentTarget.checked })}
        />
      </InlineField>

      <InlineField label={t('geomap.advanced-toolpit.header.icon', 'Icon')} labelWidth={10} grow>
        <IconPicker
          value={header.icon ?? ''}
          onChange={(icon) => update({ icon })}
          placeholder={t('geomap.advanced-toolpit.header.icon-placeholder', 'Icon name, emoji, or URL')}
        />
      </InlineField>

      <InlineField label={t('geomap.advanced-toolpit.header.icon-color', 'Icon color')} labelWidth={10}>
        <ColorPicker
          color={header.iconColor ?? ''}
          enableNamedColors
          onChange={(color) => update({ iconColor: color && color.trim().length ? color : undefined })}
        />
      </InlineField>
    </div>
  );
};

interface FieldOptionData {
  fieldType: FieldType;
  display: string;
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }),
});
