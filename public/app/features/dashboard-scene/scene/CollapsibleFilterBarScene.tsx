import { css } from '@emotion/css';
import { useState, useCallback, useEffect } from 'react';

import { GrafanaTheme2, VariableHide } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { sceneGraph, SceneVariable } from '@grafana/scenes';
import { Button, useStyles2, Icon, AutoSizeInput, Tooltip } from '@grafana/ui';
import { t } from '@grafana/i18n';

import { DashboardScene } from './DashboardScene';
import { VariableValueSelectWrapper } from './VariableControls';

interface Props {
  dashboard: DashboardScene;
}

// Custom TextBox renderer with clear and search buttons
function TextBoxVariableRenderer({ variable }: { variable: SceneVariable }) {
  const state = variable.useState();
  const value = (state as any).value ?? '';
  const key = state.key;
  const loading = state.loading;
  const [localValue, setLocalValue] = useState(value);
  const styles = useStyles2(getTextBoxStyles);

  // Sync localValue when variable value changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      (variable as any).setValue(e.currentTarget.value);
    },
    [variable]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        (variable as any).setValue(e.currentTarget.value);
      }
    },
    [variable]
  );

  const onChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setLocalValue(e.currentTarget.value);
  }, []);

  const handleSearch = useCallback(() => {
    (variable as any).setValue(localValue);
  }, [variable, localValue]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    (variable as any).setValue('');
  }, [variable]);

  const hasValue = localValue && localValue.toString().trim().length > 0;

  return (
    <div className={styles.container}>
      <AutoSizeInput
        id={key}
        placeholder={t('grafana-scenes.variables.variable-value-input.placeholder-enter-value', 'Enter value')}
        minWidth={15}
        maxWidth={30}
        value={localValue}
        loading={loading}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onChange={onChange}
      />
      <div className={styles.buttonsContainer}>
        {hasValue && (
          <Tooltip content="Clear filter" placement="bottom">
            <Button icon="times" variant="secondary" fill="text" size="sm" onClick={handleClear} />
          </Tooltip>
        )}
        <Tooltip content="Apply filter (or press Enter)" placement="bottom">
          <Button icon="search" variant="primary" fill="text" size="sm" onClick={handleSearch} />
        </Tooltip>
      </div>
    </div>
  );
}

export function CollapsibleFilterBarScene({ dashboard }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = useStyles2(getStyles);
  
  const variables = sceneGraph.getVariables(dashboard)!.useState();
  const visibleVariables = variables.variables.filter((v) => v.state.hide !== VariableHide.hideVariable);

  if (visibleVariables.length === 0) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.container}>
      {/* Collapsed state - compact header */}
      <div className={styles.header} onClick={toggleExpanded}>
        <div className={styles.headerLeft}>
          <Button
            variant="secondary"
            size="sm"
            icon={isExpanded ? 'angle-up' : 'angle-down'}
            fill="text"
            className={styles.toggleButton}
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <Icon name="filter" className={styles.filterIcon} />
            <span className={styles.filterText}>
              Filters {visibleVariables.length > 0 && `(${visibleVariables.length})`}
            </span>
          </Button>
        </div>
      </div>

      {/* Expanded state - show all filters */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.filtersGrid}>
            {visibleVariables.map((variable) => {
              const isTextBox = variable.state.type === 'textbox';
              return (
                <div
                  key={variable.state.key}
                  className={styles.filterItem}
                  data-testid={selectors.pages.Dashboard.SubMenu.submenuItem}
                >
                  {isTextBox ? (
                    <TextBoxVariableRenderer variable={variable} />
                  ) : (
                    <VariableValueSelectWrapper variable={variable} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
    transition: 'all 0.2s ease-in-out',
    marginBottom: theme.spacing(0.5),

    '&:hover': {
      borderColor: theme.colors.border.medium,
    },
  }),

  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    cursor: 'pointer',
    userSelect: 'none',
    minHeight: '28px',

    '&:hover': {
      backgroundColor: theme.colors.background.canvas,
    },
  }),

  headerLeft: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),

  headerRight: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),

  toggleButton: css({
    border: 'none',
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
    gap: theme.spacing(0.5),
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.size.sm,
    minHeight: 'auto',

    '&:hover': {
      backgroundColor: 'transparent',
    },
  }),

  filterIcon: css({
    marginRight: theme.spacing(0.25),
    fontSize: '12px',
  }),

  filterText: css({
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.fontWeightMedium,
  }),

  expandedContent: css({
    padding: theme.spacing(1.5),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    backgroundColor: theme.colors.background.primary,
  }),

  filtersGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: theme.spacing(1.5),
    maxHeight: '400px',
    overflowY: 'auto',
    padding: theme.spacing(0.5),

    // Responsive breakpoints
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '1fr',
    },

    [theme.breakpoints.up('lg')]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    },

    // Custom scrollbar
    '&::-webkit-scrollbar': {
      width: '8px',
    },

    '&::-webkit-scrollbar-track': {
      background: theme.colors.background.secondary,
      borderRadius: '4px',
    },

    '&::-webkit-scrollbar-thumb': {
      background: theme.colors.border.medium,
      borderRadius: '4px',

      '&:hover': {
        background: theme.colors.border.strong,
      },
    },
  }),

  filterItem: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    transition: 'all 0.2s ease',

    '&:hover': {
      borderColor: theme.colors.border.medium,
      boxShadow: theme.shadows.z1,
    },
  }),
});

const getTextBoxStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    width: '100%',
  }),
  buttonsContainer: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginLeft: 'auto',
  }),
});

