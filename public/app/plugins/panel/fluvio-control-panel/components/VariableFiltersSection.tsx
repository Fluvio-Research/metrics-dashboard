import { css, cx } from '@emotion/css';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  GrafanaTheme2,
  TypedVariableModel,
  VariableHide,
  VariableWithOptions,
} from '@grafana/data';
import { locationService, getTemplateSrv } from '@grafana/runtime';
import { useStyles2, Select, MultiSelect, Tooltip, Icon, IconName } from '@grafana/ui';
import { StoreState } from 'app/types/store';

import { hasOptions, isMulti } from 'app/features/variables/guard';
import { getVariablesState, getIfExistsLastKey, getSubMenuVariables } from 'app/features/variables/state/selectors';

import { VariableFilterOptions, PanelTheme, DisplayMode } from '../panelcfg.gen';

interface Props {
  options: VariableFilterOptions;
  panelTheme: PanelTheme;
  displayMode: DisplayMode;
  borderRadius: number;
  dashboardUid?: string;
}

interface VariableSelectOption {
  label: string;
  value: string;
  description?: string;
}

export const VariableFiltersSection = ({ 
  options, 
  panelTheme, 
  displayMode,
  borderRadius,
  dashboardUid 
}: Props) => {
  const styles = useStyles2((theme) => getVariableStyles(theme, panelTheme, displayMode, borderRadius));

  // Get dashboard UID from Redux lastKey (current dashboard) - this is the most reliable method
  const lastKey = useSelector((state: StoreState) => getIfExistsLastKey(state));
  
  // Get variables from Redux store - use same method as SubMenu
  const variables = useSelector((state: StoreState) => {
    // Priority: 1. Provided dashboardUid, 2. Redux lastKey, 3. URL
    let uid = dashboardUid;
    
    if (!uid) {
      uid = lastKey || getIfExistsLastKey(state);
    }
    
    if (!uid) {
      // Last resort: try URL
      const url = window.location.pathname;
      const match = url.match(/\/d\/([^/]+)/);
      uid = match ? match[1] : undefined;
    }
    
    if (!uid) {
      // Still no UID - return empty array
      return [];
    }
    
    try {
      // Use getSubMenuVariables like the native SubMenu does
      const templatingState = getVariablesState(uid, state);
      if (!templatingState || !templatingState.variables) {
        return [];
      }
      return getSubMenuVariables(uid, templatingState.variables);
    } catch (error) {
      console.warn('Error loading variables:', error);
      return [];
    }
  });

  // Fallback to templateSrv if Redux selector did not return any variables
  const templateSrvVariables = useMemo(() => {
    try {
      const srv = getTemplateSrv();
      const vars = srv?.getVariables?.() ?? [];
      return Array.isArray(vars) ? (vars as TypedVariableModel[]) : [];
    } catch {
      return [];
    }
  }, []);

  // Helper to convert string or array to array
  const toArray = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(',').map(s => s.trim()).filter(Boolean);
  };

  // Filter variables based on options
  const filteredVariables = useMemo(() => {
    const includeFilter = toArray(options.variableFilter).map((v) => v.toLowerCase());
    const excludeFilter = toArray(options.excludeVariables).map((v) => v.toLowerCase());

    const isExplicitlyIncluded = (variable: TypedVariableModel) =>
      includeFilter.some(
        (filter) =>
          variable.name.toLowerCase() === filter ||
          (variable.label && variable.label.toLowerCase() === filter)
      );

    const sourceVariables = variables.length > 0 ? variables : templateSrvVariables;

    return sourceVariables.filter((variable) => {
      // Skip system variables
      if (variable.type === 'system') return false;
      
      // Allow hidden variables only if explicitly included
      if (variable.hide === VariableHide.hideVariable && !isExplicitlyIncluded(variable)) {
        return false;
      }
      
      // Apply include filter (case-insensitive matching)
      if (includeFilter.length > 0 && !isExplicitlyIncluded(variable)) {
        return false;
      }
      
      // Apply exclude filter (case-insensitive matching)
      if (excludeFilter.length > 0) {
        const matchesExclude =
          excludeFilter.some(
            (filter) =>
              variable.name.toLowerCase() === filter ||
              (variable.label && variable.label.toLowerCase() === filter)
          );
        if (matchesExclude) return false;
      }
      
      return true;
    });
  }, [variables, templateSrvVariables, options.variableFilter, options.excludeVariables]);

  // Simple URL-based variable update - this is how Grafana handles variable changes
  const handleVariableChange = (variableName: string, value: string | string[]) => {
    // Format value for URL - Grafana expects comma-separated for multi-select
    const urlValue = Array.isArray(value) ? value : value;
    
    // Update URL - Grafana's variable system will automatically pick up the change
    // and update the variable + refresh dashboards
    locationService.partial({ [`var-${variableName}`]: urlValue });
  };

  const getVariableOptions = (variable: TypedVariableModel): VariableSelectOption[] => {
    if (!hasOptions(variable)) return [];
    
    const variableWithOptions = variable as VariableWithOptions;
    return (variableWithOptions.options || []).map((opt) => ({
      label: String(opt.text),
      value: String(opt.value),
      description: opt.value !== opt.text ? String(opt.value) : undefined,
    }));
  };

  const getCurrentValue = (variable: TypedVariableModel): string | string[] | undefined => {
    if (!hasOptions(variable)) return undefined;
    
    const variableWithOptions = variable as VariableWithOptions;
    const current = variableWithOptions.current;
    
    if (!current) return undefined;
    
    if (Array.isArray(current.value)) {
      return current.value.map(String);
    }
    
    return String(current.value);
  };

  const getVariableIcon = (variable: TypedVariableModel): IconName => {
    switch (variable.type) {
      case 'query': return 'database' as IconName;
      case 'textbox': return 'text' as IconName;
      case 'custom': return 'code-branch' as IconName;
      case 'constant': return 'lock' as IconName;
      case 'interval': return 'clock-nine' as IconName;
      case 'datasource': return 'plug' as IconName;
      default: return 'sliders-v-alt' as IconName;
    }
  };

  if (!options.showVariables) {
    return null;
  }

  if (filteredVariables.length === 0) {
    const includeFilter = toArray(options.variableFilter);
    const excludeFilter = toArray(options.excludeVariables);
    
    return (
      <div className={styles.emptyState}>
        <Icon name="info-circle" size="lg" />
        <span>No variables found</span>
        <span className={styles.emptyHint}>
          {variables.length === 0 
            ? 'No dashboard variables available. Add variables in Dashboard Settings → Variables.'
            : includeFilter.length > 0
              ? `No variables match the filter: ${includeFilter.join(', ')}. Check variable names in Dashboard Settings.`
              : excludeFilter.length > 0
                ? `All variables are excluded. Check "Exclude Variables" setting.`
                : 'Variables may be hidden. Check Dashboard Settings → Variables → Hide option.'}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {filteredVariables.map((variable) => {
        const selectOptions = getVariableOptions(variable);
        const currentValue = getCurrentValue(variable);
        const isMultiSelect = isMulti(variable);
        const label = variable.label || variable.name;
        const icon: IconName = getVariableIcon(variable);
        const hasValue = currentValue !== undefined && 
          (Array.isArray(currentValue) ? currentValue.length > 0 : currentValue !== '');

        return (
          <div 
            key={variable.id} 
            className={cx(
              styles.variableItem,
              options.compactMode && styles.variableItemCompact,
              hasValue && styles.variableItemActive
            )}
          >
            {options.showLabels && (
              <Tooltip 
                content={variable.description || `Variable: ${variable.name}`} 
                placement="top"
              >
                <div className={styles.variableLabelContainer}>
                  <Icon name={icon} className={styles.variableIcon} />
                  <label className={styles.variableLabel}>
                    {label}
                  </label>
                </div>
              </Tooltip>
            )}
            
            <div className={styles.selectWrapper}>
              {isMultiSelect ? (
                <MultiSelect
                  options={selectOptions}
                  value={
                    Array.isArray(currentValue)
                      ? selectOptions.filter((o) =>
                          currentValue.some((cv) => String(cv) === String(o.value))
                        )
                      : currentValue
                        ? selectOptions.filter((o) => String(o.value) === String(currentValue))
                        : []
                  }
                  onChange={(selected) => {
                    const values = selected.map((s) => String(s.value));
                    handleVariableChange(variable.name, values);
                  }}
                  placeholder={`Select ${label}...`}
                  isClearable
                  closeMenuOnSelect={false}
                  menuShouldPortal={true}
                  className={styles.select}
                />
              ) : (
                <Select
                  options={selectOptions}
                  value={
                    currentValue
                      ? selectOptions.find((o) => String(o.value) === String(currentValue))
                      : null
                  }
                  onChange={(selected) => {
                    if (selected?.value !== undefined) {
                      handleVariableChange(variable.name, String(selected.value));
                    }
                  }}
                  placeholder={`Select ${label}...`}
                  isClearable={false}
                  menuShouldPortal={true}
                  className={styles.select}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const getVariableStyles = (
  theme: GrafanaTheme2, 
  panelTheme: PanelTheme, 
  displayMode: DisplayMode,
  borderRadius: number
) => {
  const isGradient = panelTheme === PanelTheme.Gradient;
  const isDark = theme.isDark;

  return {
    wrapper: css({
      display: 'flex',
      flexDirection: displayMode === DisplayMode.Vertical ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
      alignItems: displayMode === DisplayMode.Vertical ? 'stretch' : 'flex-start',
    }),

    variableItem: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      minWidth: '180px',
      maxWidth: displayMode === DisplayMode.Vertical ? '100%' : '320px',
      flex: displayMode === DisplayMode.Vertical ? '1 1 auto' : '0 1 auto',
      padding: theme.spacing(1.25),
      borderRadius: `${borderRadius}px`,
      background: isGradient
        ? 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'
        : isDark
          ? 'rgba(255, 255, 255, 0.03)'
          : '#f8fafb',
      border: `1px solid ${isGradient ? 'rgba(255, 255, 255, 0.12)' : '#d0d7de'}`,
      boxShadow: isGradient
        ? '0 8px 24px rgba(0,0,0,0.25)'
        : '0 6px 18px rgba(15,23,42,0.08)',
      transition: 'all 0.2s ease',
      '&:hover': {
        background: isGradient
          ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'
          : isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : '#f1f5f9',
        borderColor: isGradient
          ? 'rgba(255, 255, 255, 0.2)'
          : '#2563eb',
        transform: 'translateY(-1px)',
        boxShadow: isGradient
          ? '0 10px 28px rgba(0,0,0,0.28)'
          : '0 10px 24px rgba(15,23,42,0.12)',
      },
    }),

    variableItemCompact: css({
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      minWidth: 'auto',
      padding: theme.spacing(0.75),
    }),

    variableItemActive: css({
      borderColor: `${theme.colors.primary.border} !important`,
      background: isGradient
        ? 'rgba(255, 255, 255, 0.1)'
        : `${theme.colors.primary.transparent} !important`,
    }),

    variableLabelContainer: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      marginBottom: theme.spacing(0.5),
    }),

    variableIcon: css({
      color: isGradient 
        ? 'rgba(255, 255, 255, 0.7)' 
        : theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),

    variableLabel: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: isGradient 
        ? 'rgba(255, 255, 255, 0.9)' 
        : theme.colors.text.primary,
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      transition: 'color 0.15s ease',
      flex: 1,
      '&:hover': {
        color: isGradient ? 'white' : theme.colors.text.primary,
      },
    }),

    variableBadge: css({
      fontSize: theme.typography.bodySmall.fontSize,
      padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
      minWidth: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),

    selectWrapper: css({
      position: 'relative',
      flex: 1,
      width: '100%',
    }),

    select: css({
      width: '100%',
      '& > div': {
        background: isGradient
          ? 'rgba(255, 255, 255, 0.1)'
          : undefined,
        borderColor: isGradient
          ? 'rgba(255, 255, 255, 0.2)'
          : undefined,
        borderRadius: `${borderRadius}px`,
        transition: 'all 0.2s ease',
        minHeight: '36px',
        '&:hover': {
          borderColor: isGradient
            ? 'rgba(255, 255, 255, 0.4)'
            : theme.colors.primary.border,
          boxShadow: `0 2px 8px ${isGradient ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        },
        '&[class*="isFocused"]': {
          borderColor: `${theme.colors.primary.border} !important`,
          boxShadow: `0 0 0 2px ${theme.colors.primary.transparent} !important`,
        },
      },
      '& [class*="singleValue"]': {
        color: isGradient ? 'white' : undefined,
        fontWeight: theme.typography.fontWeightMedium,
      },
      '& [class*="placeholder"]': {
        color: isGradient ? 'rgba(255, 255, 255, 0.5)' : undefined,
      },
      '& [class*="indicatorSeparator"]': {
        background: isGradient ? 'rgba(255, 255, 255, 0.2)' : undefined,
      },
      '& [class*="dropdownIndicator"]': {
        color: isGradient ? 'rgba(255, 255, 255, 0.7)' : undefined,
        '&:hover': {
          color: isGradient ? 'white' : undefined,
        },
      },
      '& [class*="multiValue"]': {
        background: isGradient
          ? 'rgba(255, 255, 255, 0.2)'
          : theme.colors.primary.transparent,
        borderRadius: `${borderRadius - 2}px`,
        color: isGradient ? 'white' : theme.colors.primary.text,
      },
      '& [class*="multiValueLabel"]': {
        color: isGradient ? 'white' : theme.colors.primary.text,
      },
    }),

    emptyState: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(3),
      color: theme.colors.text.secondary,
      textAlign: 'center',
      gap: theme.spacing(1),
      width: '100%',
    }),

    emptyHint: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.disabled,
      fontStyle: 'italic',
    }),
  };
};
