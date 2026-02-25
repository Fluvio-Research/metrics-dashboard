import { css, cx, keyframes } from '@emotion/css';
import { CSSProperties, useCallback, useMemo } from 'react';

import {
  ActionModel,
  DashboardCursorSync,
  DataFrame,
  FieldMatcherID,
  getFrameDisplayName,
  InterpolateFunction,
  PanelProps,
  SelectableValue,
  Field,
  cacheFieldDisplayNames,
  GrafanaTheme2,
} from '@grafana/data';
import { config, PanelDataErrorView, getTemplateSrv, locationService } from '@grafana/runtime';
import { Select, usePanelContext, useStyles2, useTheme2 } from '@grafana/ui';
import { TableSortByFieldState } from '@grafana/ui/internal';
import { TableNG } from '@grafana/ui/unstable';

import { getActions } from '../../../../features/actions/utils';

import { hasDeprecatedParentRowIndex, migrateFromParentRowIndexToNestedFrames } from './migrations';
import {
  Options,
  TableStyling,
  TableDesignPreset,
  TableBorderStyle,
  RowStripingStyle,
  HeaderStyle,
  defaultStyling,
  FieldConfig,
  VisibilityCondition,
  defaultVisibility,
  defaultClickToFilter,
  ClickToFilterOptions,
} from './panelcfg.gen';

interface Props extends PanelProps<Options> {}

