import { css, keyframes } from '@emotion/css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DataFrame, GrafanaTheme2, getFieldDisplayName } from '@grafana/data';
import { t } from '@grafana/i18n';
import {
  Icon,
  useStyles2,
} from '@grafana/ui';

export interface FilterState {
  searchText: string;
}

interface MarkerFilterProps {
  panelId: number;
  layerName: string;
  filterFields: string[];
  dataFrames: DataFrame[];
  onFilterChange: (filterState: FilterState) => void;
  position?: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const FILTER_STORAGE_KEY_PREFIX = 'geomap-filter-';
const FILTER_MINIMIZED_KEY_PREFIX = 'geomap-filter-minimized-';
const MAX_SUGGESTIONS = 5;

export const MarkerFilter = ({
  panelId,
  layerName,
  filterFields,
  dataFrames,
  onFilterChange,
  position = 'top-right',
}: MarkerFilterProps) => {
  const styles = useStyles2((theme) => getStyles(theme, position));
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const [searchText, setSearchText] = useState<string>(() => {
    const storageKey = `${FILTER_STORAGE_KEY_PREFIX}${panelId}-${layerName}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.searchText || '';
      } catch {
        return '';
      }
    }
    return '';
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    const storageKey = `${FILTER_MINIMIZED_KEY_PREFIX}${panelId}-${layerName}`;
    const saved = localStorage.getItem(storageKey);
    return saved === 'true';
  });

  // Get all unique values with counts
  const valueData = useMemo(() => {
    const valueCounts = new Map<string, number>();
    
    filterFields.forEach((fieldName) => {
      dataFrames.forEach((frame) => {
        const field = frame.fields.find((f) => f.name === fieldName || getFieldDisplayName(f, frame) === fieldName);
        if (field) {
          field.values.forEach((val) => {
            if (val != null && val !== '') {
              const displayValue = field.display ? field.display(val).text : String(val);
              const currentCount = valueCounts.get(displayValue) || 0;
              valueCounts.set(displayValue, currentCount + 1);
            }
          });
        }
      });
    });
    
    return valueCounts;
  }, [filterFields, dataFrames]);

  // Get sorted values by frequency
  const allValues = useMemo(() => {
    return Array.from(valueData.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value]) => value);
  }, [valueData]);

  // Get filtered suggestions based on search text
  const suggestions = useMemo(() => {
    if (!searchText.trim()) {
      // Show top values when empty
      return allValues.slice(0, MAX_SUGGESTIONS);
    }
    
    const searchLower = searchText.toLowerCase().trim();
    
    // Prioritize: starts with > contains
    const startsWithMatches: string[] = [];
    const containsMatches: string[] = [];
    
    allValues.forEach((value) => {
      const valueLower = value.toLowerCase();
      if (valueLower === searchLower) {
        return; // Skip exact match
      }
      if (valueLower.startsWith(searchLower)) {
        startsWithMatches.push(value);
      } else if (valueLower.includes(searchLower)) {
        containsMatches.push(value);
      }
    });
    
    return [...startsWithMatches, ...containsMatches].slice(0, MAX_SUGGESTIONS);
  }, [searchText, allValues]);

  // Match count for current filter
  const matchCount = useMemo(() => {
    if (!searchText.trim()) {
      return valueData.size;
    }
    const searchLower = searchText.toLowerCase();
    let count = 0;
    valueData.forEach((_, value) => {
      if (value.toLowerCase().includes(searchLower)) {
        count++;
      }
    });
    return count;
  }, [searchText, valueData]);

  // Initialize filter state on mount
  useEffect(() => {
    onFilterChange({ searchText });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage when filter changes
  useEffect(() => {
    const storageKey = `${FILTER_STORAGE_KEY_PREFIX}${panelId}-${layerName}`;
    if (searchText.trim()) {
      localStorage.setItem(storageKey, JSON.stringify({ searchText }));
    } else {
      localStorage.removeItem(storageKey);
    }
    onFilterChange({ searchText });
  }, [searchText, panelId, layerName, onFilterChange]);

  // Save minimized state
  useEffect(() => {
    const storageKey = `${FILTER_MINIMIZED_KEY_PREFIX}${panelId}-${layerName}`;
    localStorage.setItem(storageKey, String(isMinimized));
  }, [isMinimized, panelId, layerName]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
    setSelectedIndex(-1);
  }, []);

  const handleClear = useCallback(() => {
    setSearchText('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleSelectSuggestion = useCallback((value: string) => {
    setSearchText(value);
    setSelectedIndex(-1);
    setIsFocused(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isFocused || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  }, [isFocused, suggestions, selectedIndex, handleSelectSuggestion]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) {
      return <span>{text}</span>;
    }
    
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);
    
    if (index === -1) {
      return <span>{text}</span>;
    }
    
    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);
    
    return (
      <span>
        {before}
        <mark className={styles.highlight}>{match}</mark>
        {after}
      </span>
    );
  };

  const hasActiveFilter = searchText.trim().length > 0;

  if (filterFields.length === 0) {
    return null;
  }

  // Minimized state - just show a floating button
  if (isMinimized) {
    return (
      <button
        className={styles.minimizedButton}
        onClick={() => setIsMinimized(false)}
        title={hasActiveFilter ? `${t('geomap.marker-filter.filter-active', 'Filter active')}: "${searchText}"` : t('geomap.marker-filter.title', 'Filter Markers')}
      >
        <Icon name="filter" size="md" />
        {hasActiveFilter && <span className={styles.minimizedDot} />}
      </button>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header with title and actions */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Icon name="filter" size="xs" className={styles.headerIcon} />
          <span className={styles.headerTitle}>{t('geomap.marker-filter.title', 'Filter')}</span>
        </div>
        <button
          className={styles.minimizeBtn}
          onClick={() => setIsMinimized(true)}
          title={t('geomap.marker-filter.minimize', 'Minimize')}
        >
          <Icon name="minus" size="xs" />
        </button>
      </div>

      {/* Search input */}
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <Icon name="search" size="sm" className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={t('geomap.marker-filter.search-placeholder', 'Search...')}
            className={styles.searchInput}
            autoComplete="off"
          />
          {hasActiveFilter && (
            <button
              className={styles.clearButton}
              onClick={handleClear}
              title={t('geomap.marker-filter.clear', 'Clear')}
            >
              <Icon name="times" size="sm" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className={styles.suggestionsDropdown}>
            <div className={styles.suggestionsHeader}>
              {searchText.trim() 
                ? t('geomap.marker-filter.suggestions', 'Suggestions')
                : t('geomap.marker-filter.popular', 'Popular')}
            </div>
            <ul className={styles.suggestionsList}>
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  className={`${styles.suggestionItem} ${index === selectedIndex ? styles.suggestionItemSelected : ''}`}
                  onMouseDown={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className={styles.suggestionText}>
                    {highlightMatch(suggestion, searchText)}
                  </span>
                  <span className={styles.suggestionCount}>
                    {valueData.get(suggestion) || 0}
                  </span>
                </li>
              ))}
            </ul>
            <div className={styles.suggestionsFooter}>
              <span className={styles.keyboardHint}>
                <kbd>↑↓</kbd> {t('geomap.marker-filter.navigate', 'nav')} · <kbd>↵</kbd> {t('geomap.marker-filter.select', 'sel')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      {hasActiveFilter && (
        <div className={styles.statusBar}>
          <div className={styles.statusContent}>
            <span className={styles.statusIcon}>
              <Icon name="check-circle" size="xs" />
            </span>
            <span className={styles.statusText}>
              <strong>{matchCount}</strong> {matchCount === 1 ? t('geomap.marker-filter.result', 'match') : t('geomap.marker-filter.results', 'matches')}
            </span>
          </div>
          <button
            className={styles.clearAllButton}
            onClick={handleClear}
          >
            {t('geomap.marker-filter.clear-filter', 'Clear')}
          </button>
        </div>
      )}
    </div>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const getStyles = (theme: GrafanaTheme2, position: string) => {
  const isBottomPosition = position.includes('bottom');
  
  return {
    container: css({
      backgroundColor: theme.colors.background.primary,
      borderRadius: '8px',
      boxShadow: `0 2px 12px rgba(0, 0, 0, 0.12), 0 0 0 1px ${theme.colors.border.weak}`,
      minWidth: '220px',
      maxWidth: '280px',
      zIndex: 600,
      pointerEvents: 'auto',
      overflow: 'visible',
      animation: `${fadeIn} 0.15s ease-out`,
      position: 'relative',
    }),
    header: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing(0.75, 1.25),
      backgroundColor: theme.colors.background.secondary,
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      borderRadius: '8px 8px 0 0',
    }),
    headerLeft: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
    }),
    headerIcon: css({
      color: theme.colors.primary.text,
      fontSize: '12px',
    }),
    headerTitle: css({
      fontSize: '12px',
      fontWeight: 600,
      color: theme.colors.text.primary,
      letterSpacing: '-0.01em',
    }),
    minimizeBtn: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '20px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
        color: theme.colors.text.primary,
      },
    }),
    searchContainer: css({
      padding: theme.spacing(1),
      position: 'relative',
      backgroundColor: theme.colors.background.primary,
    }),
    searchInputWrapper: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      padding: theme.spacing(0.5, 1),
      backgroundColor: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.medium}`,
      borderRadius: '6px',
      transition: 'all 0.15s ease',
      '&:focus-within': {
        borderColor: theme.colors.primary.border,
        boxShadow: `0 0 0 1px ${theme.colors.primary.transparent}`,
      },
    }),
    searchIcon: css({
      color: theme.colors.text.secondary,
      flexShrink: 0,
      fontSize: '14px',
    }),
    searchInput: css({
      flex: 1,
      border: 'none',
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
      fontSize: '12px',
      outline: 'none',
      minWidth: 0,
      '&::placeholder': {
        color: theme.colors.text.disabled,
      },
    }),
    clearButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '18px',
      height: '18px',
      border: 'none',
      borderRadius: '3px',
      backgroundColor: 'transparent',
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.15s ease',
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
        color: theme.colors.text.primary,
      },
    }),
    suggestionsDropdown: css({
      position: 'absolute',
      ...(isBottomPosition ? {
        bottom: 'calc(100% - 4px)',
      } : {
        top: 'calc(100% - 4px)',
      }),
      left: theme.spacing(1),
      right: theme.spacing(1),
      backgroundColor: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.medium}`,
      borderRadius: '6px',
      boxShadow: theme.shadows.z3,
      zIndex: 1000,
      animation: `${isBottomPosition ? fadeInUp : fadeIn} 0.15s ease-out`,
      overflow: 'hidden',
    }),
    suggestionsHeader: css({
      padding: theme.spacing(0.5, 1),
      fontSize: '10px',
      fontWeight: 600,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      backgroundColor: theme.colors.background.secondary,
    }),
    suggestionsList: css({
      listStyle: 'none',
      margin: 0,
      padding: theme.spacing(0.25),
      maxHeight: '140px',
      overflowY: 'auto',
    }),
    suggestionItem: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing(0.5, 0.75),
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.1s ease',
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
      },
    }),
    suggestionItemSelected: css({
      backgroundColor: theme.colors.primary.transparent,
      '&:hover': {
        backgroundColor: theme.colors.primary.transparent,
      },
    }),
    suggestionText: css({
      fontSize: '12px',
      color: theme.colors.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    suggestionCount: css({
      fontSize: '10px',
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing(0, 0.5),
      borderRadius: '8px',
      marginLeft: theme.spacing(0.5),
      flexShrink: 0,
    }),
    highlight: css({
      backgroundColor: theme.colors.warning.transparent,
      color: theme.colors.warning.text,
      fontWeight: 600,
      borderRadius: '2px',
      padding: '0 1px',
    }),
    suggestionsFooter: css({
      padding: theme.spacing(0.5, 1),
      borderTop: `1px solid ${theme.colors.border.weak}`,
      backgroundColor: theme.colors.background.secondary,
    }),
    keyboardHint: css({
      fontSize: '9px',
      color: theme.colors.text.disabled,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.25),
      '& kbd': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '14px',
        height: '14px',
        padding: '0 2px',
        backgroundColor: theme.colors.background.canvas,
        border: `1px solid ${theme.colors.border.medium}`,
        borderRadius: '3px',
        fontSize: '9px',
        fontWeight: 500,
        fontFamily: 'inherit',
      },
    }),
    statusBar: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(0.5),
      padding: theme.spacing(0.5, 1),
      backgroundColor: theme.colors.success.transparent,
      borderTop: `1px solid ${theme.colors.success.border}`,
      borderRadius: '0 0 8px 8px',
    }),
    statusContent: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      flex: 1,
      minWidth: 0,
    }),
    statusIcon: css({
      color: theme.colors.success.text,
      flexShrink: 0,
      fontSize: '12px',
    }),
    statusText: css({
      fontSize: '10px',
      color: theme.colors.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      '& strong': {
        fontWeight: 600,
      },
    }),
    clearAllButton: css({
      border: 'none',
      backgroundColor: 'transparent',
      color: theme.colors.text.link,
      fontSize: '10px',
      fontWeight: 500,
      cursor: 'pointer',
      padding: theme.spacing(0.25, 0.5),
      borderRadius: '3px',
      flexShrink: 0,
      transition: 'all 0.15s ease',
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
        textDecoration: 'underline',
      },
    }),
    minimizedButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
      boxShadow: `0 2px 10px rgba(0, 0, 0, 0.12), 0 0 0 1px ${theme.colors.border.weak}`,
      cursor: 'pointer',
      pointerEvents: 'auto',
      transition: 'all 0.2s ease',
      position: 'relative',
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: `0 4px 14px rgba(0, 0, 0, 0.15), 0 0 0 1px ${theme.colors.border.medium}`,
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
    }),
    minimizedDot: css({
      position: 'absolute',
      top: '6px',
      right: '6px',
      width: '8px',
      height: '8px',
      backgroundColor: theme.colors.success.main,
      borderRadius: '50%',
      border: `2px solid ${theme.colors.background.primary}`,
      animation: `${pulse} 2s ease-in-out infinite`,
    }),
  };
};
