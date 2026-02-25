import { css } from '@emotion/css';
import { CSSProperties } from 'react';

import {
  ActionModel,
  DashboardCursorSync,
  DataFrame,
  FieldMatcherID,
  getFrameDisplayName,
  GrafanaTheme2,
  InterpolateFunction,
  PanelProps,
  SelectableValue,
  Field,
} from '@grafana/data';
import { config, PanelDataErrorView } from '@grafana/runtime';
import { Select, Table, usePanelContext, useTheme2 } from '@grafana/ui';
import { TableSortByFieldState } from '@grafana/ui/internal';

import { getActions } from '../../../features/actions/utils';

import { hasDeprecatedParentRowIndex, migrateFromParentRowIndexToNestedFrames } from './migrations';
import {
  Options,
  TableStyling,
  TableDesignPreset,
  TableBorderStyle,
  HeaderStyle,
  RowStripingStyle,
  defaultStyling,
} from './panelcfg.gen';

interface Props extends PanelProps<Options> {}

export function TablePanel(props: Props) {
  const { data, height, width, options, fieldConfig, id, timeRange, replaceVariables } = props;

  const theme = useTheme2();
  const panelContext = usePanelContext();
  const frames = hasDeprecatedParentRowIndex(data.series)
    ? migrateFromParentRowIndexToNestedFrames(data.series)
    : data.series;
  const count = frames?.length;
  const hasFields = frames.some((frame) => frame.fields.length > 0);
  const currentIndex = getCurrentFrameIndex(frames, options);
  const main = frames[currentIndex];

  let tableHeight = height;

  if (!count || !hasFields) {
    return <PanelDataErrorView panelId={id} fieldConfig={fieldConfig} data={data} />;
  }

  if (count > 1) {
    const inputHeight = theme.spacing.gridSize * theme.components.height.md;
    const padding = theme.spacing.gridSize;

    tableHeight = height - inputHeight - padding;
  }

  const enableSharedCrosshair = panelContext.sync && panelContext.sync() !== DashboardCursorSync.Off;

  const tableElement = (
    <Table
      height={tableHeight}
      width={width}
      data={main}
      noHeader={!options.showHeader}
      showTypeIcons={options.showTypeIcons}
      resizable={true}
      initialSortBy={options.sortBy}
      onSortByChange={(sortBy) => onSortByChange(sortBy, props)}
      onColumnResize={(displayName, resizedWidth) => onColumnResize(displayName, resizedWidth, props)}
      onCellFilterAdded={panelContext.onAddAdHocFilter}
      footerOptions={options.footer}
      enablePagination={options.footer?.enablePagination}
      cellHeight={options.cellHeight}
      timeRange={timeRange}
      enableSharedCrosshair={config.featureToggles.tableSharedCrosshair && enableSharedCrosshair}
      fieldConfig={fieldConfig}
      getActions={getCellActions}
      replaceVariables={replaceVariables}
    />
  );

  // Build styling overrides from options.styling (fall back to defaults for panels saved before styling was added)
  const effectiveStyling = options.styling ?? defaultStyling;
  const stylingVars = buildStylingVars(theme, effectiveStyling);
  const stylingClass = buildStylingClass(theme, effectiveStyling);
  const wrapperStyle: CSSProperties = {
    ...stylingVars,
    height: `${height}px`,
    width: `${width}px`,
  };

  if (count === 1) {
    return (
      <div className={stylingClass} style={wrapperStyle}>
        {tableElement}
      </div>
    );
  }

  return (
    <div className={stylingClass} style={wrapperStyle}>
      <div className={tableStyles.wrapper}>
        {tableElement}
        <div className={tableStyles.selectWrapper}>
          <Select
            options={frames.map((frame, index) => ({ label: getFrameDisplayName(frame), value: index }))}
            value={currentIndex}
            onChange={(val) => onChangeTableSelection(val, props)}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styling helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns CSS custom properties to set on the wrapper div.
 * These cascade into the TableRT component and override the hardcoded theme colors.
 * Header bg/text use --gf-table-header-bg / --gf-table-header-text which are
 * read directly by headerCell / headerCellLabel in styles.ts.
 */
function buildStylingVars(theme: GrafanaTheme2, styling?: TableStyling): CSSProperties {
  if (!styling) {
    return {};
  }

  const isDark = theme.isDark;
  const presetDefaults = getPresetDefaults(isDark, styling.designPreset ?? TableDesignPreset.Default);
  const vars: Record<string, string> = {};

  // Header colors — picked up by CSS vars in styles.ts headerCell
  const headerBg = styling.headerBgColor ?? presetDefaults.headerBg;
  const headerText = styling.headerTextColor ?? presetDefaults.headerText;
  if (headerBg) {
    vars['--gf-table-header-bg'] = headerBg;
  }
  if (headerText) {
    vars['--gf-table-header-text'] = headerText;
  }

  // Border / hover colors
  const borderColor = styling.borderColor ?? presetDefaults.borderColor;
  const hoverColor = styling.hoverColor ?? presetDefaults.hoverBg;
  if (borderColor) {
    vars['--gf-table-border-color'] = borderColor;
  }
  if (hoverColor) {
    vars['--gf-table-row-hover-bg'] = hoverColor;
    vars['--gf-table-cell-hover-bg'] = hoverColor;
  }

  return vars as CSSProperties;
}

/**
 * Returns an emotion CSS class string with structural overrides for the table.
 * Applied to the wrapper div that wraps the TableRT component.
 */
function buildStylingClass(theme: GrafanaTheme2, styling?: TableStyling): string {
  if (!styling) {
    return tableStyles.defaultWrapper;
  }

  const isDark = theme.isDark;
  const presetDefaults = getPresetDefaults(isDark, styling.designPreset ?? TableDesignPreset.Default);

  const effectiveCellBg = styling.cellBgColor ?? presetDefaults.cellBg;
  const effectiveCellText = styling.cellTextColor ?? presetDefaults.cellText;
  const effectiveStripeBg = styling.stripeColor ?? presetDefaults.stripeBg;
  const effectiveBorderStyle = presetDefaults.borderStyle ?? TableBorderStyle.All;
  const activeBorderStyle = styling.borderStyle ?? effectiveBorderStyle;
  const activeHeaderStyle = styling.headerStyle ?? presetDefaults.headerStyle ?? HeaderStyle.Default;

  // Cell padding override (px)
  const cellPaddingPx =
    styling.cellPadding === 'compact' ? 3 : styling.cellPadding === 'spacious' ? 12 : undefined;

  // Shadow
  const shadowIntensity = styling.shadowIntensity ?? 0.15;
  const shadow = styling.enableShadow
    ? `0 4px ${Math.round(shadowIntensity * 40) + 4}px rgba(0, 0, 0, ${(0.1 + shadowIntensity * 0.35).toFixed(2)})`
    : undefined;

  const borderRadius = styling.borderRadius ?? 0;
  const fontSizeScale = styling.fontSizeScale ?? 1;

  // ── Header FONT/STYLE + COLOR overrides ──────────────────────────────────
  // Target [role="columnheader"] directly (cells are absolutely positioned).
  // Belt-and-suspenders: set bg/text both via CSS vars (in buildStylingVars /
  // styles.ts) AND directly here with !important so they win even if the CSS
  // var cascade is blocked by specificity or insertion order.
  const headerFontStyle: Record<string, string | number> = {};
  const effectiveHeaderBg = styling.headerBgColor ?? presetDefaults.headerBg;
  const effectiveHeaderText = styling.headerTextColor ?? presetDefaults.headerText;
  const hasExplicitHeaderBg = !!effectiveHeaderBg;

  // Apply bg/text colors directly to the class selector
  if (effectiveHeaderBg) {
    headerFontStyle['backgroundColor'] = `${effectiveHeaderBg} !important`;
  }
  if (effectiveHeaderText) {
    headerFontStyle['color'] = `${effectiveHeaderText} !important`;
  }

  switch (activeHeaderStyle) {
    case HeaderStyle.Bold:
      headerFontStyle['fontWeight'] = '700 !important';
      headerFontStyle['fontSize'] = '1.05em !important';
      break;
    case HeaderStyle.Accent:
      if (!hasExplicitHeaderBg) {
        headerFontStyle['backgroundColor'] = `${theme.colors.primary.main}22 !important`;
      }
      headerFontStyle['borderBottom'] = `2px solid ${theme.colors.primary.main} !important`;
      break;
    case HeaderStyle.Gradient:
      if (!hasExplicitHeaderBg) {
        const c1 = theme.colors.primary.main;
        const c2 = isDark ? theme.colors.primary.shade : theme.colors.primary.border;
        headerFontStyle['background'] = `linear-gradient(135deg, ${c1}33, ${c2}22) !important`;
      }
      break;
    case HeaderStyle.Minimal:
      headerFontStyle['fontWeight'] = '400 !important';
      headerFontStyle['fontSize'] = '0.78em !important';
      headerFontStyle['letterSpacing'] = '0.08em';
      headerFontStyle['textTransform'] = 'uppercase';
      if (!styling.headerTextColor && !presetDefaults.headerText) {
        headerFontStyle['color'] = `${theme.colors.text.secondary} !important`;
      }
      break;
    case HeaderStyle.Glass:
      headerFontStyle['backdropFilter'] = 'blur(6px)';
      if (!hasExplicitHeaderBg) {
        headerFontStyle['backgroundColor'] = isDark
          ? `rgba(255,255,255,0.06) !important`
          : `rgba(0,0,0,0.04) !important`;
      }
      break;
  }

  // ── Border overrides ─────────────────────────────────────────────────────
  const bw = styling.borderWidth ?? 1;
  const bc = styling.borderColor;
  const borderVal = bc ? `${bw}px solid ${bc}` : `${bw}px solid var(--gf-table-border-color)`;

  // row border (data rows only — header row uses headerRow class, not [role="row"])
  const rowBorder: Record<string, string> = {};
  const cellBorderRight: Record<string, string> = {};
  const headerBorderRight: Record<string, string> = {};
  const headerRowBorder: Record<string, string> = {};

  switch (activeBorderStyle) {
    case TableBorderStyle.None:
      rowBorder['borderBottom'] = 'none !important';
      headerRowBorder['borderBottom'] = 'none !important';
      cellBorderRight['borderRight'] = 'none !important';
      headerBorderRight['borderRight'] = 'none !important';
      break;
    case TableBorderStyle.Horizontal:
      cellBorderRight['borderRight'] = 'none !important';
      headerBorderRight['borderRight'] = 'none !important';
      if (bc || bw !== 1) {
        rowBorder['borderBottom'] = `${borderVal} !important`;
        headerRowBorder['borderBottom'] = `${borderVal} !important`;
      }
      break;
    case TableBorderStyle.Vertical:
      rowBorder['borderBottom'] = 'none !important';
      headerRowBorder['borderBottom'] = 'none !important';
      cellBorderRight['borderRight'] = `${borderVal} !important`;
      break;
    case TableBorderStyle.Outer:
      rowBorder['borderBottom'] = 'none !important';
      headerRowBorder['borderBottom'] = 'none !important';
      cellBorderRight['borderRight'] = 'none !important';
      headerBorderRight['borderRight'] = 'none !important';
      break;
    case TableBorderStyle.All:
    default:
      if (bc || bw !== 1) {
        rowBorder['borderBottom'] = `${borderVal} !important`;
        headerRowBorder['borderBottom'] = `${borderVal} !important`;
        cellBorderRight['borderRight'] = `${borderVal} !important`;
      }
      break;
  }

  // ── Row striping ─────────────────────────────────────────────────────────
  const stripeOverrides: Record<string, Record<string, string>> = {};
  if (styling.rowStriping !== RowStripingStyle.None && effectiveStripeBg) {
    const parityAttr =
      styling.rowStriping === RowStripingStyle.Even ? '[data-row-parity="even"]' : '[data-row-parity="odd"]';
    stripeOverrides[parityAttr] = { backgroundColor: effectiveStripeBg };
  }

  // ── Compose final CSS class ───────────────────────────────────────────────
  return css({
    position: 'relative',
    ...(shadow && { boxShadow: shadow }),
    ...(borderRadius > 0 && { borderRadius: `${borderRadius}px`, overflow: 'hidden' }),
    ...(fontSizeScale !== 1 && { fontSize: `${fontSizeScale * 100}%` }),

    // Animations
    ...(styling.enableAnimations && {
      '[role="row"]': { transition: 'background-color 0.15s ease' },
    }),

    // Header font/style overrides → target the actual header cells directly
    ...(Object.keys(headerFontStyle).length > 0 && {
      '[role="columnheader"]': headerFontStyle,
    }),

    // Data cell text / background
    ...(effectiveCellText && {
      '[role="cell"]': {
        color: `${effectiveCellText} !important`,
        ...(effectiveCellBg && { backgroundColor: `${effectiveCellBg} !important` }),
      },
    }),
    ...(!effectiveCellText && effectiveCellBg && {
      '[role="cell"]': { backgroundColor: `${effectiveCellBg} !important` },
    }),

    // Row divider (explicit color wins over border style)
    ...(styling.rowDividerColor
      ? { '[role="row"]': { borderBottom: `${bw}px solid ${styling.rowDividerColor} !important` } }
      : Object.keys(rowBorder).length > 0
      ? { '[role="row"]': rowBorder }
      : {}),

    // Header row bottom border
    ...(Object.keys(headerRowBorder).length > 0 && {
      '[role="rowgroup"]': headerRowBorder,
    }),

    // Column divider (explicit color wins over border style)
    ...(styling.columnDividerColor
      ? {
          '[role="cell"]': {
            ...(effectiveCellBg ? { backgroundColor: `${effectiveCellBg} !important` } : {}),
            ...(effectiveCellText ? { color: `${effectiveCellText} !important` } : {}),
            borderRight: `${bw}px solid ${styling.columnDividerColor} !important`,
          },
        }
      : Object.keys(cellBorderRight).length > 0
      ? {
          '[role="cell"]': {
            ...cellBorderRight,
            ...(effectiveCellBg ? { backgroundColor: `${effectiveCellBg} !important` } : {}),
            ...(effectiveCellText ? { color: `${effectiveCellText} !important` } : {}),
          },
        }
      : {}),

    // Header cell right border
    ...(Object.keys(headerBorderRight).length > 0 && {
      '[role="columnheader"]': {
        ...headerFontStyle,
        ...headerBorderRight,
      },
    }),

    // Cell padding
    ...(cellPaddingPx !== undefined && {
      '[role="cell"], [role="columnheader"]': { padding: `${cellPaddingPx}px !important` },
    }),

    // Row striping
    ...stripeOverrides,
  });
}

type PresetDefaults = {
  headerBg?: string;
  headerText?: string;
  cellBg?: string;
  cellText?: string;
  hoverBg?: string;
  stripeBg?: string;
  borderStyle?: TableBorderStyle;
  headerStyle?: HeaderStyle;
  borderColor?: string;
};

/**
 * Per-preset default color values. Returns theme-appropriate colors for
 * both dark and light mode. User explicit overrides always take priority.
 */
function getPresetDefaults(isDark: boolean, preset: TableDesignPreset): PresetDefaults {
  switch (preset) {
    case TableDesignPreset.Minimal:
      return {
        borderStyle: TableBorderStyle.Horizontal,
        headerStyle: HeaderStyle.Minimal,
      };

    case TableDesignPreset.Modern:
      return {
        headerStyle: HeaderStyle.Accent,
        hoverBg: isDark ? 'rgba(99,102,241,0.10)' : 'rgba(99,102,241,0.07)',
      };

    case TableDesignPreset.Striped:
      return {
        stripeBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        borderStyle: TableBorderStyle.Horizontal,
      };

    case TableDesignPreset.Bordered:
      return { borderStyle: TableBorderStyle.All };

    case TableDesignPreset.Elegant:
      return isDark
        ? {
            headerBg: '#1e3a5f',
            headerText: '#e8f2ff',
            hoverBg: 'rgba(100,160,240,0.08)',
            borderStyle: TableBorderStyle.Horizontal,
            stripeBg: 'rgba(100,160,240,0.03)',
          }
        : {
            headerBg: '#1e3a5f',
            headerText: '#ffffff',
            hoverBg: 'rgba(30,58,95,0.05)',
            borderStyle: TableBorderStyle.Horizontal,
            stripeBg: 'rgba(30,58,95,0.03)',
          };

    case TableDesignPreset.Compact:
      return {};

    case TableDesignPreset.HighContrast:
      return isDark
        ? {
            headerBg: '#111827',
            headerText: '#f9fafb',
            borderStyle: TableBorderStyle.All,
            borderColor: 'rgba(255,255,255,0.15)',
          }
        : {
            headerBg: '#1f2937',
            headerText: '#ffffff',
            borderStyle: TableBorderStyle.All,
            borderColor: 'rgba(0,0,0,0.15)',
          };

    case TableDesignPreset.Glassmorphism:
      return {
        headerStyle: HeaderStyle.Glass,
        hoverBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        borderStyle: TableBorderStyle.Horizontal,
        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
      };

    case TableDesignPreset.Neon:
      return {
        headerBg: '#0a0a14',
        headerText: '#00ff88',
        hoverBg: 'rgba(0,255,136,0.06)',
        borderColor: 'rgba(0,255,136,0.20)',
        stripeBg: 'rgba(0,255,136,0.02)',
      };

    case TableDesignPreset.Executive:
      return isDark
        ? {
            headerBg: '#1a2535',
            headerText: '#ecf0f1',
            hoverBg: 'rgba(52,73,94,0.35)',
            stripeBg: 'rgba(255,255,255,0.02)',
            borderStyle: TableBorderStyle.Horizontal,
            borderColor: 'rgba(255,255,255,0.08)',
          }
        : {
            headerBg: '#2c3e50',
            headerText: '#ecf0f1',
            hoverBg: 'rgba(44,62,80,0.06)',
            stripeBg: 'rgba(44,62,80,0.03)',
            borderStyle: TableBorderStyle.Horizontal,
            borderColor: 'rgba(0,0,0,0.08)',
          };

    case TableDesignPreset.Dashboard:
      return {
        borderStyle: TableBorderStyle.Horizontal,
        hoverBg: isDark ? 'rgba(99,102,241,0.09)' : 'rgba(99,102,241,0.06)',
        headerStyle: HeaderStyle.Bold,
      };

    default: // TableDesignPreset.Default
      return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unchanged helpers below
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentFrameIndex(frames: DataFrame[], options: Options) {
  return options.frameIndex > 0 && options.frameIndex < frames.length ? options.frameIndex : 0;
}

function onColumnResize(fieldDisplayName: string, width: number, props: Props) {
  const { fieldConfig } = props;
  const { overrides } = fieldConfig;

  const matcherId = FieldMatcherID.byName;
  const propId = 'custom.width';

  const override = overrides.find((o) => o.matcher.id === matcherId && o.matcher.options === fieldDisplayName);

  if (override) {
    const property = override.properties.find((prop) => prop.id === propId);
    if (property) {
      property.value = width;
    } else {
      override.properties.push({ id: propId, value: width });
    }
  } else {
    overrides.push({
      matcher: { id: matcherId, options: fieldDisplayName },
      properties: [{ id: propId, value: width }],
    });
  }

  props.onFieldConfigChange({
    ...fieldConfig,
    overrides,
  });
}

function onSortByChange(sortBy: TableSortByFieldState[], props: Props) {
  props.onOptionsChange({
    ...props.options,
    sortBy,
  });
}

function onChangeTableSelection(val: SelectableValue<number>, props: Props) {
  props.onOptionsChange({
    ...props.options,
    frameIndex: val.value || 0,
  });
}

// placeholder function; assuming the values are already interpolated
const replaceVars: InterpolateFunction = (value: string) => value;

const getCellActions = (
  dataFrame: DataFrame,
  field: Field,
  rowIndex: number,
  replaceVariables: InterpolateFunction | undefined
) => {
  const actions: Array<ActionModel<Field>> = [];
  const actionLookup = new Set<string>();

  const actionsModel = getActions(
    dataFrame,
    field,
    field.state!.scopedVars!,
    replaceVariables ?? replaceVars,
    field.config.actions ?? [],
    { valueRowIndex: rowIndex }
  );

  actionsModel.forEach((action) => {
    const key = `${action.title}`;
    if (!actionLookup.has(key)) {
      actions.push(action);
      actionLookup.add(key);
    }
  });

  return actions;
};

const tableStyles = {
  defaultWrapper: css({
    position: 'relative',
  }),
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  }),
  selectWrapper: css({
    padding: '8px 8px 0px 8px',
  }),
};
