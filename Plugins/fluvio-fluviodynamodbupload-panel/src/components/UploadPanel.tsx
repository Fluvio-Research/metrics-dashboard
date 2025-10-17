import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Alert, Button, CodeEditor, HorizontalGroup, InlineField, InlineFieldRow, Input, RadioButtonGroup, Select, Spinner, TextArea } from '@grafana/ui';
import { css } from '@emotion/css';
import { UploadPanelOptions, UploadPresetSummary, UploadPreviewResponse, UploadExecuteResponse, UploadField, UploadInputMode } from '../types';
import { resolveFieldType } from '../utils/dynamoTypes';

type Props = PanelProps<UploadPanelOptions>;

export const UploadPanel: React.FC<Props> = ({ options, width, height }) => {
  const [presets, setPresets] = useState<UploadPresetSummary[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [presetError, setPresetError] = useState<string | undefined>();
  const [selectedPresetId, setSelectedPresetId] = useState(options.presetId ?? '');
  const [inputMode, setInputMode] = useState<UploadInputMode>(options.inputMode ?? 'form');

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [extraFieldsJson, setExtraFieldsJson] = useState<string>('');
  const [jsonPayload, setJsonPayload] = useState<string>('');

  const [preview, setPreview] = useState<UploadPreviewResponse | null>(null);
  const [executeResult, setExecuteResult] = useState<UploadExecuteResponse | null>(null);
  const [actionError, setActionError] = useState<string | undefined>();
  const [actionLoading, setActionLoading] = useState<'preview' | 'execute' | null>(null);

  useEffect(() => {
    setSelectedPresetId(options.presetId ?? '');
  }, [options.presetId]);

  useEffect(() => {
    if (options.inputMode) {
      setInputMode(options.inputMode);
    }
  }, [options.inputMode]);

  const selectedDatasourceKey = options.datasource?.uid;

  const fetchPresets = useCallback(async () => {
    if (!selectedDatasourceKey) {
      setPresets([]);
      setPresetError('Select a Fluvio DynamoDB datasource');
      return;
    }

    setLoadingPresets(true);
    setPresetError(undefined);
    try {
      const ds = await getDataSourceSrv().get(selectedDatasourceKey);
      const supportsResources = typeof (ds as any)?.getResource === 'function';
      if (!supportsResources) {
        throw new Error('Selected datasource does not support upload resources');
      }

      const response = await (ds as any).getResource('upload/presets');
      const loaded: UploadPresetSummary[] = response?.presets ?? [];
      setPresets(loaded);

      if (loaded.length > 0) {
        const initialId = options.presetId ?? selectedPresetId ?? loaded[0].id;
        setSelectedPresetId(initialId);
      } else {
        setSelectedPresetId('');
        setPresetError('Datasource does not define any upload presets yet');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load presets';
      setPresetError(message);
      setPresets([]);
      setSelectedPresetId('');
    } finally {
      setLoadingPresets(false);
    }
  }, [selectedDatasourceKey, options.presetId, selectedPresetId]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId),
    [presets, selectedPresetId]
  );

  useEffect(() => {
    if (!selectedPreset) {
      setFormValues({});
      setExtraFieldsJson('');
      return;
    }

    setFormValues((prev) => {
      const next: Record<string, string> = {};
      selectedPreset.schema?.forEach((field) => {
        next[field.name] = prev[field.name] ?? '';
      });
      return next;
    });
    setExtraFieldsJson('');
    setActionError(undefined);
    setPreview(null);
    setExecuteResult(null);
  }, [selectedPreset]);

  const panelStyles = useMemo(
    () =>
      css`
        width: ${width}px;
        height: ${height}px;
        overflow: auto;
        padding: 12px;
      `,
    [width, height]
  );

  const presetOptions = presets.map((preset) => ({
    label: `${preset.name} (${preset.operation.toUpperCase()})`,
    value: preset.id,
    description: preset.description,
  }));

  const handleFieldChange = (field: UploadField, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field.name]: value,
    }));
  };

  const buildItems = () => {
    if (!selectedPreset) {
      throw new Error('Select an upload preset');
    }

    if (inputMode === 'json') {
      if (!jsonPayload.trim()) {
        throw new Error('Provide a JSON payload');
      }
      const parsed = JSON.parse(jsonPayload);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          throw new Error('Provide at least one JSON item');
        }
        return parsed;
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return [parsed];
      }
      throw new Error('JSON payload must be an object or array of objects');
    }

    const item: Record<string, unknown> = {};
    selectedPreset.schema?.forEach((field) => {
      const raw = formValues[field.name];
      if (!raw) {
        if (field.required) {
          throw new Error(`Field "${field.name}" is required`);
        }
        return;
      }
      item[field.name] = coerceFormValue(field, raw);
    });

    if (selectedPreset.allowAdHocFields && extraFieldsJson.trim()) {
      const additional = JSON.parse(extraFieldsJson);
      if (Array.isArray(additional)) {
        throw new Error('Additional fields JSON must be an object');
      }
      Object.assign(item, additional);
    }

    if (Object.keys(item).length === 0) {
      throw new Error('Provide at least one field value');
    }

    return [item];
  };

  const executeAction = async (path: 'upload/preview' | 'upload/execute', dryRun = false) => {
    if (!selectedDatasourceKey) {
      throw new Error('Datasource not configured');
    }
    const ds = await getDataSourceSrv().get(selectedDatasourceKey);
    const supportsResources = typeof (ds as any)?.postResource === 'function';
    if (!supportsResources) {
      throw new Error('Datasource does not support upload actions');
    }
    const items = buildItems();
    const payload = {
      presetId: selectedPresetId,
      items,
      dryRun,
    };
    return (ds as any).postResource(path, payload);
  };

  const handlePreview = async () => {
    if (!selectedPreset) {
      setActionError('Select an upload preset');
      return;
    }
    setActionError(undefined);
    setActionLoading('preview');
    setPreview(null);
    try {
      const response: UploadPreviewResponse = await executeAction('upload/preview', true);
      setPreview(response);
    } catch (error) {
      const message = extractErrorMessage(error);
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecute = async () => {
    if (!selectedPreset) {
      setActionError('Select an upload preset');
      return;
    }
    setActionError(undefined);
    setActionLoading('execute');
    setExecuteResult(null);
    try {
      const response: UploadExecuteResponse = await executeAction('upload/execute', false);
      setExecuteResult(response);
      setPreview(null);
    } catch (error) {
      const message = extractErrorMessage(error);
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={panelStyles}>
      <InlineFieldRow>
        <InlineField label="Preset" grow>
          {loadingPresets ? (
            <HorizontalGroup>
              <Spinner />
              <span>Loading presets…</span>
            </HorizontalGroup>
          ) : (
            <Select
              options={presetOptions}
              value={selectedPresetId}
              onChange={(value) => {
                setSelectedPresetId(value?.value ?? '');
              }}
              placeholder="Select preset"
              isClearable
            />
          )}
        </InlineField>
        <InlineField label="Input mode">
          <RadioButtonGroup
            options={[
              { label: 'Form', value: 'form' },
              { label: 'JSON', value: 'json' },
            ]}
            value={inputMode}
            onChange={(value) => setInputMode(value as UploadInputMode)}
          />
        </InlineField>
      </InlineFieldRow>

      {presetError && (
        <Alert severity="error" title="Preset error">
          {presetError}
        </Alert>
      )}

      {selectedPreset && (
        <div>
          <Alert severity="info" title={selectedPreset.name}>
            <div>Operation: {selectedPreset.operation.toUpperCase()}</div>
            <div>Target table: {selectedPreset.table}</div>
            {selectedPreset.allowDryRun && <div>Dry run supported</div>}
            {selectedPreset.description && <div>{selectedPreset.description}</div>}
          </Alert>

          {inputMode === 'form' && (
            <div>
              {selectedPreset.schema && selectedPreset.schema.length > 0 ? (
                selectedPreset.schema.map((field) => (
                  <InlineFieldRow key={field.name}>
                    <InlineField
                      label={field.name}
                      tooltip={field.description || ''}
                      labelWidth={20}
                      grow
                    >
                      <Input
                        value={formValues[field.name] ?? ''}
                        placeholder={field.type ? `${field.type}${field.required ? ' (required)' : ''}` : field.required ? 'required' : ''}
                        onChange={(event) => handleFieldChange(field, event.currentTarget.value)}
                      />
                    </InlineField>
                  </InlineFieldRow>
                ))
              ) : (
                <Alert severity="warning" title="No schema defined">
                  This preset does not define a schema. Use JSON mode to provide payloads.
                </Alert>
              )}

              {selectedPreset.allowAdHocFields && (
                <InlineField label="Additional fields (JSON)" labelWidth={20} grow>
                  <TextArea
                    rows={4}
                    value={extraFieldsJson}
                    onChange={(event) => setExtraFieldsJson(event.currentTarget.value)}
                    placeholder='{"extraAttribute": "value"}'
                  />
                </InlineField>
              )}
            </div>
          )}

          {inputMode === 'json' && (
            <CodeEditor
              language="json"
              height={Math.max(160, height / 2)}
              value={jsonPayload}
              onChange={(value) => setJsonPayload(value ?? '')}
              showMiniMap={false}
            />
          )}

          <HorizontalGroup spacing="md" style={{ marginTop: '12px' }}>
            <Button
              icon={actionLoading === 'preview' ? undefined : 'search'}
              onClick={handlePreview}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'preview' ? <Spinner /> : 'Preview'}
            </Button>
            <Button
              icon="cloud-upload"
              variant="primary"
              onClick={handleExecute}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'execute' ? <Spinner /> : 'Upload'}
            </Button>
          </HorizontalGroup>
        </div>
      )}

      {actionError && (
        <Alert severity="error" title="Upload error" style={{ marginTop: '16px' }}>
          {actionError}
        </Alert>
      )}

      {preview && (
        <Alert severity="info" title={`Preview (${preview.itemCount} statement${preview.itemCount === 1 ? '' : 's'})`} style={{ marginTop: '16px' }}>
          <div>Payload size: {formatBytes(preview.payloadSizeBytes)}</div>
          {preview.statements.map((statement, index) => (
            <pre key={index}>{statement}</pre>
          ))}
        </Alert>
      )}

      {executeResult && (
        <Alert severity="success" title={`Upload complete (${executeResult.itemCount} statement${executeResult.itemCount === 1 ? '' : 's'})`} style={{ marginTop: '16px' }}>
          <div>Payload size: {formatBytes(executeResult.payloadSizeBytes)}</div>
          {executeResult.consumedCapacity && executeResult.consumedCapacity.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Consumed capacity</strong>
              <ul>
                {executeResult.consumedCapacity.map((entry, idx) => (
                  <li key={idx}>
                    {entry.tableName || 'table'}: {entry.capacityUnits.toFixed(3)} units
                  </li>
                ))}
              </ul>
            </div>
          )}
          {executeResult.results && executeResult.results.length > 0 && (
            <CodeEditor
              value={JSON.stringify(executeResult.results, null, 2)}
              language="json"
              height={Math.max(120, height / 3)}
              readOnly
              showMiniMap={false}
            />
          )}
          {executeResult.warnings && executeResult.warnings.length > 0 && (
            <Alert severity="warning" title="Warnings">
              <ul>
                {executeResult.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}
        </Alert>
      )}
    </div>
  );
};

function extractErrorMessage(error: unknown): string {
  if (!error) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  const data = (error as any)?.data;
  if (typeof data === 'string') {
    return data;
  }
  if (data?.error) {
    return data.error;
  }
  if (data?.message) {
    return data.message;
  }
  return 'Unexpected error';
}

function coerceFormValue(field: UploadField, raw: string): unknown {
  const trimmed = raw.trim();
  const effectiveType = resolveFieldType(field);

  switch (effectiveType) {
    case 'number': {
      if (trimmed === '') {
        return undefined;
      }
      const numeric = Number(trimmed);
      if (Number.isNaN(numeric)) {
        throw new Error(`Field "${field.name}" must be a valid number`);
      }
      return numeric;
    }
    case 'boolean': {
      if (['true', 'false'].includes(trimmed.toLowerCase())) {
        return trimmed.toLowerCase() === 'true';
      }
      throw new Error(`Field "${field.name}" must be true or false`);
    }
    case 'json': {
      if (!trimmed) {
        return undefined;
      }
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        throw new Error(`Field "${field.name}" must contain valid JSON`);
      }
    }
    case 'string':
    default:
      return trimmed;
  }
}

function formatBytes(bytes: number): string {
  if (!bytes) {
    return '0 B';
  }
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${sizes[i]}`;
}
