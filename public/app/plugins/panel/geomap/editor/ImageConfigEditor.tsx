import { css } from '@emotion/css';

import { GrafanaTheme2, StandardEditorProps, PanelData, SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { 
  InlineField, 
  Input, 
  RadioButtonGroup, 
  Select, 
  TextArea,
  useStyles2,
  Alert,
} from '@grafana/ui';

export interface ImageConfig {
  mode: 'field' | 'template' | 'static';
  fieldName?: string;
  urlTemplate?: string;
  staticUrl?: string;
  fallbackImageUrl?: string; // Image to show when main image fails to load
}

type Props = StandardEditorProps<ImageConfig>;

export const ImageConfigEditor = ({ value, onChange, context }: Props) => {
  const styles = useStyles2(getStyles);
  const config: ImageConfig = value || { mode: 'field' };
  
  const frames = Array.isArray(context.data) 
    ? context.data 
    : (context.data as unknown as PanelData | undefined)?.series ?? [];

  const fieldOptions: Array<SelectableValue<string>> = frames.flatMap((frame, frameIdx) => 
    frame.fields?.map((field) => ({
      label: field.name,
      value: field.name,
      description: `${field.type} (Frame ${frameIdx})`,
    })) || []
  );

  const update = (patch: Partial<ImageConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <div className={styles.wrapper}>
      <InlineField 
        label={t('geomap.advanced-tooltip.image-mode', 'Image source')} 
        labelWidth={18}
        grow
      >
        <RadioButtonGroup
          value={config.mode}
          options={[
            { label: 'Field', value: 'field', description: 'Use a field containing image URLs' },
            { label: 'Template', value: 'template', description: 'Build URL from field values' },
            { label: 'Static', value: 'static', description: 'Use a fixed image URL' },
          ]}
          onChange={(val) => update({ mode: val as 'field' | 'template' | 'static' })}
        />
      </InlineField>

      {config.mode === 'field' && (
        <>
          <InlineField 
            label={t('geomap.advanced-tooltip.image-field', 'Image URL field')} 
            labelWidth={18}
            grow
          >
            <Select
              options={fieldOptions}
              value={fieldOptions.find((opt) => opt.value === config.fieldName)}
              onChange={(selection) => update({ fieldName: selection?.value })}
              isClearable
              placeholder="Select field with image URLs"
              menuShouldPortal
            />
          </InlineField>
          <Alert severity="info" title="Field mode">
            Select a field that contains complete image URLs (e.g., https://example.com/images/photo.jpg)
          </Alert>
        </>
      )}

      {config.mode === 'template' && (
        <>
          <InlineField 
            label={t('geomap.advanced-tooltip.image-template', 'URL template')} 
            labelWidth={18}
            grow
            tooltip="Use {{fieldName}} to insert field values into the URL"
          >
            <TextArea
              rows={3}
              value={config.urlTemplate ?? ''}
              placeholder="https://example.com/images/{{id}}.jpg"
              onChange={(e) => update({ urlTemplate: e.currentTarget.value })}
            />
          </InlineField>
          <Alert severity="info" title="Template mode">
            <div className={styles.alertContent}>
              <p>Use <code>{`{{fieldName}}`}</code> to insert field values into the URL.</p>
              <p><strong>Example:</strong></p>
              <code>https://mysite.com/images/{`{{serial}}`}.jpg</code>
              <p style={{ marginTop: '8px' }}>
                If your data has a field called "serial" with value "ABC123", 
                the image URL will be: <code>https://mysite.com/images/ABC123.jpg</code>
              </p>
              <p style={{ marginTop: '8px' }}>
                <strong>Available fields:</strong> {fieldOptions.map(f => f.label).join(', ') || 'None'}
              </p>
            </div>
          </Alert>
        </>
      )}

      {config.mode === 'static' && (
        <>
          <InlineField 
            label={t('geomap.advanced-tooltip.image-url', 'Image URL')} 
            labelWidth={18}
            grow
          >
            <Input
              value={config.staticUrl ?? ''}
              placeholder="https://example.com/image.jpg"
              onChange={(e) => update({ staticUrl: e.currentTarget.value })}
            />
          </InlineField>
          <Alert severity="info" title="Static mode">
            All markers will show the same image. Enter a complete image URL.
          </Alert>
        </>
      )}

      <InlineField 
        label={t('geomap.advanced-tooltip.fallback-image', 'Fallback image URL')} 
        labelWidth={18}
        grow
        tooltip={t(
          'geomap.advanced-tooltip.fallback-image-tooltip',
          'Image to display when the main image fails to load (e.g., missing photo placeholder)'
        )}
      >
        <Input
          value={config.fallbackImageUrl ?? ''}
          placeholder="https://example.com/fallback-image.png"
          onChange={(e) => update({ fallbackImageUrl: e.currentTarget.value || undefined })}
        />
      </InlineField>
      {config.fallbackImageUrl && (
        <Alert severity="info" title="Fallback image">
          If the main image fails to load, this image will be shown instead. Leave empty to hide the image on error.
        </Alert>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    width: '100%',
  }),
  alertContent: css({
    fontSize: theme.typography.size.sm,
    '& code': {
      background: theme.colors.background.secondary,
      padding: '2px 6px',
      borderRadius: theme.shape.radius.default,
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.size.xs,
    },
    '& p': {
      margin: 0,
      marginBottom: theme.spacing(0.5),
    },
  }),
});