export function TablePanel(props: Props) {
  const { data, height, width, options, fieldConfig, id, timeRange, replaceVariables, transparent } = props;

  useMemo(() => {
    cacheFieldDisplayNames(data.series);
  }, [data.series]);

  const theme = useTheme2();
  const styling = useMemo(() => ({ ...defaultStyling, ...(options.styling ?? {}) }), [options.styling]);
  const visibility = useMemo(() => ({ ...defaultVisibility, ...(options.visibility ?? {}) }), [options.visibility]);
  const clickToFilter = useMemo(() => ({ ...defaultClickToFilter, ...(options.clickToFilter ?? {}) }), [options.clickToFilter]);
  const dynamicStyles = useStyles2(getDynamicStyles, styling, clickToFilter);
  const gridStyle = useMemo(() => buildGridStyle(theme, styling, transparent), [theme, styling, transparent]);
  
  const panelContext = usePanelContext();
  const _getActions = useCallback(
    (frame: DataFrame, field: Field, rowIndex: number) => getCellActions(frame, field, rowIndex, replaceVariables),
    [replaceVariables]
  );
  const frames = hasDeprecatedParentRowIndex(data.series)
    ? migrateFromParentRowIndexToNestedFrames(data.series)
    : data.series;
  const count = frames?.length;
  const hasFields = frames.some((frame) => frame.fields.length > 0);
  const hasData = count > 0 && hasFields && frames.some((frame) => frame.length > 0);
  const currentIndex = getCurrentFrameIndex(frames, options);
  const main = frames[currentIndex];

  // Check visibility conditions
  const isVisible = useMemo(() => {
    // If panel visibility is disabled, hide it
    if (visibility.enabled === false) {
      return false;
    }

    // If hideOnNoData is true and there's no data, hide completely
    if (visibility.hideOnNoData && !hasData) {
      return false;
    }

    // Check visibility condition
    switch (visibility.condition) {
      case VisibilityCondition.Never:
        return false;

      case VisibilityCondition.HasData:
        return hasData;

      case VisibilityCondition.VariableEquals:
        if (visibility.variableName && replaceVariables) {
          const variableValue = replaceVariables(`$${visibility.variableName}`);
          return variableValue === visibility.variableValue;
        }
        return true;

      case VisibilityCondition.VariableNotEquals:
        if (visibility.variableName && replaceVariables) {
          const variableValue = replaceVariables(`$${visibility.variableName}`);
          return variableValue !== visibility.variableValue;
        }
        return true;

      case VisibilityCondition.VariableContains:
        if (visibility.variableName && replaceVariables) {
          const variableValue = replaceVariables(`$${visibility.variableName}`);
          return variableValue.includes(visibility.variableValue || '');
        }
        return true;

      case VisibilityCondition.Always:
      default:
        return true;
    }
  }, [visibility, hasData, replaceVariables]);

  const enableSharedCrosshair = panelContext.sync && panelContext.sync() !== DashboardCursorSync.Off;

  // These hooks must be called unconditionally (before any early returns) to comply with React's rules of hooks
  const columnStylesClass = useMemo(() => {
    if (!main?.fields) {
      return undefined;
    }
    return getColumnStyles(main.fields);
  }, [main?.fields]);
  
  const wrapperClassName = columnStylesClass
    ? cx(dynamicStyles.tableWrapper, columnStylesClass)
    : dynamicStyles.tableWrapper;

  // Click-to-filter handler - receives the actual value from the clicked row
  const handleRowClick = useCallback(
    (clickedValue: string) => {
      if (!clickToFilter.enabled || !clickToFilter.targetVariable) {
        return;
      }

      // Get current variable value using template service
      const templateSrv = getTemplateSrv();
      const currentValue = templateSrv.replace(`$${clickToFilter.targetVariable}`);
      
      // Check if the variable reference was resolved (if it still contains $ it wasn't found)
      const variableNotFound = currentValue === `$${clickToFilter.targetVariable}`;

      // Toggle mode: clear if same value is clicked again
      let newValue = clickedValue;
      if (clickToFilter.toggleMode && !variableNotFound && currentValue === clickedValue) {
        // Set to empty string to clear the filter value (not undefined which would remove the variable)
        newValue = '';
      }

      // Update the variable using locationService - this updates the URL which triggers variable refresh
      // Use empty string instead of undefined to keep the variable but clear its value
      locationService.partial({
        [`var-${clickToFilter.targetVariable}`]: newValue,
      }, true); // true = replace history instead of push
    },
    [clickToFilter]
  );

  // Handle wrapper click to detect row clicks - extracts value from DOM cell or data frame
  // This correctly handles sorted tables by reading the actual displayed value
  // For hidden fields, it uses visible field values to find the correct data row
  const handleWrapperClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!clickToFilter.enabled || !clickToFilter.sourceField || !main?.fields) {
        return;
      }

      // Find the clicked row
      const target = event.target as HTMLElement;
      const row = target.closest('.rdg-row:not(.rdg-header-row)') as HTMLElement;
      
      if (!row) {
        return;
      }

      // Find the source field in the data frame to get its display name
      const sourceField = main.fields.find(
        (f) => f.name === clickToFilter.sourceField || 
               (f.config.displayName && f.config.displayName === clickToFilter.sourceField)
      );
      
      if (!sourceField) {
        return;
      }

      // Get the display name used in the table header
      const sourceFieldDisplayName = sourceField.config.displayName || sourceField.name;

      // Find the table container and header row to determine the correct column index
      const tableContainer = row.closest('.rdg') as HTMLElement;
      if (!tableContainer) {
        return;
      }

      const headerRow = tableContainer.querySelector('.rdg-header-row') as HTMLElement;
      if (!headerRow) {
        return;
      }

      // Find the header cell that matches the source field name to get the correct aria-colindex
      const headerCells = headerRow.querySelectorAll('.rdg-cell');
      let targetColIndex: string | null = null;

      for (const cell of headerCells) {
        const cellText = cell.textContent?.trim();
        // Match against both the configured sourceField and the field's display name
        if (cellText === clickToFilter.sourceField || cellText === sourceFieldDisplayName) {
          targetColIndex = cell.getAttribute('aria-colindex');
          break;
        }
      }

      // If source field is visible, get value directly from DOM
      if (targetColIndex) {
        const dataCell = row.querySelector(`[aria-colindex="${targetColIndex}"]`) as HTMLElement;
        if (dataCell) {
          const cellValue = dataCell.textContent?.trim() || '';
          if (cellValue) {
            handleRowClick(cellValue);
          }
          return;
        }
      }

      // Source field is hidden - we need to find the correct data row index
      // by matching visible cell values to find the row in the original data
      
      // Get all visible cells in the row
      const rowCells = row.querySelectorAll('.rdg-cell');
      
      // Build a map of header name -> cell value for this row
      const rowValues: Record<string, string> = {};
      for (const cell of rowCells) {
        const colIndex = cell.getAttribute('aria-colindex');
        if (colIndex) {
          // Find the corresponding header cell to get the field name
          const headerCell = headerRow.querySelector(`[aria-colindex="${colIndex}"]`);
          if (headerCell) {
            const fieldName = headerCell.textContent?.trim() || '';
            const cellValue = cell.textContent?.trim() || '';
            if (fieldName && cellValue) {
              rowValues[fieldName] = cellValue;
            }
          }
        }
      }

      // Find the data row index by matching visible field values
      let matchedRowIndex = -1;
      for (let i = 0; i < main.length; i++) {
        let allMatch = true;
        for (const [fieldName, cellValue] of Object.entries(rowValues)) {
          // Find the field in the data frame by name or display name
          const field = main.fields.find(
            (f) => f.name === fieldName || 
                   (f.config.displayName && f.config.displayName === fieldName)
          );
          if (field) {
            const dataValue = field.values[i];
            const dataValueStr = dataValue != null ? String(dataValue) : '';
            // Use a simple string comparison (may need to handle formatting differences)
            if (dataValueStr !== cellValue) {
              allMatch = false;
              break;
            }
          }
        }
        if (allMatch && Object.keys(rowValues).length > 0) {
          matchedRowIndex = i;
          break;
        }
      }

      if (matchedRowIndex >= 0) {
        // Get the hidden field value using the matched row index
        const rawValue = sourceField.values[matchedRowIndex];
        const cellValue = rawValue != null ? String(rawValue) : '';
        if (cellValue) {
          handleRowClick(cellValue);
        }
      } else {
        console.warn('Click to filter: Could not match row to data. Source field may be hidden and row data could not be identified.');
      }
    },
    [clickToFilter.enabled, clickToFilter.sourceField, main, handleRowClick]
  );

  let tableHeight = height;

  // If panel is not visible, show nothing or a message
  if (!isVisible) {
    // If completely hidden (hideOnNoData or condition is Never), return null
    if (visibility.hideOnNoData || visibility.condition === VisibilityCondition.Never || visibility.enabled === false) {
      return null;
    }
    // Otherwise show a "no data" message
    return (
      <div className={visibilityStyles.hiddenContainer} style={{ height, width }}>
        <div className={visibilityStyles.hiddenMessage}>
          {visibility.noDataMessage || 'Panel hidden'}
        </div>
      </div>
    );
  }

  if (!count || !hasFields) {
    return <PanelDataErrorView panelId={id} fieldConfig={fieldConfig} data={data} />;
  }

  if (count > 1) {
    const inputHeight = theme.spacing.gridSize * theme.components.height.md;
    const padding = theme.spacing.gridSize;

    tableHeight = height - inputHeight - padding;
  }

  const tableElement = (
    <div 
      className={wrapperClassName} 
      style={gridStyle}
      onClick={handleWrapperClick}
    >
      <TableNG
        style={gridStyle}
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
        getActions={_getActions}
        structureRev={data.structureRev}
        transparent={transparent}
      />
    </div>
  );

  if (count === 1) {
    return tableElement;
  }

  const names = frames.map((frame, index) => {
    return {
      label: getFrameDisplayName(frame),
      value: index,
    };
  });

  return (
    <div className={tableStyles.wrapper}>
      {tableElement}
      <div className={tableStyles.selectWrapper}>
        <Select options={names} value={names[currentIndex]} onChange={(val) => onChangeTableSelection(val, props)} />
      </div>
    </div>
  );
}

