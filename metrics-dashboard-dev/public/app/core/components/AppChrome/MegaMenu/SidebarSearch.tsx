import { css } from '@emotion/css';
import { useState, useRef, useEffect } from 'react';
import { useKBar, useMatches, NO_GROUP } from 'kbar';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { t } from '@grafana/i18n';

export function SidebarSearch() {
  const styles = useStyles2(getStyles);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { query } = useKBar();
  const { results } = useMatches();

  // Get filtered results from kbar (limit to 8 items)
  const filteredResults = searchQuery.trim()
    ? results.filter((item) => typeof item !== 'string' && item !== NO_GROUP).slice(0, 8)
    : [];

  const handleToggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    query.setSearch(e.target.value);
  };

  const handleResultClick = (item: any) => {
    if (item.perform) {
      item.perform();
    }
    setIsExpanded(false);
    setSearchQuery('');
    query.setSearch('');
  };

  const handleClose = () => {
    setIsExpanded(false);
    setSearchQuery('');
    query.setSearch('');
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  return (
    <div className={styles.container}>
      {!isExpanded ? (
        // Collapsed state - Search button
        <button
          type="button"
          onClick={handleToggleSearch}
          className={styles.searchButton}
        >
          <div className={styles.searchContent}>
            <Icon name="search" size="sm" />
            <span className={styles.searchLabel}>
              {t('nav.search.labelModern', 'Search')}
            </span>
            <Icon name="angle-down" size="sm" />
          </div>
        </button>
      ) : (
        // Expanded state - Search input and results
        <div className={styles.expandedSearch}>
          <div className={styles.searchInputWrapper}>
            <Icon name="search" size="lg" className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={t('nav.search.placeholder', 'Search dashboards, data sources...')}
              className={styles.searchInput}
            />
            <button onClick={handleClose} className={styles.closeButton}>
              <Icon name="times" size="sm" />
            </button>
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className={styles.resultsContainer}>
              {filteredResults.length > 0 ? (
                <div className={styles.resultsList}>
                  {filteredResults.map((item: any, index: number) => {
                    if (typeof item === 'string' || item === NO_GROUP) return null;
                    
                    return (
                      <button
                        key={`${item.id}-${index}`}
                        onClick={() => handleResultClick(item)}
                        className={styles.resultItem}
                      >
                        {item.icon && (
                          <div className={styles.resultIcon}>
                            <Icon name={item.icon as any} size="sm" />
                          </div>
                        )}
                        <div className={styles.resultContent}>
                          <div className={styles.resultName}>{item.name}</div>
                          {item.subtitle && (
                            <div className={styles.resultSubtitle}>{item.subtitle}</div>
                          )}
                        </div>
                        <Icon name="arrow-right" size="sm" className={styles.resultArrow} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.noResults}>
                  <Icon name="search" size="xl" />
                  <span>{t('nav.search.no-results', 'No results found')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;
  
  return {
    container: css({
      width: '100%',
      marginBottom: theme.spacing(1.25),
    }),

    searchButton: css({
      width: '100%',
      padding: `${theme.spacing(0.5)} ${theme.spacing(0.75)}`,
      border: `1px solid ${isDark ? 'rgba(77, 172, 255, 0.2)' : 'rgba(77, 172, 255, 0.18)'}`,
      borderRadius: theme.shape.radius.default,
      background: isDark 
        ? 'rgba(17, 24, 39, 0.5)'
        : 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      color: isDark ? 'rgba(226, 232, 240, 0.75)' : 'rgba(15, 23, 42, 0.65)',

      '&:hover': {
        background: isDark 
          ? 'rgba(30, 41, 59, 0.7)'
          : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme.colors.primary.main,
        transform: 'translateY(-1px)',
        boxShadow: isDark
          ? '0 4px 12px rgba(77, 172, 255, 0.18)'
          : '0 3px 8px rgba(77, 172, 255, 0.12)',
      },

      '&:active': {
        transform: 'translateY(0)',
      },
    }),

    searchContent: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      justifyContent: 'space-between',
    }),

    searchLabel: css({
      fontSize: '11px',
      fontWeight: 500,
      color: isDark ? 'rgba(226, 232, 240, 0.9)' : 'rgba(15, 23, 42, 0.85)',
      flex: 1,
      textAlign: 'left',
    }),

    expandedSearch: css({
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),

    searchInputWrapper: css({
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(1, 1.25),
      border: `1.5px solid ${theme.colors.primary.main}`,
      borderRadius: theme.shape.radius.default,
      background: isDark 
        ? 'rgba(17, 24, 39, 0.7)'
        : 'rgba(255, 255, 255, 0.95)',
      boxShadow: isDark
        ? '0 4px 12px rgba(77, 172, 255, 0.2)'
        : '0 3px 8px rgba(77, 172, 255, 0.15)',
    }),

    searchIcon: css({
      color: theme.colors.primary.main,
      opacity: 0.8,
    }),

    searchInput: css({
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: isDark ? 'rgba(226, 232, 240, 0.95)' : 'rgba(15, 23, 42, 0.9)',
      fontSize: theme.typography.body.fontSize,
      fontWeight: 500,
      
      '&::placeholder': {
        color: isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)',
      },
    }),

    closeButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(0.5),
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      borderRadius: theme.shape.radius.circle,
      color: isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(15, 23, 42, 0.7)',
      transition: 'all 0.2s ease',
      
      '&:hover': {
        background: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(15, 23, 42, 0.08)',
        color: isDark ? 'rgba(226, 232, 240, 0.95)' : 'rgba(15, 23, 42, 0.95)',
      },
    }),

    resultsContainer: css({
      maxHeight: '400px',
      overflowY: 'auto',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(15, 23, 42, 0.08)'}`,
      borderRadius: theme.shape.radius.default,
      background: isDark 
        ? 'rgba(17, 24, 39, 0.6)'
        : 'rgba(255, 255, 255, 0.8)',
    }),

    resultsList: css({
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(0.5),
    }),

    resultItem: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(1, 1.25),
      border: 'none',
      borderRadius: theme.shape.radius.default,
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s ease',
      color: isDark ? 'rgba(226, 232, 240, 0.85)' : 'rgba(15, 23, 42, 0.85)',
      
      '&:hover': {
        background: isDark 
          ? 'rgba(77, 172, 255, 0.1)'
          : 'rgba(77, 172, 255, 0.08)',
        transform: 'translateX(4px)',
      },
    }),

    resultIcon: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: theme.shape.radius.default,
      background: isDark 
        ? 'rgba(77, 172, 255, 0.12)'
        : 'rgba(77, 172, 255, 0.1)',
      color: theme.colors.primary.main,
    }),

    resultContent: css({
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
    }),

    resultName: css({
      fontSize: theme.typography.body.fontSize,
      fontWeight: 500,
      color: isDark ? 'rgba(226, 232, 240, 0.95)' : 'rgba(15, 23, 42, 0.9)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),

    resultSubtitle: css({
      fontSize: '11px',
      color: isDark ? 'rgba(148, 163, 184, 0.7)' : 'rgba(100, 116, 139, 0.7)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      marginTop: '2px',
    }),

    resultArrow: css({
      color: isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)',
      opacity: 0,
      transition: 'all 0.2s ease',
      
      'button:hover &': {
        opacity: 1,
      },
    }),

    noResults: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(3),
      color: isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)',
      fontSize: theme.typography.bodySmall.fontSize,
      gap: theme.spacing(1),
    }),
  };
};

