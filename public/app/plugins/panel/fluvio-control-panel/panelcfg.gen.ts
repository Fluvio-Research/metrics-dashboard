// Panel display mode
export enum DisplayMode {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Compact = 'compact',
}

// Panel theme style
export enum PanelTheme {
  Default = 'default',
  Glass = 'glass',
  Gradient = 'gradient',
  Minimal = 'minimal',
}

// Time picker display options
export interface TimePickerOptions {
  showTimePicker: boolean;
  showQuickRanges: boolean;
  showZoomControls: boolean;
  showRefreshButton: boolean;
  customQuickRanges?: string[];
  labelPosition?: 'above' | 'inline' | 'hidden';
}

// Variable filter display options
export interface VariableFilterOptions {
  showVariables: boolean;
  variableFilter: string | string[]; // List of variable names to show (empty = show all)
  excludeVariables: string | string[]; // List of variable names to hide
  showLabels: boolean;
  compactMode: boolean;
}

// Main panel options
export interface Options {
  displayMode: DisplayMode;
  panelTheme: PanelTheme;
  showTitle: boolean;
  customTitle: string;
  timePicker: TimePickerOptions;
  variableFilters: VariableFilterOptions;
  borderRadius: number;
  padding: number;
  opacity: number;
}

// Default values
export const defaultTimePickerOptions: TimePickerOptions = {
  showTimePicker: true,
  showQuickRanges: true,
  showZoomControls: true,
  showRefreshButton: true,
  customQuickRanges: [],
  labelPosition: 'above',
};

export const defaultVariableFilterOptions: VariableFilterOptions = {
  showVariables: true,
  variableFilter: '',
  excludeVariables: '',
  showLabels: true,
  compactMode: false,
};

export const defaultOptions: Options = {
  displayMode: DisplayMode.Horizontal,
  panelTheme: PanelTheme.Glass,
  showTitle: false,
  customTitle: 'Controls',
  timePicker: defaultTimePickerOptions,
  variableFilters: defaultVariableFilterOptions,
  borderRadius: 8,
  padding: 12,
  opacity: 95,
};












