function getCurrentFrameIndex(frames: DataFrame[], options: Options) {
  return options.frameIndex > 0 && options.frameIndex < frames.length ? options.frameIndex : 0;
}

function onColumnResize(fieldDisplayName: string, width: number, props: Props) {
  const { fieldConfig } = props;
  const { overrides } = fieldConfig;

  const matcherId = FieldMatcherID.byName;
  const propId = 'custom.width';

  // look for existing override
  const override = overrides.find((o) => o.matcher.id === matcherId && o.matcher.options === fieldDisplayName);

  if (override) {
    // look for existing property
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
): Array<ActionModel<Field>> => {
  const numActions = field.config.actions?.length ?? 0;

  if (numActions > 0) {
    const actions = getActions(
      dataFrame,
      field,
      field.state!.scopedVars!,
      replaceVariables ?? replaceVars,
      field.config.actions ?? [],
      { valueRowIndex: rowIndex }
    );

    if (actions.length === 1) {
      return actions;
    } else {
      const actionsOut: Array<ActionModel<Field>> = [];
      const actionLookup = new Set<string>();

      actions.forEach((action) => {
        const key = action.title;

        if (!actionLookup.has(key)) {
          actionsOut.push(action);
          actionLookup.add(key);
        }
      });

      return actionsOut;
    }
  }

  return [];
};

const tableStyles = {
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

const visibilityStyles = {
  hiddenContainer: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    opacity: 0.6,
  }),
  hiddenMessage: css({
    fontSize: '14px',
    color: 'rgba(128, 128, 128, 0.8)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px',
  }),
};

