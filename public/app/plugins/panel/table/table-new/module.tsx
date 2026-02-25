import {
  FieldOverrideContext,
  FieldType,
  getFieldDisplayName,
  PanelPlugin,
  ReducerID,
  standardEditorsRegistry,
  identityOverrideProcessor,
  FieldConfigProperty,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import { TableCellOptions, TableCellDisplayMode, defaultTableFieldOptions, TableCellHeight } from '@grafana/schema';

import { PaginationEditor } from './PaginationEditor';
import { TableCellOptionEditor } from './TableCellOptionEditor';
import { TablePanel } from './TablePanel';
import { tableMigrationHandler, tablePanelChangedHandler } from './migrations';
import {
  Options,
  defaultOptions,
  FieldConfig,
  TableDesignPreset,
  TableBorderStyle,
  RowStripingStyle,
  HeaderStyle,
  defaultStyling,
  VisibilityCondition,
  defaultVisibility,
  defaultClickToFilter,
} from './panelcfg.gen';
import { TableSuggestionsSupplier } from './suggestions';

export const plugin = new PanelPlugin<Options, FieldConfig>(TablePanel)
  .setPanelChangeHandler(tablePanelChangedHandler)
  .setMigrationHandler(tableMigrationHandler)
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Actions]: {
        hideFromDefaults: false,
      },
    },
    useCustomConfig: (builder) => {
      const category = [t('table-new.category-table', 'Table')];
      const cellCategory = [t('table-new.category-cell-options', 'Cell options')];
      const columnStylingCategory = [t('table-new.category-column-styling', 'Column styling')];
      builder
        .addNumberInput({
          path: 'minWidth',
          name: t('table-new.name-min-column-width', 'Minimum column width'),
          category,
          description: t('table-new.description-min-column-width', 'The minimum width for column auto resizing'),
          settings: {
            placeholder: '150',
            min: 50,
            max: 500,
          },
          shouldApply: () => true,
          defaultValue: defaultTableFieldOptions.minWidth,
        })
        .addNumberInput({
          path: 'width',
          name: t('table-new.name-column-width', 'Column width'),
          category,
          settings: {
            placeholder: t('table-new.placeholder-column-width', 'auto'),
            min: 20,
          },
          shouldApply: () => true,
          defaultValue: defaultTableFieldOptions.width,
        })
        .addRadio({
          path: 'align',
          name: t('table-new.name-column-alignment', 'Column alignment'),
          category,
          settings: {
            options: [
              { label: t('table-new.column-alignment-options.label-auto', 'Auto'), value: 'auto' },
              { label: t('table-new.column-alignment-options.label-left', 'Left'), value: 'left' },
              { label: t('table-new.column-alignment-options.label-center', 'Center'), value: 'center' },
              { label: t('table-new.column-alignment-options.label-right', 'Right'), value: 'right' },
            ],
          },
          defaultValue: defaultTableFieldOptions.align,
        })
        .addCustomEditor<void, TableCellOptions>({
          id: 'cellOptions',
          path: 'cellOptions',
          name: t('table-new.name-cell-type', 'Cell type'),
          editor: TableCellOptionEditor,
          override: TableCellOptionEditor,
          defaultValue: defaultTableFieldOptions.cellOptions,
          process: identityOverrideProcessor,
          category: cellCategory,
          shouldApply: () => true,
        })
        .addBooleanSwitch({
          path: 'inspect',
          name: t('table-new.name-cell-value-inspect', 'Cell value inspect'),
          description: t('table-new.description-cell-value-inspect', 'Enable cell value inspection in a modal window'),
          defaultValue: false,
          category: cellCategory,
          showIf: (cfg) => {
            return (
              cfg.cellOptions.type === TableCellDisplayMode.Auto ||
              cfg.cellOptions.type === TableCellDisplayMode.JSONView ||
              cfg.cellOptions.type === TableCellDisplayMode.ColorText ||
              cfg.cellOptions.type === TableCellDisplayMode.ColorBackground
            );
          },
        })
        .addBooleanSwitch({
          path: 'filterable',
          name: t('table-new.name-column-filter', 'Column filter'),
          category,
          description: t('table-new.description-column-filter', 'Enables/disables field filters in table'),
          defaultValue: defaultTableFieldOptions.filterable,
        })
        .addBooleanSwitch({
          path: 'wrapHeaderText',
          name: t('table.name-wrap-header-text', 'Wrap header text'),
          description: t('table.description-wrap-header-text', 'Enables text wrapping for column headers'),
          category,
          defaultValue: defaultTableFieldOptions.wrapHeaderText,
        })
        .addBooleanSwitch({
          path: 'hidden',
          name: t('table-new.name-hide-in-table', 'Hide in table'),
          category,
          defaultValue: undefined,
          hideFromDefaults: true,
        })
        // Column-specific styling options
        .addColorPicker({
          path: 'columnStyling.backgroundColor',
          name: t('table-new.name-column-bg-color', 'Background color'),
          category: columnStylingCategory,
          description: t('table-new.description-column-bg-color', 'Set a custom background color for this column'),
          settings: {
            allowUndefined: true,
          },
        })
        .addColorPicker({
          path: 'columnStyling.textColor',
          name: t('table-new.name-column-text-color', 'Text color'),
          category: columnStylingCategory,
          description: t('table-new.description-column-text-color', 'Set a custom text color for this column'),
          settings: {
            allowUndefined: true,
          },
        })
        .addRadio({
          path: 'columnStyling.fontWeight',
          name: t('table-new.name-column-font-weight', 'Font weight'),
          category: columnStylingCategory,
          settings: {
            options: [
              { label: t('table-new.font-weight.normal', 'Normal'), value: 'normal' },
              { label: t('table-new.font-weight.bold', 'Bold'), value: 'bold' },
              { label: t('table-new.font-weight.light', 'Light'), value: 'light' },
            ],
          },
          defaultValue: 'normal',
        })
        .addBooleanSwitch({
          path: 'columnStyling.gradientEnabled',
          name: t('table-new.name-column-gradient', 'Enable gradient'),
          category: columnStylingCategory,
          description: t('table-new.description-column-gradient', 'Apply gradient background to column'),
          defaultValue: false,
        })
        .addColorPicker({
          path: 'columnStyling.gradientStart',
          name: t('table-new.name-gradient-start', 'Gradient start'),
          category: columnStylingCategory,
          settings: {
            allowUndefined: true,
          },
          showIf: (cfg) => cfg.columnStyling?.gradientEnabled === true,
        })
        .addColorPicker({
          path: 'columnStyling.gradientEnd',
          name: t('table-new.name-gradient-end', 'Gradient end'),
          category: columnStylingCategory,
          settings: {
            allowUndefined: true,
          },
          showIf: (cfg) => cfg.columnStyling?.gradientEnabled === true,
        });
    },
  })
  .setPanelOptions((builder) => {
    const footerCategory = [t('table-new.category-table-footer', 'Table footer')];
    const category = [t('table-new.category-table', 'Table')];
    const visibilityCategory = [t('table-new.category-visibility', 'Visibility')];
    const clickToFilterCategory = [t('table-new.category-click-to-filter', 'Click to Filter')];
    const stylingCategory = [t('table-new.category-styling', 'Appearance')];
    const borderCategory = [t('table-new.category-borders', 'Borders')];
    const colorsCategory = [t('table-new.category-colors', 'Colors')];
    const advancedCategory = [t('table-new.category-advanced', 'Advanced')];
    
    builder
      // ===== CLICK TO FILTER OPTIONS =====
      .addBooleanSwitch({
        path: 'clickToFilter.enabled',
        name: t('table-new.name-click-filter-enabled', 'Enable click to filter'),
        category: clickToFilterCategory,
        description: t('table-new.description-click-filter-enabled', 'Click a row to search its value in a text filter variable'),
        defaultValue: defaultClickToFilter.enabled,
      })
      .addSelect({
        path: 'clickToFilter.sourceField',
        name: t('table-new.name-click-filter-source', 'Source field'),
        category: clickToFilterCategory,
        description: t('table-new.description-click-filter-source', 'The column to use as the filter value (includes hidden fields). You can also type a field name directly.'),
        settings: {
          allowCustomValue: true,
          options: [],
          getOptions: async (context: FieldOverrideContext) => {
            const options = [{ value: '', label: t('table-new.source-field-first', '(First column)') }];
            if (context && context.data && context.data.length > 0) {
              const frame = context.data[0];
              
              // Get all fields including hidden ones
              // Check both visible and potentially hidden fields
              const allFieldNames = new Set<string>();
              
              // Add all fields from the current frame
              for (const field of frame.fields) {
                allFieldNames.add(field.name);
                const name = getFieldDisplayName(field, frame, context.data);
                // Check if field is hidden via custom config
                const isHidden = field.config?.custom?.hidden === true;
                const label = isHidden ? `${name} (hidden)` : name;
                options.push({ 
                  value: field.name, 
                  label: label
                });
              }
              
              // Also check if there are any fields in field overrides that might be hidden
              // but not present in the current frame (e.g., due to transformations)
              if (context.options && (context.options as any).overrides) {
                const overrides = (context.options as any).overrides;
                for (const override of overrides) {
                  // Check if this override hides a field
                  const hasHiddenProperty = override.properties?.some(
                    (prop: any) => prop.id === 'custom.hidden' && prop.value === true
                  );
                  
                  if (hasHiddenProperty && override.matcher?.options) {
                    const fieldName = override.matcher.options;
                    // Only add if not already in the list
                    if (!allFieldNames.has(fieldName)) {
                      options.push({
                        value: fieldName,
                        label: `${fieldName} (hidden - from overrides)`
                      });
                    }
                  }
                }
              }
            }
            return options;
          },
        },
        showIf: (cfg) => cfg.clickToFilter?.enabled === true,
      })
      .addTextInput({
        path: 'clickToFilter.targetVariable',
        name: t('table-new.name-click-filter-target', 'Target variable'),
        category: clickToFilterCategory,
        description: t('table-new.description-click-filter-target', 'Dashboard variable name to update (without $)'),
        settings: {
          placeholder: 'e.g., searchFilter',
        },
        showIf: (cfg) => cfg.clickToFilter?.enabled === true,
      })
      .addBooleanSwitch({
        path: 'clickToFilter.toggleMode',
        name: t('table-new.name-click-filter-toggle', 'Toggle mode'),
        category: clickToFilterCategory,
        description: t('table-new.description-click-filter-toggle', 'Click same value again to clear the filter'),
        defaultValue: defaultClickToFilter.toggleMode,
        showIf: (cfg) => cfg.clickToFilter?.enabled === true,
      })
      .addBooleanSwitch({
        path: 'clickToFilter.showClickableIndicator',
        name: t('table-new.name-click-filter-indicator', 'Show clickable indicator'),
        category: clickToFilterCategory,
        description: t('table-new.description-click-filter-indicator', 'Change cursor to pointer on hover to indicate clickable rows'),
        defaultValue: defaultClickToFilter.showClickableIndicator,
        showIf: (cfg) => cfg.clickToFilter?.enabled === true,
      })
      .addSelect({
        path: 'clickToFilter.cursorStyle',
        name: t('table-new.name-click-filter-cursor', 'Cursor style'),
        category: clickToFilterCategory,
        description: t('table-new.description-click-filter-cursor', 'Cursor style when hovering over rows'),
        defaultValue: defaultClickToFilter.cursorStyle,
        settings: {
          options: [
            { value: 'pointer', label: t('table-new.cursor-pointer', 'Pointer') },
            { value: 'crosshair', label: t('table-new.cursor-crosshair', 'Crosshair') },
            { value: 'default', label: t('table-new.cursor-default', 'Default') },
          ],
        },
        showIf: (cfg) => cfg.clickToFilter?.enabled === true && cfg.clickToFilter?.showClickableIndicator === true,
      })
      
      // ===== VISIBILITY OPTIONS =====
      .addBooleanSwitch({
        path: 'visibility.enabled',
        name: t('table-new.name-visibility-enabled', 'Panel visible'),
        category: visibilityCategory,
        description: t('table-new.description-visibility-enabled', 'Toggle panel visibility on/off'),
        defaultValue: defaultVisibility.enabled,
      })
      .addSelect({
        path: 'visibility.condition',
        name: t('table-new.name-visibility-condition', 'Visibility condition'),
        category: visibilityCategory,
        description: t('table-new.description-visibility-condition', 'Condition to determine when panel should be visible'),
        defaultValue: defaultVisibility.condition,
        settings: {
          options: [
            { value: VisibilityCondition.Always, label: t('table-new.visibility-always', 'Always visible'), description: 'Panel is always shown' },
            { value: VisibilityCondition.HasData, label: t('table-new.visibility-has-data', 'When has data'), description: 'Show only when table has data' },
            { value: VisibilityCondition.VariableEquals, label: t('table-new.visibility-var-equals', 'Variable equals'), description: 'Show when variable equals value' },
            { value: VisibilityCondition.VariableNotEquals, label: t('table-new.visibility-var-not-equals', 'Variable not equals'), description: 'Show when variable does not equal value' },
            { value: VisibilityCondition.VariableContains, label: t('table-new.visibility-var-contains', 'Variable contains'), description: 'Show when variable contains value' },
            { value: VisibilityCondition.Never, label: t('table-new.visibility-never', 'Never (hidden)'), description: 'Panel is always hidden' },
          ],
        },
        showIf: (cfg) => cfg.visibility?.enabled !== false,
      })
      .addTextInput({
        path: 'visibility.variableName',
        name: t('table-new.name-visibility-variable', 'Variable name'),
        category: visibilityCategory,
        description: t('table-new.description-visibility-variable', 'Name of the dashboard variable to check (without $)'),
        settings: {
          placeholder: 'myVariable',
        },
        showIf: (cfg) => cfg.visibility?.enabled !== false && 
          (cfg.visibility?.condition === VisibilityCondition.VariableEquals || 
           cfg.visibility?.condition === VisibilityCondition.VariableNotEquals || 
           cfg.visibility?.condition === VisibilityCondition.VariableContains),
      })
      .addTextInput({
        path: 'visibility.variableValue',
        name: t('table-new.name-visibility-value', 'Variable value'),
        category: visibilityCategory,
        description: t('table-new.description-visibility-value', 'Value to compare against the variable'),
        settings: {
          placeholder: 'expectedValue',
        },
        showIf: (cfg) => cfg.visibility?.enabled !== false && 
          (cfg.visibility?.condition === VisibilityCondition.VariableEquals || 
           cfg.visibility?.condition === VisibilityCondition.VariableNotEquals || 
           cfg.visibility?.condition === VisibilityCondition.VariableContains),
      })
      .addBooleanSwitch({
        path: 'visibility.hideOnNoData',
        name: t('table-new.name-hide-no-data', 'Hide when no data'),
        category: visibilityCategory,
        description: t('table-new.description-hide-no-data', 'Completely hide the panel when there is no data (overrides other conditions)'),
        defaultValue: defaultVisibility.hideOnNoData,
        showIf: (cfg) => cfg.visibility?.enabled !== false,
      })
      .addTextInput({
        path: 'visibility.noDataMessage',
        name: t('table-new.name-no-data-message', 'No data message'),
        category: visibilityCategory,
        description: t('table-new.description-no-data-message', 'Message to show when panel is hidden due to no data (if not completely hidden)'),
        settings: {
          placeholder: 'No data available',
        },
        defaultValue: defaultVisibility.noDataMessage,
        showIf: (cfg) => cfg.visibility?.enabled !== false && cfg.visibility?.hideOnNoData !== true,
      })
      
      // ===== TABLE OPTIONS =====
      .addBooleanSwitch({
        path: 'showHeader',
        name: t('table-new.name-show-table-header', 'Show table header'),
        category,
        defaultValue: defaultOptions.showHeader,
      })
      .addRadio({
        path: 'cellHeight',
        name: t('table-new.name-cell-height', 'Cell height'),
        category,
        defaultValue: defaultOptions.cellHeight,
        settings: {
          options: [
            { value: TableCellHeight.Sm, label: t('table-new.cell-height-options.label-small', 'Small') },
            { value: TableCellHeight.Md, label: t('table-new.cell-height-options.label-medium', 'Medium') },
            { value: TableCellHeight.Lg, label: t('table-new.cell-height-options.label-large', 'Large') },
          ],
        },
      })
      
      // ===== DESIGN PRESET =====
      .addSelect({
        path: 'styling.designPreset',
        name: t('table-new.name-design-preset', 'Design preset'),
        category: stylingCategory,
        description: t('table-new.description-design-preset', 'Choose an industry-grade design template'),
        defaultValue: defaultStyling.designPreset,
        settings: {
          options: [
            { value: TableDesignPreset.Default, label: t('table-new.preset-default', 'Default'), description: 'Standard table appearance' },
            { value: TableDesignPreset.Minimal, label: t('table-new.preset-minimal', 'Minimal'), description: 'Clean, minimal design' },
            { value: TableDesignPreset.Modern, label: t('table-new.preset-modern', 'Modern'), description: 'Contemporary sleek design' },
            { value: TableDesignPreset.Striped, label: t('table-new.preset-striped', 'Striped'), description: 'Alternating row colors' },
            { value: TableDesignPreset.Bordered, label: t('table-new.preset-bordered', 'Bordered'), description: 'Full border grid' },
            { value: TableDesignPreset.Elegant, label: t('table-new.preset-elegant', 'Elegant'), description: 'Sophisticated styling' },
            { value: TableDesignPreset.Compact, label: t('table-new.preset-compact', 'Compact'), description: 'Dense data display' },
            { value: TableDesignPreset.HighContrast, label: t('table-new.preset-high-contrast', 'High Contrast'), description: 'Maximum readability' },
            { value: TableDesignPreset.Glassmorphism, label: t('table-new.preset-glassmorphism', 'Glassmorphism'), description: 'Frosted glass effect' },
            { value: TableDesignPreset.Neon, label: t('table-new.preset-neon', 'Neon'), description: 'Vibrant cyberpunk style' },
            { value: TableDesignPreset.Executive, label: t('table-new.preset-executive', 'Executive'), description: 'Professional business style' },
            { value: TableDesignPreset.Dashboard, label: t('table-new.preset-dashboard', 'Dashboard'), description: 'Optimized for dashboards' },
          ],
        },
      })
      
      // ===== HEADER STYLING =====
      .addSelect({
        path: 'styling.headerStyle',
        name: t('table-new.name-header-style', 'Header style'),
        category: stylingCategory,
        description: t('table-new.description-header-style', 'Style for table header'),
        defaultValue: defaultStyling.headerStyle,
        settings: {
          options: [
            { value: HeaderStyle.Default, label: t('table-new.header-default', 'Default') },
            { value: HeaderStyle.Bold, label: t('table-new.header-bold', 'Bold') },
            { value: HeaderStyle.Accent, label: t('table-new.header-accent', 'Accent') },
            { value: HeaderStyle.Gradient, label: t('table-new.header-gradient', 'Gradient') },
            { value: HeaderStyle.Minimal, label: t('table-new.header-minimal', 'Minimal') },
            { value: HeaderStyle.Glass, label: t('table-new.header-glass', 'Glass') },
          ],
        },
      })
      .addSliderInput({
        path: 'styling.headerFontSize',
        name: t('table-new.name-header-font-size', 'Header font size'),
        category: stylingCategory,
        description: t('table-new.description-header-font-size', 'Custom font size for table headers (px)'),
        settings: {
          min: 10,
          max: 24,
          step: 1,
        },
      })
      .addSelect({
        path: 'styling.headerFontWeight',
        name: t('table-new.name-header-font-weight', 'Header font weight'),
        category: stylingCategory,
        description: t('table-new.description-header-font-weight', 'Font weight for table headers'),
        settings: {
          options: [
            { value: 'normal', label: t('table-new.header-weight-normal', 'Normal (400)') },
            { value: '300', label: t('table-new.header-weight-light', 'Light (300)') },
            { value: '500', label: t('table-new.header-weight-medium', 'Medium (500)') },
            { value: '600', label: t('table-new.header-weight-semibold', 'Semi-Bold (600)') },
            { value: 'bold', label: t('table-new.header-weight-bold', 'Bold (700)') },
            { value: '800', label: t('table-new.header-weight-extrabold', 'Extra-Bold (800)') },
            { value: '900', label: t('table-new.header-weight-black', 'Black (900)') },
          ],
        },
      })
      
      // ===== ROW STRIPING =====
      .addSelect({
        path: 'styling.rowStriping',
        name: t('table-new.name-row-striping', 'Row striping'),
        category: stylingCategory,
        description: t('table-new.description-row-striping', 'Alternating row background pattern'),
        defaultValue: defaultStyling.rowStriping,
        settings: {
          options: [
            { value: RowStripingStyle.None, label: t('table-new.striping-none', 'None') },
            { value: RowStripingStyle.Odd, label: t('table-new.striping-odd', 'Odd rows') },
            { value: RowStripingStyle.Even, label: t('table-new.striping-even', 'Even rows') },
            { value: RowStripingStyle.Gradient, label: t('table-new.striping-gradient', 'Gradient') },
          ],
        },
      })
      
      // ===== CELL PADDING =====
      .addRadio({
        path: 'styling.cellPadding',
        name: t('table-new.name-cell-padding', 'Cell padding'),
        category: stylingCategory,
        defaultValue: defaultStyling.cellPadding,
        settings: {
          options: [
            { value: 'compact', label: t('table-new.padding-compact', 'Compact') },
            { value: 'normal', label: t('table-new.padding-normal', 'Normal') },
            { value: 'spacious', label: t('table-new.padding-spacious', 'Spacious') },
          ],
        },
      })
      
      // ===== BORDER OPTIONS =====
      .addSelect({
        path: 'styling.borderStyle',
        name: t('table-new.name-border-style', 'Border style'),
        category: borderCategory,
        description: t('table-new.description-border-style', 'Control table border visibility'),
        defaultValue: defaultStyling.borderStyle,
        settings: {
          options: [
            { value: TableBorderStyle.None, label: t('table-new.border-none', 'No borders') },
            { value: TableBorderStyle.Horizontal, label: t('table-new.border-horizontal', 'Horizontal only') },
            { value: TableBorderStyle.Vertical, label: t('table-new.border-vertical', 'Vertical only') },
            { value: TableBorderStyle.All, label: t('table-new.border-all', 'All borders') },
            { value: TableBorderStyle.Outer, label: t('table-new.border-outer', 'Outer only') },
          ],
        },
      })
      .addSliderInput({
        path: 'styling.borderRadius',
        name: t('table-new.name-border-radius', 'Border radius'),
        category: borderCategory,
        description: t('table-new.description-border-radius', 'Rounded corners (px)'),
        defaultValue: defaultStyling.borderRadius,
        settings: {
          min: 0,
          max: 24,
          step: 1,
        },
      })
      .addSliderInput({
        path: 'styling.borderWidth',
        name: t('table-new.name-border-width', 'Border width'),
        category: borderCategory,
        description: t('table-new.description-border-width', 'Border thickness (px)'),
        defaultValue: defaultStyling.borderWidth,
        settings: {
          min: 0,
          max: 4,
          step: 1,
        },
      })
      .addColorPicker({
        path: 'styling.borderColor',
        name: t('table-new.name-border-color', 'Border color'),
        category: borderCategory,
        description: t('table-new.description-border-color', 'Custom border color'),
        settings: {
          allowUndefined: true,
        },
      })
      
      // ===== COLOR OPTIONS =====
      .addColorPicker({
        path: 'styling.headerBgColor',
        name: t('table-new.name-header-bg-color', 'Header background'),
        category: colorsCategory,
        description: t('table-new.description-header-bg-color', 'Custom header background color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.headerTextColor',
        name: t('table-new.name-header-text-color', 'Header text'),
        category: colorsCategory,
        description: t('table-new.description-header-text-color', 'Custom header text color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.cellBgColor',
        name: t('table-new.name-cell-bg-color', 'Cell background'),
        category: colorsCategory,
        description: t('table-new.description-cell-bg-color', 'Custom cell background color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.cellTextColor',
        name: t('table-new.name-cell-text-color', 'Cell text'),
        category: colorsCategory,
        description: t('table-new.description-cell-text-color', 'Custom cell text color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.hoverColor',
        name: t('table-new.name-hover-color', 'Hover color'),
        category: colorsCategory,
        description: t('table-new.description-hover-color', 'Row hover highlight color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.stripeColor',
        name: t('table-new.name-stripe-color', 'Stripe color'),
        category: colorsCategory,
        description: t('table-new.description-stripe-color', 'Alternating row color'),
        settings: {
          allowUndefined: true,
        },
        showIf: (cfg) => cfg.styling?.rowStriping !== RowStripingStyle.None,
      })
      .addColorPicker({
        path: 'styling.rowDividerColor',
        name: t('table-new.name-row-divider-color', 'Row divider'),
        category: colorsCategory,
        description: t('table-new.description-row-divider-color', 'Color between rows'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.columnDividerColor',
        name: t('table-new.name-column-divider-color', 'Column divider'),
        category: colorsCategory,
        description: t('table-new.description-column-divider-color', 'Color between columns'),
        settings: {
          allowUndefined: true,
        },
      })
      
      // ===== EFFECTS & ANIMATIONS =====
      .addBooleanSwitch({
        path: 'styling.enableHoverEffect',
        name: t('table-new.name-enable-hover', 'Enable hover effect'),
        category: advancedCategory,
        description: t('table-new.description-enable-hover', 'Highlight rows on mouse hover'),
        defaultValue: defaultStyling.enableHoverEffect,
      })
      .addBooleanSwitch({
        path: 'styling.enableRowHighlight',
        name: t('table-new.name-enable-row-highlight', 'Row highlight'),
        category: advancedCategory,
        description: t('table-new.description-enable-row-highlight', 'Highlight entire row on hover'),
        defaultValue: defaultStyling.enableRowHighlight,
      })
      .addBooleanSwitch({
        path: 'styling.enableColumnHighlight',
        name: t('table-new.name-enable-column-highlight', 'Column highlight'),
        category: advancedCategory,
        description: t('table-new.description-enable-column-highlight', 'Highlight entire column on hover'),
        defaultValue: defaultStyling.enableColumnHighlight,
      })
      .addBooleanSwitch({
        path: 'styling.enableShadow',
        name: t('table-new.name-enable-shadow', 'Enable shadow'),
        category: advancedCategory,
        description: t('table-new.description-enable-shadow', 'Add drop shadow to table'),
        defaultValue: defaultStyling.enableShadow,
      })
      .addSliderInput({
        path: 'styling.shadowIntensity',
        name: t('table-new.name-shadow-intensity', 'Shadow intensity'),
        category: advancedCategory,
        description: t('table-new.description-shadow-intensity', 'Shadow depth (0-1)'),
        defaultValue: defaultStyling.shadowIntensity,
        settings: {
          min: 0,
          max: 1,
          step: 0.05,
        },
        showIf: (cfg) => cfg.styling?.enableShadow === true,
      })
      .addBooleanSwitch({
        path: 'styling.enableAnimations',
        name: t('table-new.name-enable-animations', 'Enable animations'),
        category: advancedCategory,
        description: t('table-new.description-enable-animations', 'Smooth transitions and hover effects'),
        defaultValue: defaultStyling.enableAnimations,
      })
      .addSliderInput({
        path: 'styling.fontSizeScale',
        name: t('table-new.name-font-scale', 'Font size scale'),
        category: advancedCategory,
        description: t('table-new.description-font-scale', 'Scale table font size (0.7-1.5)'),
        defaultValue: defaultStyling.fontSizeScale,
        settings: {
          min: 0.7,
          max: 1.5,
          step: 0.05,
        },
      })
      
      // ===== FOOTER OPTIONS =====
      .addBooleanSwitch({
        path: 'footer.show',
        category: footerCategory,
        name: t('table-new.name-show-table-footer', 'Show table footer'),
        defaultValue: defaultOptions.footer?.show,
      })
      .addCustomEditor({
        id: 'footer.reducer',
        category: footerCategory,
        path: 'footer.reducer',
        name: t('table-new.name-calculation', 'Calculation'),
        description: t('table-new.description-calculation', 'Choose a reducer function / calculation'),
        editor: standardEditorsRegistry.get('stats-picker').editor,
        defaultValue: [ReducerID.sum],
        showIf: (cfg) => cfg.footer?.show,
      })
      .addBooleanSwitch({
        path: 'footer.countRows',
        category: footerCategory,
        name: t('table-new.name-count-rows', 'Count rows'),
        description: t('table-new.description-count-rows', 'Display a single count for all data rows'),
        defaultValue: defaultOptions.footer?.countRows,
        showIf: (cfg) => cfg.footer?.reducer?.length === 1 && cfg.footer?.reducer[0] === ReducerID.count,
      })
      .addMultiSelect({
        path: 'footer.fields',
        category: footerCategory,
        name: t('table-new.name-fields', 'Fields'),
        description: t('table-new.description-fields', 'Select the fields that should be calculated'),
        settings: {
          allowCustomValue: false,
          options: [],
          placeholder: t('table-new.placeholder-fields', 'All Numeric Fields'),
          getOptions: async (context: FieldOverrideContext) => {
            const options = [];
            if (context && context.data && context.data.length > 0) {
              const frame = context.data[0];
              for (const field of frame.fields) {
                if (field.type === FieldType.number) {
                  const name = getFieldDisplayName(field, frame, context.data);
                  const value = field.name;
                  options.push({ value, label: name });
                }
              }
            }
            return options;
          },
        },
        defaultValue: '',
        showIf: (cfg) => cfg.footer?.show && !(cfg.footer?.countRows && cfg.footer?.reducer.includes(ReducerID.count)),
      })
      .addCustomEditor({
        id: 'footer.enablePagination',
        path: 'footer.enablePagination',
        name: t('table-new.name-enable-pagination', 'Enable pagination'),
        category,
        editor: PaginationEditor,
      });
  })
  .setSuggestionsSupplier(new TableSuggestionsSupplier());
