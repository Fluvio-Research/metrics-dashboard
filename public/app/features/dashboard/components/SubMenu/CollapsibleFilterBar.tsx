import { css } from '@emotion/css';
import { useState } from 'react';

import { TypedVariableModel, VariableHide, GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Button, useStyles2, Icon } from '@grafana/ui';

import { PickerRenderer } from '../../../variables/pickers/PickerRenderer';

interface Props {
  variables: TypedVariableModel[];
  readOnly?: boolean;
}

export const CollapsibleFilterBar = ({ variables, readOnly }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const styles = useStyles2(getStyles);

  const visibleVariables = variables.filter((state) => state.hide !== VariableHide.hideVariable);

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
        <div className={styles.headerRight}>
          {!isExpanded && (
            <Button
              variant="primary"
              size="sm"
              icon="search"
              fill="solid"
              className={styles.searchButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              aria-label="Search filters"
            >
              Search
            </Button>
          )}
        </div>
      </div>

      {/* Expanded state - show all filters */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.searchBar}>
            <div className={styles.searchInputWrapper}>
              <Icon name="search" className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search filters..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <Button
                  icon="times"
                  fill="text"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearButton}
                  aria-label="Clear search"
                />
              )}
            </div>
          </div>

          <div className={styles.filtersGrid}>
            {visibleVariables
              .filter((variable) => {
                if (!searchQuery) return true;
                const label = variable.label || variable.name;
                return label.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((variable) => (
                <div
                  key={variable.id}
                  className={styles.filterItem}
                  data-testid={selectors.pages.Dashboard.SubMenu.submenuItem}
                >
                  <PickerRenderer variable={variable} readOnly={readOnly} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
    transition: 'all 0.2s ease-in-out',
    marginBottom: theme.spacing(1),

    '&:hover': {
      borderColor: theme.colors.border.medium,
    },
  }),

  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
    cursor: 'pointer',
    userSelect: 'none',
    minHeight: '36px',

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
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    gap: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,

    '&:hover': {
      backgroundColor: 'transparent',
    },
  }),

  filterIcon: css({
    marginRight: theme.spacing(0.5),
    fontSize: '14px',
  }),

  filterText: css({
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.fontWeightMedium,
  }),

  searchButton: css({
    padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
    fontSize: theme.typography.size.sm,
    gap: theme.spacing(0.5),
    transition: 'all 0.2s ease',

    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows.z2,
    },
  }),

  expandedContent: css({
    padding: theme.spacing(1.5),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    backgroundColor: theme.colors.background.primary,
  }),

  searchBar: css({
    marginBottom: theme.spacing(1.5),
  }),

  searchInputWrapper: css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    transition: 'border-color 0.2s ease',

    '&:focus-within': {
      borderColor: theme.colors.primary.border,
      boxShadow: `0 0 0 2px ${theme.colors.primary.transparent}`,
    },
  }),

  searchIcon: css({
    marginRight: theme.spacing(1),
    color: theme.colors.text.secondary,
    fontSize: '16px',
  }),

  searchInput: css({
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    padding: theme.spacing(0.5),

    '&::placeholder': {
      color: theme.colors.text.secondary,
    },
  }),

  clearButton: css({
    padding: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),

    '&:hover': {
      backgroundColor: theme.colors.action.hover,
    },
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

    '.gf-form': {
      marginBottom: 0,
    },

    '.gf-form-label': {
      marginBottom: theme.spacing(0.5),
    },
  }),
});