// Animation keyframes for enhanced styling
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.6); }
`;

// Dynamic styles for the wrapper and interactive affordances
const getDynamicStyles = (theme: GrafanaTheme2, styling: TableStyling, clickToFilter?: ClickToFilterOptions) => {
  const preset = styling.designPreset || TableDesignPreset.Default;
  const borderColor = styling.borderColor || theme.colors.border.weak;
  const borderWidth = styling.borderWidth ?? 1;
  const borderStyle = styling.borderStyle || TableBorderStyle.All;
  const headerStyle = styling.headerStyle || HeaderStyle.Default;
  const rowStriping = styling.rowStriping || RowStripingStyle.None;
  const stripeColor = styling.stripeColor || (theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)');
  const hoverColor = styling.hoverColor || theme.colors.action.hover;
  const fontScale = styling.fontSizeScale ?? 1;
  const shadowStrength = styling.shadowIntensity ?? 0.2;

  const paddingMap: Record<string, string> = {
    compact: '2px 6px',
    normal: '6px 8px',
    spacious: '10px 12px',
  };
  const cellPadding = paddingMap[styling.cellPadding || 'normal'];

  const headerRowStyles: Record<string, unknown> = {};

  // Apply custom font size and weight if specified
  if (styling.headerFontSize) {
    headerRowStyles.fontSize = `${styling.headerFontSize}px !important`;
  }
  if (styling.headerFontWeight) {
    const weightMap: Record<string, string> = {
      'normal': '400',
      'bold': '700',
      '300': '300',
      '400': '400',
      '500': '500',
      '600': '600',
      '700': '700',
      '800': '800',
      '900': '900',
    };
    headerRowStyles.fontWeight = `${weightMap[styling.headerFontWeight] || styling.headerFontWeight} !important`;
  }

  switch (headerStyle) {
    case HeaderStyle.Bold:
      if (!styling.headerFontWeight) {
        headerRowStyles.fontWeight = '700 !important';
      }
      if (!styling.headerFontSize) {
        headerRowStyles.fontSize = '0.95em';
      }
      headerRowStyles.letterSpacing = '0.02em';
      headerRowStyles.backgroundColor = `${styling.headerBgColor || (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')} !important`;
      headerRowStyles.color = `${styling.headerTextColor || theme.colors.text.primary} !important`;
      break;
    case HeaderStyle.Accent:
      headerRowStyles.backgroundColor = `${styling.headerBgColor || theme.colors.primary.main} !important`;
      headerRowStyles.color = `${styling.headerTextColor || theme.colors.primary.contrastText} !important`;
      if (!styling.headerFontWeight) {
        headerRowStyles.fontWeight = '600 !important';
      }
      break;
    case HeaderStyle.Gradient:
      headerRowStyles.background = `${styling.headerBgColor || `linear-gradient(135deg, ${theme.colors.primary.main} 0%, ${theme.colors.primary.shade} 100%)`} !important`;
      headerRowStyles.color = `${styling.headerTextColor || '#ffffff'} !important`;
      if (!styling.headerFontWeight) {
        headerRowStyles.fontWeight = '600 !important';
      }
      break;
    case HeaderStyle.Minimal:
      headerRowStyles.backgroundColor = 'transparent !important';
      headerRowStyles.borderBottom = `2px solid ${theme.colors.border.medium} !important`;
      headerRowStyles.color = `${styling.headerTextColor || theme.colors.text.secondary} !important`;
      if (!styling.headerFontWeight) {
        headerRowStyles.fontWeight = '500 !important';
      }
      headerRowStyles.textTransform = 'uppercase';
      if (!styling.headerFontSize) {
        headerRowStyles.fontSize = '0.8em';
      }
      headerRowStyles.letterSpacing = '0.08em';
      break;
    case HeaderStyle.Glass:
      headerRowStyles.backgroundColor = `${styling.headerBgColor || (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)')} !important`;
      headerRowStyles.backdropFilter = 'blur(10px)';
      headerRowStyles.color = `${styling.headerTextColor || theme.colors.text.primary} !important`;
      if (!styling.headerFontWeight) {
        headerRowStyles.fontWeight = '500 !important';
      }
      break;
    default:
      if (styling.headerBgColor) {
        headerRowStyles.backgroundColor = `${styling.headerBgColor} !important`;
      }
      if (styling.headerTextColor) {
        headerRowStyles.color = `${styling.headerTextColor} !important`;
      }
  }

  return {
    tableWrapper: css({
      width: '100%',
      height: '100%',
      borderRadius: styling.borderRadius !== undefined ? `${styling.borderRadius}px` : undefined,
      overflow: 'hidden',
      fontSize: `${fontScale}em`,
      animation:
        preset === TableDesignPreset.Neon && styling.enableAnimations
          ? `${glowPulse} 3s ease-in-out infinite`
          : styling.enableAnimations
          ? `${fadeIn} 0.3s ease-out`
          : undefined,
      boxShadow: styling.enableShadow
        ? `0 ${Math.round(8 * shadowStrength)}px ${Math.round(24 * shadowStrength)}px rgba(0,0,0,${0.15 + shadowStrength * 0.3})`
        : 'none',
      border: borderStyle === TableBorderStyle.Outer ? `${borderWidth}px solid ${borderColor}` : 'none',
      ...(preset === TableDesignPreset.Glassmorphism && {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }),
      '& .rdg': {
        border: borderStyle === TableBorderStyle.Outer ? 'none !important' : undefined,
      },
      '& .rdg .rdg-cell': {
        padding: `${cellPadding} !important`,
        transition: styling.enableAnimations ? 'all 0.15s ease' : undefined,
        // Handle vertical borders on cells
        ...(borderStyle === TableBorderStyle.None && { borderInlineEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Horizontal && { borderInlineEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Outer && { borderInlineEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Vertical && {
          borderInlineEnd: `${borderWidth}px solid ${styling.columnDividerColor || borderColor} !important`,
        }),
        ...(borderStyle === TableBorderStyle.All && {
          borderInlineEnd: `${borderWidth}px solid ${styling.columnDividerColor || borderColor} !important`,
        }),
        // Custom column divider color overrides border style color (but respects border style visibility)
        ...(styling.columnDividerColor && borderStyle !== TableBorderStyle.None && borderStyle !== TableBorderStyle.Horizontal && borderStyle !== TableBorderStyle.Outer && {
          borderInlineEnd: `${borderWidth}px solid ${styling.columnDividerColor} !important`,
        }),
      },
      '& .rdg .rdg-header-row': {
        ...headerRowStyles,
        // Handle horizontal borders on header row
        ...(borderStyle === TableBorderStyle.None && { borderBlockEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Vertical && { borderBlockEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Outer && { borderBlockEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Horizontal && { 
          borderBlockEnd: `${borderWidth}px solid ${borderColor} !important` 
        }),
        ...(borderStyle === TableBorderStyle.All && { 
          borderBlockEnd: `${borderWidth}px solid ${borderColor} !important` 
        }),
      },
      '& .rdg .rdg-header-row .rdg-cell': {
        // Apply header background to cells as well to ensure it takes effect
        ...(headerRowStyles.backgroundColor ? { 
          backgroundColor: headerRowStyles.backgroundColor as string,
          backgroundImage: 'none !important' as const,
        } : {}),
        ...(headerRowStyles.background && !headerRowStyles.backgroundColor ? { 
          background: headerRowStyles.background as string,
        } : {}),
        // Apply header text color - must come after headerRowStyles.color to override it
        ...(headerRowStyles.color ? { color: headerRowStyles.color as string } : {}),
        ...(styling.headerTextColor && { color: `${styling.headerTextColor} !important` }),
        // Apply font size and weight to header cells
        ...(headerRowStyles.fontSize ? { fontSize: headerRowStyles.fontSize as string } : {}),
        ...(headerRowStyles.fontWeight ? { fontWeight: headerRowStyles.fontWeight as string } : {}),
        ...(headerRowStyles.letterSpacing ? { letterSpacing: headerRowStyles.letterSpacing as string } : {}),
        ...(headerStyle === HeaderStyle.Minimal ? {
          textTransform: 'uppercase' as const,
          fontSize: (headerRowStyles.fontSize as string) || '0.8em',
          letterSpacing: (headerRowStyles.letterSpacing as string) || '0.08em',
        } : {}),
        // Apply border styles for vertical borders
        ...(borderStyle === TableBorderStyle.None && { borderInlineEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Horizontal && { borderInlineEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Outer && { borderInlineEnd: 'none !important' }),
      },
      '& .rdg .rdg-row:not(.rdg-header-row):not(.rdg-summary-row)': {
        // Handle horizontal borders on data rows
        ...(borderStyle === TableBorderStyle.None && { borderBlockEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Vertical && { borderBlockEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Outer && { borderBlockEnd: 'none !important' }),
        ...(borderStyle === TableBorderStyle.Horizontal && { 
          borderBlockEnd: `${borderWidth}px solid ${styling.rowDividerColor || borderColor} !important` 
        }),
        ...(borderStyle === TableBorderStyle.All && { 
          borderBlockEnd: `${borderWidth}px solid ${styling.rowDividerColor || borderColor} !important` 
        }),
        // Custom row divider color overrides border style color
        ...(styling.rowDividerColor && borderStyle !== TableBorderStyle.None && borderStyle !== TableBorderStyle.Vertical && borderStyle !== TableBorderStyle.Outer && {
          borderBlockEnd: `${borderWidth}px solid ${styling.rowDividerColor} !important`,
        }),
        ...(rowStriping === RowStripingStyle.Gradient && styling.enableRowHighlight && {
          background: `linear-gradient(90deg, transparent 0%, ${stripeColor} 50%, transparent 100%) !important`,
        }),
      },
      ...(rowStriping === RowStripingStyle.Odd && styling.enableRowHighlight && {
        '& .rdg .rdg-row:nth-of-type(odd):not(.rdg-header-row):not(.rdg-summary-row)': {
          backgroundColor: `${stripeColor} !important`,
        },
      }),
      ...(rowStriping === RowStripingStyle.Even && styling.enableRowHighlight && {
        '& .rdg .rdg-row:nth-of-type(even):not(.rdg-header-row):not(.rdg-summary-row)': {
          backgroundColor: `${stripeColor} !important`,
        },
      }),
      ...(styling.enableHoverEffect && styling.enableRowHighlight && {
        '& .rdg .rdg-row:not(.rdg-header-row):not(.rdg-summary-row):hover': {
          backgroundColor: `${hoverColor} !important`,
          transition: styling.enableAnimations ? 'background-color 0.15s ease' : undefined,
        },
      }),
      ...(styling.enableHoverEffect && styling.enableColumnHighlight && styling.enableAnimations && {
        '& .rdg .rdg-row:not(.rdg-header-row):not(.rdg-summary-row) .rdg-cell:hover': {
          backgroundColor: `${hoverColor} !important`,
          transition: 'background-color 0.15s ease',
        },
      }),
      // Disable cell "pop out" effect (box shadow and z-index) when animations are off
      ...(!styling.enableAnimations && {
        '& .rdg .rdg-row:not(.rdg-header-row):not(.rdg-summary-row) .rdg-cell:hover': {
          boxShadow: 'none !important',
          zIndex: 'auto !important',
        },
        '& .rdg > :not(.rdg-summary-row, .rdg-header-row) > .rdg-cell:hover': {
          boxShadow: 'none !important',
          zIndex: 'auto !important',
        },
      }),
      // Click-to-filter cursor styling
      ...(clickToFilter?.enabled && clickToFilter?.showClickableIndicator && {
        '& .rdg .rdg-row:not(.rdg-header-row):not(.rdg-summary-row)': {
          cursor: `${clickToFilter.cursorStyle || 'pointer'} !important`,
        },
      }),
    }),
  };
};

type GridCSSVariables = CSSProperties & Record<string, string | number | undefined>;

function buildGridStyle(theme: GrafanaTheme2, styling: TableStyling, transparent?: boolean): GridCSSVariables {
  const preset = styling.designPreset || TableDesignPreset.Default;
  const borderColor = styling.borderColor || theme.colors.border.weak;
  const borderWidth = styling.borderWidth ?? 1;

  const baseBackground = transparent ? theme.colors.background.canvas : theme.colors.background.primary;
  const baseHover = transparent ? theme.colors.background.primary : theme.colors.background.secondary;

  const gridStyle: GridCSSVariables = {
    '--rdg-border-color': borderColor,
    '--rdg-summary-border-color': borderColor,
    '--rdg-border-width': `${borderWidth}px`,
    '--rdg-background-color': baseBackground,
    '--rdg-row-background-color': baseBackground,
    '--rdg-header-background-color': baseBackground,
    '--rdg-color': theme.colors.text.primary,
    '--rdg-row-hover-background-color': baseHover,
  };

  switch (preset) {
    case TableDesignPreset.Minimal:
      gridStyle['--rdg-border-color'] = 'transparent';
      break;
    case TableDesignPreset.Modern:
      gridStyle['--rdg-border-color'] = theme.colors.border.weak;
      gridStyle['--rdg-header-background-color'] = theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
      gridStyle['--rdg-row-hover-background-color'] = theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.03)';
      break;
    case TableDesignPreset.Striped:
      gridStyle['--rdg-border-color'] = theme.colors.border.weak;
      break;
    case TableDesignPreset.Bordered:
      gridStyle['--rdg-border-color'] = theme.colors.border.medium;
      break;
    case TableDesignPreset.Elegant:
      gridStyle['--rdg-border-color'] = theme.isDark ? 'rgba(255,215,0,0.2)' : 'rgba(139,69,19,0.2)';
      gridStyle['--rdg-header-background-color'] = theme.isDark ? 'rgba(255,215,0,0.1)' : 'rgba(139,69,19,0.08)';
      gridStyle['--rdg-row-hover-background-color'] = theme.isDark
        ? 'rgba(255,215,0,0.15)'
        : 'rgba(139,69,19,0.1)';
      gridStyle['--rdg-background-color'] = theme.isDark ? 'rgba(20,15,10,0.95)' : 'rgba(255,250,240,0.95)';
      gridStyle['--rdg-row-background-color'] = gridStyle['--rdg-background-color'];
      break;
    case TableDesignPreset.Compact:
      gridStyle['--rdg-border-color'] = theme.colors.border.weak;
      break;
    case TableDesignPreset.HighContrast:
      gridStyle['--rdg-border-color'] = theme.isDark ? '#ffffff' : '#000000';
      gridStyle['--rdg-background-color'] = theme.isDark ? '#000000' : '#ffffff';
      gridStyle['--rdg-row-background-color'] = gridStyle['--rdg-background-color'];
      gridStyle['--rdg-header-background-color'] = theme.isDark ? '#1a1a1a' : '#f5f5f5';
      gridStyle['--rdg-color'] = theme.isDark ? '#ffffff' : '#000000';
      break;
    case TableDesignPreset.Glassmorphism:
      gridStyle['--rdg-background-color'] = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)';
      gridStyle['--rdg-row-background-color'] = theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)';
      gridStyle['--rdg-header-background-color'] = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)';
      gridStyle['--rdg-border-color'] = theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
      gridStyle['--rdg-row-hover-background-color'] = theme.isDark
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(255,255,255,0.95)';
      break;
    case TableDesignPreset.Neon:
      gridStyle['--rdg-background-color'] = theme.isDark ? '#0a0a0f' : '#f0f0ff';
      gridStyle['--rdg-row-background-color'] = gridStyle['--rdg-background-color'];
      gridStyle['--rdg-header-background-color'] = theme.isDark ? '#0f0f1a' : '#e8e8ff';
      gridStyle['--rdg-border-color'] = theme.isDark ? '#00ffff60' : '#6666ff60';
      gridStyle['--rdg-color'] = theme.isDark ? '#00ffff' : '#4444cc';
      gridStyle['--rdg-row-hover-background-color'] = theme.isDark
        ? 'rgba(0,255,255,0.15)'
        : 'rgba(102,102,255,0.15)';
      break;
    case TableDesignPreset.Executive:
      gridStyle['--rdg-background-color'] = theme.isDark ? '#1a1a2e' : '#fafafa';
      gridStyle['--rdg-row-background-color'] = gridStyle['--rdg-background-color'];
      gridStyle['--rdg-header-background-color'] = theme.isDark ? '#16213e' : '#f0f0f0';
      gridStyle['--rdg-border-color'] = theme.isDark ? '#2a2a4a' : '#e0e0e0';
      gridStyle['--rdg-row-hover-background-color'] = theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.04)';
      break;
    case TableDesignPreset.Dashboard:
      gridStyle['--rdg-background-color'] = 'transparent';
      gridStyle['--rdg-row-background-color'] = 'transparent';
      gridStyle['--rdg-header-background-color'] = theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
      gridStyle['--rdg-border-color'] = theme.colors.border.weak;
      gridStyle['--rdg-row-hover-background-color'] = theme.colors.action.hover;
      break;
    default:
      break;
  }

  if (styling.cellBgColor) {
    gridStyle['--rdg-background-color'] = styling.cellBgColor;
    gridStyle['--rdg-row-background-color'] = styling.cellBgColor;
  }
  if (styling.cellTextColor) {
    gridStyle['--rdg-color'] = styling.cellTextColor;
  }
  if (styling.hoverColor) {
    gridStyle['--rdg-row-hover-background-color'] = styling.hoverColor;
  }
  if (styling.borderColor) {
    gridStyle['--rdg-border-color'] = styling.borderColor;
    gridStyle['--rdg-summary-border-color'] = styling.borderColor;
  }
  if (styling.headerBgColor) {
    gridStyle['--rdg-header-background-color'] = styling.headerBgColor;
  }

  return gridStyle;
}

function getColumnStyles(fields: Field[]) {
  const columnRules: Record<string, Record<string, string>> = {};

  fields.forEach((field, index) => {
    const columnStyling = (field.config.custom as FieldConfig | undefined)?.columnStyling;
    if (!columnStyling) {
      return;
    }

    const declarations: Record<string, string> = {};

    if (columnStyling.gradientEnabled && columnStyling.gradientStart && columnStyling.gradientEnd) {
      declarations.background = `linear-gradient(135deg, ${columnStyling.gradientStart} 0%, ${columnStyling.gradientEnd} 100%) !important`;
    } else if (columnStyling.backgroundColor) {
      declarations.backgroundColor = `${columnStyling.backgroundColor} !important`;
    }

    if (columnStyling.textColor) {
      declarations.color = `${columnStyling.textColor} !important`;
    }

    if (columnStyling.fontWeight) {
      const fontWeight =
        columnStyling.fontWeight === 'bold' ? '700' : columnStyling.fontWeight === 'light' ? '300' : '400';
      declarations.fontWeight = `${fontWeight} !important`;
    }

    if (Object.keys(declarations).length === 0) {
      return;
    }

    const selector = `& .rdg .rdg-cell[aria-colindex="${index + 1}"], & .rdg .rdg-row .rdg-cell:nth-child(${
      index + 1
    }), & .rdg .rdg-header-row .rdg-cell:nth-child(${index + 1})`;

    columnRules[selector] = declarations;
  });

  if (Object.keys(columnRules).length === 0) {
    return undefined;
  }

  return css(columnRules);
}
