import { PanelPlugin } from '@grafana/data';

import { ControlPanel } from './ControlPanel';
import {
  Options,
  DisplayMode,
  PanelTheme,
  defaultOptions,
  defaultTimePickerOptions,
  defaultVariableFilterOptions,
} from './panelcfg.gen';

export const plugin = new PanelPlugin<Options>(ControlPanel)
  .setPanelOptions((builder) => {
    // Display & Theme Settings
    builder
      .addRadio({
        path: 'displayMode',
        name: 'Layout Mode',
        description: 'Choose how controls are arranged',
        category: ['Display'],
        settings: {
          options: [
            { value: DisplayMode.Horizontal, label: 'Horizontal' },
            { value: DisplayMode.Vertical, label: 'Vertical' },
            { value: DisplayMode.Compact, label: 'Compact' },
          ],
        },
        defaultValue: defaultOptions.displayMode,
      })
      .addRadio({
        path: 'panelTheme',
        name: 'Panel Theme',
        description: 'Visual style of the control panel',
        category: ['Display'],
        settings: {
          options: [
            { value: PanelTheme.Default, label: 'Default' },
            { value: PanelTheme.Glass, label: 'Glass' },
            { value: PanelTheme.Gradient, label: 'Gradient' },
            { value: PanelTheme.Minimal, label: 'Minimal' },
          ],
        },
        defaultValue: defaultOptions.panelTheme,
      })
      .addBooleanSwitch({
        path: 'showTitle',
        name: 'Show Title',
        description: 'Display a title above the controls',
        category: ['Display'],
        defaultValue: defaultOptions.showTitle,
      })
      .addTextInput({
        path: 'customTitle',
        name: 'Custom Title',
        description: 'Title text (supports variables)',
        category: ['Display'],
        defaultValue: defaultOptions.customTitle,
        showIf: (config) => config.showTitle === true,
      })
      .addSliderInput({
        path: 'borderRadius',
        name: 'Border Radius',
        description: 'Roundness of corners (in pixels)',
        category: ['Display'],
        settings: {
          min: 0,
          max: 24,
          step: 1,
        },
        defaultValue: defaultOptions.borderRadius,
      })
      .addSliderInput({
        path: 'padding',
        name: 'Padding',
        description: 'Inner spacing (in pixels)',
        category: ['Display'],
        settings: {
          min: 0,
          max: 32,
          step: 2,
        },
        defaultValue: defaultOptions.padding,
      })
      .addSliderInput({
        path: 'opacity',
        name: 'Background Opacity',
        description: 'Background transparency (%)',
        category: ['Display'],
        settings: {
          min: 0,
          max: 100,
          step: 5,
        },
        defaultValue: defaultOptions.opacity,
      });

    // Time Picker Settings
    builder
      .addBooleanSwitch({
        path: 'timePicker.showTimePicker',
        name: 'Show Time Picker',
        description: 'Display the time range picker',
        category: ['Time Picker'],
        defaultValue: defaultTimePickerOptions.showTimePicker,
      })
      .addBooleanSwitch({
        path: 'timePicker.showQuickRanges',
        name: 'Show Quick Ranges',
        description: 'Display quick time range presets',
        category: ['Time Picker'],
        defaultValue: defaultTimePickerOptions.showQuickRanges,
        showIf: (config) => config.timePicker?.showTimePicker === true,
      })
      .addBooleanSwitch({
        path: 'timePicker.showZoomControls',
        name: 'Show Zoom Controls',
        description: 'Display time navigation and zoom buttons',
        category: ['Time Picker'],
        defaultValue: defaultTimePickerOptions.showZoomControls,
        showIf: (config) => config.timePicker?.showTimePicker === true,
      })
      .addBooleanSwitch({
        path: 'timePicker.showRefreshButton',
        name: 'Show Refresh Button',
        description: 'Display a manual refresh button',
        category: ['Time Picker'],
        defaultValue: defaultTimePickerOptions.showRefreshButton,
        showIf: (config) => config.timePicker?.showTimePicker === true,
      })
      .addRadio({
        path: 'timePicker.labelPosition',
        name: 'Label Position',
        description: 'Show the Time Range label above, inline, or hide it',
        category: ['Time Picker'],
        settings: {
          options: [
            { value: 'above', label: 'Above' },
            { value: 'inline', label: 'Inline' },
            { value: 'hidden', label: 'Hidden' },
          ],
        },
        defaultValue: defaultTimePickerOptions.labelPosition,
        showIf: (config) => config.timePicker?.showTimePicker === true,
      });

    // Variable Filter Settings
    builder
      .addBooleanSwitch({
        path: 'variableFilters.showVariables',
        name: 'Show Variable Filters',
        description: 'Display dashboard variable filters',
        category: ['Variable Filters'],
        defaultValue: defaultVariableFilterOptions.showVariables,
      })
      .addBooleanSwitch({
        path: 'variableFilters.showLabels',
        name: 'Show Labels',
        description: 'Display labels above each filter',
        category: ['Variable Filters'],
        defaultValue: defaultVariableFilterOptions.showLabels,
        showIf: (config) => config.variableFilters?.showVariables === true,
      })
      .addBooleanSwitch({
        path: 'variableFilters.compactMode',
        name: 'Compact Mode',
        description: 'Display labels inline with filters',
        category: ['Variable Filters'],
        defaultValue: defaultVariableFilterOptions.compactMode,
        showIf: (config) => config.variableFilters?.showVariables === true,
      })
      .addTextInput({
        path: 'variableFilters.variableFilter',
        name: 'Include Variables',
        description: 'Comma-separated list of variable names to show (leave empty to show all)',
        category: ['Variable Filters'],
        defaultValue: '',
        showIf: (config) => config.variableFilters?.showVariables === true,
        settings: {
          placeholder: 'e.g., region, environment, service',
        },
      })
      .addTextInput({
        path: 'variableFilters.excludeVariables',
        name: 'Exclude Variables',
        description: 'Comma-separated list of variable names to hide',
        category: ['Variable Filters'],
        defaultValue: '',
        showIf: (config) => config.variableFilters?.showVariables === true,
        settings: {
          placeholder: 'e.g., internal_var, debug_mode',
        },
      });

    return builder;
  })
  .setMigrationHandler((panel) => {
    // Handle migration from older versions if needed
    const options = panel.options as Options;
    
    // Ensure nested objects exist
    if (!options.timePicker) {
      options.timePicker = { ...defaultTimePickerOptions };
    }
    if (!options.variableFilters) {
      options.variableFilters = { ...defaultVariableFilterOptions };
    }

    // Convert string arrays from comma-separated strings if needed
    if (typeof options.variableFilters.variableFilter === 'string') {
      options.variableFilters.variableFilter = (options.variableFilters.variableFilter as string)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
    if (typeof options.variableFilters.excludeVariables === 'string') {
      options.variableFilters.excludeVariables = (options.variableFilters.excludeVariables as string)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    return options;
  });












































