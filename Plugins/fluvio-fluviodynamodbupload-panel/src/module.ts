import { PanelPlugin } from '@grafana/data';
import { UploadPanelOptions } from './types';
import { UploadPanelEnhanced } from './components/UploadPanelEnhanced';
import { PresetManager } from './components/PresetManager';
import { PresetSelector } from './components/admin/PresetSelector';

export const plugin = new PanelPlugin<UploadPanelOptions>(UploadPanelEnhanced).setPanelOptions((builder) => {
  return builder
    .addCustomEditor({
      id: 'presetSelector',
      path: 'selectedPresetId',
      name: '🎯 Select Upload Template',
      description: 'Choose which upload template to use in this panel. When set, users will only see this template.',
      editor: PresetSelector,
      category: ['Panel Configuration'],
    })
    .addCustomEditor({
      id: 'presetManager',
      path: 'presetConfig',
      name: '📚 Manage Templates',
      description: 'Create, edit, and delete upload templates stored in files',
      editor: PresetManager,
      category: ['Template Management'],
    })
    .addRadio({
      path: 'inputMode',
      name: 'Default input mode',
      defaultValue: 'form',
      settings: {
        options: [
          { value: 'form', label: 'Form fields' },
          { value: 'json', label: 'Raw JSON' },
          { value: 'file', label: 'File Upload' },
          { value: 'wizard', label: 'Wizard' },
        ],
      },
      category: ['Panel Behavior'],
    })
    .addBooleanSwitch({
      path: 'autoPreview',
      name: 'Auto preview after changes',
      defaultValue: false,
      category: ['Panel Behavior'],
    })
    .addBooleanSwitch({
      path: 'showHelp',
      name: 'Show contextual help',
      description: 'Display help tooltips and guidance throughout the panel',
      defaultValue: true,
      category: ['Panel Behavior'],
    })
    .addBooleanSwitch({
      path: 'enableBatchUpload',
      name: 'Enable batch uploads',
      description: 'Allow multiple file uploads in file mode',
      defaultValue: true,
      category: ['Panel Behavior'],
    });
});
