import React, { useState, useEffect } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Select, Alert, Field, Spinner } from '@grafana/ui';
import { css } from '@emotion/css';

interface PresetOption {
  label: string;
  value: string;
  description?: string;
}

interface PresetSelectorProps extends StandardEditorProps<string> {}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [presets, setPresets] = useState<PresetOption[]>([]);

  useEffect(() => {
    loadPresetsFromAllDatasources();
  }, []);

  const loadPresetsFromAllDatasources = async () => {
    setLoading(true);
    setError(undefined);

    try {
      // Get all DynamoDB datasources
      const allDs = await getDataSourceSrv().getList();
      const dynamoDbDs = allDs.filter(
        (ds) => ds.type === 'fluvio-connect-dynamodb' || ds.type?.includes('dynamodb')
      );

      if (dynamoDbDs.length === 0) {
        setError('No Fluvio DynamoDB datasources found. Please configure a Fluvio DynamoDB datasource first:\n\n1. Go to Connections → Data sources\n2. Add new → Search for "Fluvio DynamoDB"\n3. Configure and Save & Test');
        setLoading(false);
        return;
      }

      // Fetch presets from all datasources
      const allPresets: PresetOption[] = [];

      for (const ds of dynamoDbDs) {
        try {
          const datasource = await getDataSourceSrv().get(ds.uid);
          const result = await (datasource as any).getResource('presets');

          if (result?.presets && Array.isArray(result.presets)) {
            result.presets.forEach((preset: any) => {
              allPresets.push({
                label: `${preset.name} (${ds.name})`,
                value: preset.id,
                description: preset.description || `${preset.operation} on ${preset.table}`,
              });
            });
          }
        } catch (err) {
          console.warn(`Failed to load presets from datasource ${ds.name}:`, err);
        }
      }

      if (allPresets.length === 0) {
        setError('No presets found. Create a preset using the Template Manager above.');
      }

      setPresets(allPresets);
    } catch (err) {
      console.error('Failed to load presets:', err);
      setError('Failed to load presets. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyles = css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  const infoStyles = css`
    padding: 12px;
    background: rgba(36, 41, 46, 0.5);
    border-radius: 4px;
    font-size: 13px;
    line-height: 1.6;
  `;

  return (
    <div className={containerStyles}>
      <div className={infoStyles}>
        <strong>📌 How it works:</strong> Select a template to lock it for this panel. 
        When configured, viewers will only see the upload interface without template selection options.
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Spinner />
          <span>Loading templates...</span>
        </div>
      ) : error ? (
        <Alert severity="warning" title="No Templates Available">
          {error}
        </Alert>
      ) : (
        <Field label="Upload Template" description="Choose the template for this panel">
          <Select
            options={presets}
            value={value}
            onChange={(selected) => onChange(selected?.value)}
            placeholder="Select a template..."
            isClearable
            noOptionsMessage="No templates available"
          />
        </Field>
      )}

      {value && (
        <Alert severity="success" title="Template Configured">
          This panel will use the selected template. Viewers won't see template selection options.
        </Alert>
      )}

      {!value && !loading && !error && (
        <Alert severity="info" title="No Template Selected">
          Without a configured template, all available templates will be shown and viewers can choose any one.
        </Alert>
      )}
    </div>
  );
};

