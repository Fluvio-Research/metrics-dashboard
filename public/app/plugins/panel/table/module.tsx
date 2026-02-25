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
      const category = [t('table.category-table', 'Table')];
      const cellCategory = [t('table.category-cell-options', 'Cell options')];
      builder
        .addNumberInput({
          path: 'minWidth',
          name: t('table.name-min-column-width', 'Minimum column width'),
          category,
          description: t('table.description-min-column-width', 'The minimum width for column auto resizing'),
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
          name: t('table.name-column-width', 'Column width'),
          category,
          settings: {
            placeholder: t('table.placeholder-column-width', 'auto'),
            min: 20,
          },
          shouldApply: () => true,
          defaultValue: defaultTableFieldOptions.width,
        })
        .addRadio({
          path: 'align',
          name: t('table.name-column-alignment', 'Column alignment'),
          category,
          settings: {
            options: [
              { label: t('table.column-alignment-options.label-auto', 'Auto'), value: 'auto' },
              { label: t('table.column-alignment-options.label-left', 'Left'), value: 'left' },
              { label: t('table.column-alignment-options.label-center', 'Center'), value: 'center' },
              { label: t('table.column-alignment-options.label-right', 'Right'), value: 'right' },
            ],
          },
          defaultValue: defaultTableFieldOptions.align,
        })
        .addCustomEditor<void, TableCellOptions>({
          id: 'cellOptions',
          path: 'cellOptions',
          name: t('table.name-cell-type', 'Cell type'),
          editor: TableCellOptionEditor,
          override: TableCellOptionEditor,
          defaultValue: defaultTableFieldOptions.cellOptions,
          process: identityOverrideProcessor,
          category: cellCategory,
          shouldApply: () => true,
        })
        .addBooleanSwitch({
          path: 'inspect',
          name: t('table.name-cell-value-inspect', 'Cell value inspect'),
          description: t('table.description-cell-value-inspect', 'Enable cell value inspection in a modal window'),
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
          name: t('table.name-column-filter', 'Column filter'),
          category,
          description: t('table.description-column-filter', 'Enables/disables field filters in table'),
          defaultValue: defaultTableFieldOptions.filterable,
        })
        .addBooleanSwitch({
          path: 'hidden',
          name: t('table.name-hide-in-table', 'Hide in table'),
          category,
          defaultValue: undefined,
          hideFromDefaults: true,
        })
        // Column-specific styling options
        .addColorPicker({
          path: 'columnStyling.backgroundColor',
          name: t('table.name-column-bg-color', 'Background color'),
          category: [t('table.category-column-styling', 'Column styling')],
          description: t('table.description-column-bg-color', 'Set a custom background color for this column'),
          settings: {
            allowUndefined: true,
          },
        })
        .addColorPicker({
          path: 'columnStyling.textColor',
          name: t('table.name-column-text-color', 'Text color'),
          category: [t('table.category-column-styling', 'Column styling')],
          description: t('table.description-column-text-color', 'Set a custom text color for this column'),
          settings: {
            allowUndefined: true,
          },
        })
        .addRadio({
          path: 'columnStyling.fontWeight',
          name: t('table.name-column-font-weight', 'Font weight'),
          category: [t('table.category-column-styling', 'Column styling')],
          settings: {
            options: [
              { label: t('table.font-weight.normal', 'Normal'), value: 'normal' },
              { label: t('table.font-weight.bold', 'Bold'), value: 'bold' },
              { label: t('table.font-weight.light', 'Light'), value: 'light' },
            ],
          },
          defaultValue: 'normal',
        })
        .addBooleanSwitch({
          path: 'columnStyling.gradientEnabled',
          name: t('table.name-column-gradient', 'Enable gradient'),
          category: [t('table.category-column-styling', 'Column styling')],
          description: t('table.description-column-gradient', 'Apply gradient background to column'),
          defaultValue: false,
        })
        .addColorPicker({
          path: 'columnStyling.gradientStart',
          name: t('table.name-gradient-start', 'Gradient start'),
          category: [t('table.category-column-styling', 'Column styling')],
          settings: {
            allowUndefined: true,
          },
          showIf: (cfg) => cfg.columnStyling?.gradientEnabled === true,
        })
        .addColorPicker({
          path: 'columnStyling.gradientEnd',
          name: t('table.name-gradient-end', 'Gradient end'),
          category: [t('table.category-column-styling', 'Column styling')],
          settings: {
            allowUndefined: true,
          },
          showIf: (cfg) => cfg.columnStyling?.gradientEnabled === true,
        });
    },
  })
  .setPanelOptions((builder) => {
    const category = [t('table.category-table', 'Table')];
    const footerCategory = [t('table.category-table-footer', 'Table footer')];
    const stylingCategory = [t('table.category-styling', 'Appearance')];
    const borderCategory = [t('table.category-borders', 'Borders')];
    const colorsCategory = [t('table.category-colors', 'Colors')];
    const advancedCategory = [t('table.category-advanced', 'Advanced')];
    
    builder
      // ===== TABLE OPTIONS =====
      .addBooleanSwitch({
        path: 'showHeader',
        name: t('table.name-show-table-header', 'Show table header'),
        category,
        defaultValue: defaultOptions.showHeader,
      })
      .addRadio({
        path: 'cellHeight',
        name: t('table.name-cell-height', 'Cell height'),
        category,
        defaultValue: defaultOptions.cellHeight,
        settings: {
          options: [
            { value: TableCellHeight.Sm, label: t('table.cell-height-options.label-small', 'Small') },
            { value: TableCellHeight.Md, label: t('table.cell-height-options.label-medium', 'Medium') },
            { value: TableCellHeight.Lg, label: t('table.cell-height-options.label-large', 'Large') },
          ],
        },
      })
      
      // ===== DESIGN PRESET =====
      .addSelect({
        path: 'styling.designPreset',
        name: t('table.name-design-preset', 'Design preset'),
        category: stylingCategory,
        description: t('table.description-design-preset', 'Choose an industry-grade design template'),
        defaultValue: defaultStyling.designPreset,
        settings: {
          options: [
            { value: TableDesignPreset.Default, label: t('table.preset-default', 'Default'), description: 'Standard table appearance' },
            { value: TableDesignPreset.Minimal, label: t('table.preset-minimal', 'Minimal'), description: 'Clean, minimal design' },
            { value: TableDesignPreset.Modern, label: t('table.preset-modern', 'Modern'), description: 'Contemporary sleek design' },
            { value: TableDesignPreset.Striped, label: t('table.preset-striped', 'Striped'), description: 'Alternating row colors' },
            { value: TableDesignPreset.Bordered, label: t('table.preset-bordered', 'Bordered'), description: 'Full border grid' },
            { value: TableDesignPreset.Elegant, label: t('table.preset-elegant', 'Elegant'), description: 'Sophisticated styling' },
            { value: TableDesignPreset.Compact, label: t('table.preset-compact', 'Compact'), description: 'Dense data display' },
            { value: TableDesignPreset.HighContrast, label: t('table.preset-high-contrast', 'High Contrast'), description: 'Maximum readability' },
            { value: TableDesignPreset.Glassmorphism, label: t('table.preset-glassmorphism', 'Glassmorphism'), description: 'Frosted glass effect' },
            { value: TableDesignPreset.Neon, label: t('table.preset-neon', 'Neon'), description: 'Vibrant cyberpunk style' },
            { value: TableDesignPreset.Executive, label: t('table.preset-executive', 'Executive'), description: 'Professional business style' },
            { value: TableDesignPreset.Dashboard, label: t('table.preset-dashboard', 'Dashboard'), description: 'Optimized for dashboards' },
          ],
        },
      })
      
      // ===== HEADER STYLING =====
      .addSelect({
        path: 'styling.headerStyle',
        name: t('table.name-header-style', 'Header style'),
        category: stylingCategory,
        description: t('table.description-header-style', 'Style for table header'),
        defaultValue: defaultStyling.headerStyle,
        settings: {
          options: [
            { value: HeaderStyle.Default, label: t('table.header-default', 'Default') },
            { value: HeaderStyle.Bold, label: t('table.header-bold', 'Bold') },
            { value: HeaderStyle.Accent, label: t('table.header-accent', 'Accent') },
            { value: HeaderStyle.Gradient, label: t('table.header-gradient', 'Gradient') },
            { value: HeaderStyle.Minimal, label: t('table.header-minimal', 'Minimal') },
            { value: HeaderStyle.Glass, label: t('table.header-glass', 'Glass') },
          ],
        },
      })
      
      // ===== ROW STRIPING =====
      .addSelect({
        path: 'styling.rowStriping',
        name: t('table.name-row-striping', 'Row striping'),
        category: stylingCategory,
        description: t('table.description-row-striping', 'Alternating row background pattern'),
        defaultValue: defaultStyling.rowStriping,
        settings: {
          options: [
            { value: RowStripingStyle.None, label: t('table.striping-none', 'None') },
            { value: RowStripingStyle.Odd, label: t('table.striping-odd', 'Odd rows') },
            { value: RowStripingStyle.Even, label: t('table.striping-even', 'Even rows') },
            { value: RowStripingStyle.Gradient, label: t('table.striping-gradient', 'Gradient') },
          ],
        },
      })
      
      // ===== CELL PADDING =====
      .addRadio({
        path: 'styling.cellPadding',
        name: t('table.name-cell-padding', 'Cell padding'),
        category: stylingCategory,
        defaultValue: defaultStyling.cellPadding,
        settings: {
          options: [
            { value: 'compact', label: t('table.padding-compact', 'Compact') },
            { value: 'normal', label: t('table.padding-normal', 'Normal') },
            { value: 'spacious', label: t('table.padding-spacious', 'Spacious') },
          ],
        },
      })
      
      // ===== BORDER OPTIONS =====
      .addSelect({
        path: 'styling.borderStyle',
        name: t('table.name-border-style', 'Border style'),
        category: borderCategory,
        description: t('table.description-border-style', 'Control table border visibility'),
        defaultValue: defaultStyling.borderStyle,
        settings: {
          options: [
            { value: TableBorderStyle.None, label: t('table.border-none', 'No borders') },
            { value: TableBorderStyle.Horizontal, label: t('table.border-horizontal', 'Horizontal only') },
            { value: TableBorderStyle.Vertical, label: t('table.border-vertical', 'Vertical only') },
            { value: TableBorderStyle.All, label: t('table.border-all', 'All borders') },
            { value: TableBorderStyle.Outer, label: t('table.border-outer', 'Outer only') },
          ],
        },
      })
      .addSliderInput({
        path: 'styling.borderRadius',
        name: t('table.name-border-radius', 'Border radius'),
        category: borderCategory,
        description: t('table.description-border-radius', 'Rounded corners (px)'),
        defaultValue: defaultStyling.borderRadius,
        settings: {
          min: 0,
          max: 24,
          step: 1,
        },
      })
      .addSliderInput({
        path: 'styling.borderWidth',
        name: t('table.name-border-width', 'Border width'),
        category: borderCategory,
        description: t('table.description-border-width', 'Border thickness (px)'),
        defaultValue: defaultStyling.borderWidth,
        settings: {
          min: 0,
          max: 4,
          step: 1,
        },
      })
      .addColorPicker({
        path: 'styling.borderColor',
        name: t('table.name-border-color', 'Border color'),
        category: borderCategory,
        description: t('table.description-border-color', 'Custom border color'),
        settings: {
          allowUndefined: true,
        },
      })
      
      // ===== COLOR OPTIONS =====
      .addColorPicker({
        path: 'styling.headerBgColor',
        name: t('table.name-header-bg-color', 'Header background'),
        category: colorsCategory,
        description: t('table.description-header-bg-color', 'Custom header background color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.headerTextColor',
        name: t('table.name-header-text-color', 'Header text'),
        category: colorsCategory,
        description: t('table.description-header-text-color', 'Custom header text color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.cellBgColor',
        name: t('table.name-cell-bg-color', 'Cell background'),
        category: colorsCategory,
        description: t('table.description-cell-bg-color', 'Custom cell background color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.cellTextColor',
        name: t('table.name-cell-text-color', 'Cell text'),
        category: colorsCategory,
        description: t('table.description-cell-text-color', 'Custom cell text color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.hoverColor',
        name: t('table.name-hover-color', 'Hover color'),
        category: colorsCategory,
        description: t('table.description-hover-color', 'Row hover highlight color'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.stripeColor',
        name: t('table.name-stripe-color', 'Stripe color'),
        category: colorsCategory,
        description: t('table.description-stripe-color', 'Alternating row color'),
        settings: {
          allowUndefined: true,
        },
        showIf: (cfg) => cfg.styling?.rowStriping !== RowStripingStyle.None,
      })
      .addColorPicker({
        path: 'styling.rowDividerColor',
        name: t('table.name-row-divider-color', 'Row divider'),
        category: colorsCategory,
        description: t('table.description-row-divider-color', 'Color between rows'),
        settings: {
          allowUndefined: true,
        },
      })
      .addColorPicker({
        path: 'styling.columnDividerColor',
        name: t('table.name-column-divider-color', 'Column divider'),
        category: colorsCategory,
        description: t('table.description-column-divider-color', 'Color between columns'),
        settings: {
          allowUndefined: true,
        },
      })
      
      // ===== EFFECTS & ANIMATIONS =====
      .addBooleanSwitch({
        path: 'styling.enableHoverEffect',
        name: t('table.name-enable-hover', 'Enable hover effect'),
        category: advancedCategory,
        description: t('table.description-enable-hover', 'Highlight rows on mouse hover'),
        defaultValue: defaultStyling.enableHoverEffect,
      })
      .addBooleanSwitch({
        path: 'styling.enableRowHighlight',
        name: t('table.name-enable-row-highlight', 'Row highlight'),
        category: advancedCategory,
        description: t('table.description-enable-row-highlight', 'Highlight entire row on hover'),
        defaultValue: defaultStyling.enableRowHighlight,
      })
      .addBooleanSwitch({
        path: 'styling.enableColumnHighlight',
        name: t('table.name-enable-column-highlight', 'Column highlight'),
        category: advancedCategory,
        description: t('table.description-enable-column-highlight', 'Highlight entire column on hover'),
        defaultValue: defaultStyling.enableColumnHighlight,
      })
      .addBooleanSwitch({
        path: 'styling.enableShadow',
        name: t('table.name-enable-shadow', 'Enable shadow'),
        category: advancedCategory,
        description: t('table.description-enable-shadow', 'Add drop shadow to table'),
        defaultValue: defaultStyling.enableShadow,
      })
      .addSliderInput({
        path: 'styling.shadowIntensity',
        name: t('table.name-shadow-intensity', 'Shadow intensity'),
        category: advancedCategory,
        description: t('table.description-shadow-intensity', 'Shadow depth (0-1)'),
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
        name: t('table.name-enable-animations', 'Enable animations'),
        category: advancedCategory,
        description: t('table.description-enable-animations', 'Smooth transitions and hover effects'),
        defaultValue: defaultStyling.enableAnimations,
      })
      .addSliderInput({
        path: 'styling.fontSizeScale',
        name: t('table.name-font-scale', 'Font size scale'),
        category: advancedCategory,
        description: t('table.description-font-scale', 'Scale table font size (0.7-1.5)'),
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
        name: t('table.name-show-table-footer', 'Show table footer'),
        defaultValue: defaultOptions.footer?.show,
      })
      .addCustomEditor({
        id: 'footer.reducer',
        category: footerCategory,
        path: 'footer.reducer',
        name: t('table.name-calculation', 'Calculation'),
        description: t('table.description-calculation', 'Choose a reducer function / calculation'),
        editor: standardEditorsRegistry.get('stats-picker').editor,
        defaultValue: [ReducerID.sum],
        showIf: (cfg) => cfg.footer?.show,
      })
      .addBooleanSwitch({
        path: 'footer.countRows',
        category: footerCategory,
        name: t('table.name-count-rows', 'Count rows'),
        description: t('table.description-count-rows', 'Display a single count for all data rows'),
        defaultValue: defaultOptions.footer?.countRows,
        showIf: (cfg) => cfg.footer?.reducer?.length === 1 && cfg.footer?.reducer[0] === ReducerID.count,
      })
      .addMultiSelect({
        path: 'footer.fields',
        category: footerCategory,
        name: t('table.name-fields', 'Fields'),
        description: t('table.description-fields', 'Select the fields that should be calculated'),
        settings: {
          allowCustomValue: false,
          options: [],
          placeholder: t('table.placeholder-fields', 'All Numeric Fields'),
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
        name: t('table.name-enable-paginations', 'Enable pagination'),
        category,
        editor: PaginationEditor,
      });
  })
  .setSuggestionsSupplier(new TableSuggestionsSupplier());
