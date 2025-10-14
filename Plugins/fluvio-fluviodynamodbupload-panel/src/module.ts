import { PanelPlugin } from '@grafana/data';
import { UploadPanelOptions } from './types';
import { UploadPanel } from './components/UploadPanel';

export const plugin = new PanelPlugin<UploadPanelOptions>(UploadPanel).setPanelOptions((builder) => {
  return builder
    .addDataSourcePicker({
      path: 'datasource',
      name: 'Datasource',
      description: 'Select the Fluvio DynamoDB datasource used for uploads',
      settings: {
        filter: (ds) => ds.type === 'fluvio-connect-dynamodb',
      },
    })
    .addSelect({
      path: 'inputMode',
      name: 'Default input mode',
      defaultValue: 'form',
      settings: {
        options: [
          { value: 'form', label: 'Form fields' },
          { value: 'json', label: 'Raw JSON' },
        ],
      },
    })
    .addBooleanSwitch({
      path: 'autoPreview',
      name: 'Auto preview after changes',
      defaultValue: false,
    })
    .addTextInput({
      path: 'presetId',
      name: 'Preset ID (optional)',
      description: 'Preset to pre-select when the panel loads. Must match an ID configured in the datasource.',
    });
});
