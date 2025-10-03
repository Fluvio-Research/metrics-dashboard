import { css, cx } from '@emotion/css';
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { usePopper } from 'react-popper';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';
import { getInputStyles, Icon, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { useMediaQueryMinWidth } from 'app/core/hooks/useMediaQueryMinWidth';
import { getModKey } from 'app/core/utils/browser';
import { getGrafanaSearcher } from 'app/features/search/service/searcher';

import { NavToolbarSeparator } from '../NavToolbar/NavToolbarSeparator';

interface SearchResult {
  uid: string;
  title: string;
  url: string;
  type: 'dashboard' | 'folder';
  tags?: string[];
  description?: string;
  lastModified?: string;
  starred?: boolean;
}

export const TopSearchBarDropdown = React.memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, update } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 4],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 8,
        },
      },
    ],
  });

  const isLargeScreen = useMediaQueryMinWidth('lg');
  const theme = useTheme2();
  const isNonAdminUser = !(contextSrv.user.isGrafanaAdmin || contextSrv.hasRole('Admin'));
  const useMapsLayout = isNonAdminUser;
  const isFluvioTheme = false; // Set to false for now, can be configured later
  const componentStyles = useStyles2(getStyles, theme.isDark, useMapsLayout, isFluvioTheme);
  const placeholderText = useMapsLayout
    ? t('nav.search.placeholderModern', 'Search dashboards, data, or destinations...')
    : false
    ? t('nav.search.placeholderFluvio', 'Search dashboards and resources...')
    : t('nav.search.placeholderCommandPalette', 'Search...');
  const loadingText = useMapsLayout
    ? t('search.findingBestMatches', 'Finding the best matches...')
    : false
    ? t('search.searchingResources', 'Searching resources...')
    : t('search.searching', 'Searching...');
  const noResultsText = useMapsLayout
    ? t('search.noMatchingDashboards', 'No matching dashboards or resources')
    : false
    ? t('search.noResourcesFound', 'No resources found')
    : t('search.no-results', 'No results found');

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searcher = getGrafanaSearcher();
      const response = await searcher.search({
        query: query,
        limit: 10,
        kind: ['dashboard', 'folder'],
      });

      const results: SearchResult[] = response.view.map((item) => ({
        uid: item.uid,
        title: item.name,
        url: item.url,
        type: item.kind === 'folder' ? 'folder' : 'dashboard',
        tags: item.tags,
        description: (item as any).description || '',
        lastModified: (item as any).updated || '',
        starred: (item as any).starred || false,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    const debounced = (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => performSearch(query), 300);
    };
    
    // Add cleanup function to the debounced function
    debounced.cleanup = () => clearTimeout(timeoutId);
    
    return debounced;
  }, [performSearch]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedSearch.cleanup) {
        debouncedSearch.cleanup();
      }
    };
  }, [debouncedSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setIsOpen(true);
      debouncedSearch(value);
    } else {
      setIsOpen(false);
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const handleInputFocus = useCallback(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setIsOpen(true);
    }
  }, [searchQuery, searchResults.length]);

  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Don't close if clicking on dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => setIsOpen(false), 150);
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    // Add to recent searches
    const newRecentSearches = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('grafana-recent-searches', JSON.stringify(newRecentSearches));
    
    locationService.push(result.url);
    setIsOpen(false);
    setSearchQuery('');
    searchInputRef.current?.blur();
  }, [recentSearches]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleResultClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  }, [isOpen, selectedIndex, searchResults, handleResultClick]);

  // Load recent searches on mount
  useEffect(() => {
    const stored = localStorage.getItem('grafana-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  // Voice search functionality
  const startVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsOpen(true);
      debouncedSearch(transcript);
    };
    
    recognition.onerror = () => {
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  }, [debouncedSearch]);

  // Check for voice search support
  useEffect(() => {
    setShowVoiceSearch('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Update popper position when dropdown opens
  useEffect(() => {
    if (isOpen && update) {
      update();
    }
  }, [isOpen, update]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        referenceElement &&
        !referenceElement.contains(event.target as Node) &&
        popperElement &&
        !popperElement.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {}; // Return empty cleanup function when not open
  }, [isOpen, referenceElement, popperElement]);

  if (!isLargeScreen) {
    return (
      <>
        <button
          className={componentStyles.smallScreenButton}
          onClick={() => locationService.push('/dashboards')}
          aria-label={t('nav.search.placeholderCommandPalette', 'Search...')}
        >
          <Icon name="search" />
        </button>
        <NavToolbarSeparator />
      </>
    );
  }

  const modKey = getModKey();

  return (
    <div className={componentStyles.container}>
      <div
        ref={setReferenceElement}
        className={cx(
          componentStyles.wrapper,
          useMapsLayout && componentStyles.mapsWrapper
        )}
        data-testid={selectors.components.NavToolbar.commandPaletteTrigger}
      >
        <div className={componentStyles.inputWrapper}>
          <div className={componentStyles.prefix}>
            <Icon name="search" />
          </div>

          <input
            ref={searchInputRef}
            className={cx(componentStyles.input, {
              [componentStyles.mapsInput]: useMapsLayout,
            })}
            placeholder={placeholderText}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />

          <div className={componentStyles.suffix}>
            {showVoiceSearch && useMapsLayout && (
              <button
                className={componentStyles.voiceButton}
                onClick={startVoiceSearch}
                disabled={isListening}
                title="Voice search"
                aria-label="Start voice search"
              >
                <Icon name={isListening ? 'spinner' : 'search'} className={isListening ? 'fa-spin' : ''} />
              </button>
            )}
            <Text variant="bodySmall">{`${modKey}+k`}</Text>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          ref={setPopperElement}
          style={styles.popper}
          className={cx(
            componentStyles.dropdown,
            useMapsLayout && componentStyles.mapsDropdown
          )}
        >
          <div ref={dropdownRef} className={componentStyles.dropdownContent}>
            {isLoading ? (
              <div className={componentStyles.loadingItem}>
                <Icon name="spinner" className="fa-spin" />
                <Text>{loadingText}</Text>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                {useMapsLayout && (
                  <div className={componentStyles.resultsHeader}>
                    <Text variant="bodySmall">Search Results</Text>
                    <Text variant="bodySmall">{searchResults.length} found</Text>
                  </div>
                )}
                <div className={cx(
                  componentStyles.resultsGrid,
                  useMapsLayout && componentStyles.mapsResultsGrid
                )}>
                  {searchResults.map((result, index) => (
                    <button
                      key={result.uid}
                      className={cx(
                        componentStyles.resultItem,
                        index === selectedIndex && componentStyles.selectedItem,
                        useMapsLayout && componentStyles.mapsResultItem
                      )}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={componentStyles.resultIcon}>
                        <Icon name={result.type === 'folder' ? 'folder' : 'apps'} />
                        {result.starred && useMapsLayout && (
                          <div className={componentStyles.starredBadge}>
                            <Icon name="star" />
                          </div>
                        )}
                      </div>
                      <div className={componentStyles.resultContent}>
                        <div className={componentStyles.resultTitle}>{result.title}</div>
                        {result.description && useMapsLayout && (
                          <div className={componentStyles.resultDescription}>
                            {result.description}
                          </div>
                        )}
                        <div className={cx(
                          componentStyles.resultType,
                          useMapsLayout && componentStyles.mapsResultType
                        )}>
                          {false
                            ? (result.type === 'folder' ? 'Resource Folder' : 'Analytics Dashboard')
                            : (result.type === 'folder' ? 'Folder' : 'Dashboard')
                          }
                        </div>
                      </div>
                      {useMapsLayout && (
                        <div className={componentStyles.resultActions}>
                          <Icon name="external-link-alt" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : searchQuery.trim() ? (
              <div className={componentStyles.noResults}>
                <Icon name="search" />
                <Text>{noResultsText}</Text>
                {useMapsLayout && recentSearches.length > 0 && (
                  <div className={componentStyles.recentSearches}>
                    <Text variant="bodySmall">Recent searches:</Text>
                    <div className={componentStyles.recentSearchesList}>
                      {recentSearches.slice(0, 3).map((search, index) => (
                        <button
                          key={index}
                          className={componentStyles.recentSearchItem}
                          onClick={() => {
                            setSearchQuery(search);
                            debouncedSearch(search);
                          }}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
});

const getStyles = (
  theme: GrafanaTheme2,
  isDarkMode: boolean,
  useMapsLayout: boolean = false,
  isFluvioTheme: boolean = false
) => {
  const baseStyles = getInputStyles({ theme });
  const mapsSurface = isDarkMode ? 'rgba(30, 41, 59, 0.95)' : '#FFFFFF';
  const mapsBorder = isDarkMode ? 'rgba(148, 163, 184, 0.32)' : 'rgba(15, 23, 42, 0.12)';
  const mapsShadow = isDarkMode
    ? '0 20px 36px rgba(7, 12, 23, 0.6)'
    : '0 22px 36px rgba(15, 23, 42, 0.15)';
  const mapsText = isDarkMode ? 'rgba(226, 232, 240, 0.92)' : 'rgba(15, 23, 42, 0.9)';
  const mapsPlaceholder = isDarkMode ? 'rgba(148, 163, 184, 0.75)' : 'rgba(100, 116, 139, 0.8)';

  return {
    container: css({
      position: 'relative',
      width: 'auto',
      minWidth: 140,
      maxWidth: useMapsLayout ? 680 : 350,
      flexGrow: useMapsLayout ? 1 : 0,
    }),

    wrapper: cx(
      baseStyles.wrapper,
      css({
        width: '100%',
      })
    ),

    fluvioWrapper: css({
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.shape.radius.default,
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'background-color, border-color, box-shadow',
        transitionDuration: '160ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      '&:focus-within': {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)',
      },
    }),

    mapsWrapper: css({
      position: 'relative',
      borderRadius: theme.shape.radius.pill,
      border: `1px solid ${mapsBorder}`,
      backgroundColor: mapsSurface,
      boxShadow: mapsShadow,
      padding: theme.spacing(0.25),
      overflow: 'hidden',
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'box-shadow, border-color',
        transitionDuration: '160ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&::before': {
        content: "''",
        position: 'absolute',
        inset: 0,
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.12), rgba(41, 121, 255, 0.08))'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
        pointerEvents: 'none',
      },
      '&:hover': {
        boxShadow: isDarkMode
          ? '0 24px 48px rgba(7, 12, 23, 0.72)'
          : '0 28px 48px rgba(15, 23, 42, 0.22)',
      },
      '&:focus-within': {
        borderColor: isDarkMode ? 'rgba(96, 165, 250, 0.5)' : theme.colors.primary.border,
        boxShadow: `0 0 0 3px ${isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.22)'}`,
      },
    }),

    inputWrapper: baseStyles.inputWrapper,

    prefix: css([
      baseStyles.prefix,
      isFluvioTheme && !useMapsLayout && {
        '& svg': {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
      useMapsLayout && {
        paddingLeft: theme.spacing(1.5),
        '& svg': {
          color: mapsPlaceholder,
          fontSize: 18,
          position: 'relative',
          zIndex: 1,
        },
        '&::before': {
          content: "''",
          position: 'absolute',
          inset: theme.spacing(0.5),
          borderRadius: theme.shape.radius.circle,
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(226, 232, 240, 0.9)',
          boxShadow: `0 4px 12px ${isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(148, 163, 184, 0.35)'}`,
          pointerEvents: 'none',
        },
        position: 'relative',
      },
    ]),

    suffix: css([
      baseStyles.suffix,
      {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
      },
      isFluvioTheme && !useMapsLayout && {
        '& span': {
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '13px',
        },
      },
      useMapsLayout && {
        paddingRight: theme.spacing(1.25),
        '& span': {
          color: mapsPlaceholder,
          fontSize: '12px',
          letterSpacing: 0.3,
          position: 'relative',
          zIndex: 1,
        },
        '&::before': {
          content: "''",
          position: 'absolute',
          inset: theme.spacing(0.5),
          borderRadius: theme.shape.radius.circle,
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(226, 232, 240, 0.75)',
          pointerEvents: 'none',
        },
        position: 'relative',
      },
    ]),

    voiceButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(0.5),
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: theme.shape.radius.circle,
      color: mapsPlaceholder,
      cursor: 'pointer',
      position: 'relative',
      zIndex: 1,
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'color, transform',
        transitionDuration: '140ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&:hover': {
        color: mapsText,
        transform: 'scale(1.1)',
      },
      '&:disabled': {
        opacity: 0.6,
        cursor: 'not-allowed',
      },
      '& svg': {
        fontSize: 14,
      },
    }),

    input: css([
      baseStyles.input,
      {
        textAlign: 'left',
        paddingLeft: 28,
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        '&:focus': {
          outline: 'none',
          boxShadow: 'none',
        },
      },
    ]),

    fluvioInput: css({
      color: 'rgba(255, 255, 255, 0.9)',
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.6)',
      },
    }),

    mapsInput: css({
      fontSize: '1rem',
      fontWeight: theme.typography.fontWeightMedium,
      color: mapsText,
      paddingLeft: theme.spacing(4.5),
      paddingRight: theme.spacing(4),
      height: 44,
      lineHeight: '22px',
      '&::placeholder': {
        color: mapsPlaceholder,
        fontWeight: theme.typography.fontWeightRegular,
      },
    }),

    dropdown: css({
      backgroundColor: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      boxShadow: theme.shadows.z3,
      zIndex: 1000,
      minWidth: '300px',
      maxWidth: '500px',
      maxHeight: '400px',
      overflow: 'hidden',
    }),

    fluvioDropdown: css({
      backgroundColor: '#2A5A85',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }),

    mapsDropdown: css({
      backgroundColor: mapsSurface,
      borderColor: mapsBorder,
      boxShadow: mapsShadow,
      borderRadius: theme.shape.radius.default,
      backdropFilter: 'blur(18px)',
      overflow: 'hidden',
      minWidth: 420,
      maxWidth: 680,
    }),

    resultsHeader: css({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing(1.5, 2, 1, 2),
      borderBottom: `1px solid ${mapsBorder}`,
      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(248, 250, 252, 0.8)',
      '& span:first-of-type': {
        color: mapsText,
        fontWeight: theme.typography.fontWeightMedium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: '0.75rem',
      },
      '& span:last-of-type': {
        color: mapsPlaceholder,
        fontSize: '0.7rem',
      },
    }),

    resultsGrid: css({
      display: 'flex',
      flexDirection: 'column',
    }),

    mapsResultsGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: theme.spacing(0.75),
      padding: theme.spacing(1),
    }),

    dropdownContent: css({
      maxHeight: '400px',
      overflowY: 'auto',
    }),

    resultItem: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.5, 2),
      width: '100%',
      border: 'none',
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
      cursor: 'pointer',
      textAlign: 'left',
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
      },
      '&:last-child': {
        borderBottom: 'none',
      },
    }),

    fluvioResultItem: css({
      color: '#FFFFFF',
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      '& svg': {
        color: 'rgba(255, 255, 255, 0.8)',
      },
    }),

    mapsResultItem: css({
      borderBottomColor: mapsBorder,
      color: mapsText,
      borderRadius: theme.shape.radius.default,
      margin: 0,
      padding: theme.spacing(1.5),
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: theme.spacing(1.25),
      alignItems: 'flex-start',
      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.6)',
      border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.8)'}`,
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'background-color, box-shadow, transform, border-color',
        transitionDuration: '180ms',
        transitionTimingFunction: theme.transitions.easing.easeOut,
      },
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.12)' : 'rgba(59, 130, 246, 0.08)',
        borderColor: isDarkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.25)',
        boxShadow: isDarkMode
          ? '0 16px 32px rgba(15, 23, 42, 0.25)'
          : '0 18px 36px rgba(59, 130, 246, 0.15)',
        transform: 'translateY(-2px)',
      },
    }),

    resultIcon: css({
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: theme.shape.radius.default,
      backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)',
      '& svg': {
        color: isDarkMode ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)',
        fontSize: 18,
      },
    }),

    starredBadge: css({
      position: 'absolute',
      top: -4,
      right: -4,
      width: 16,
      height: 16,
      borderRadius: theme.shape.radius.circle,
      backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.9)' : 'rgba(245, 158, 11, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '& svg': {
        fontSize: 10,
        color: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF',
      },
    }),

    resultDescription: css({
      fontSize: '0.8rem',
      color: mapsPlaceholder,
      lineHeight: 1.3,
      marginTop: theme.spacing(0.25),
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    }),

    resultActions: css({
      display: 'flex',
      alignItems: 'center',
      opacity: 0,
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'opacity',
        transitionDuration: '160ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
        'button:hover &': {
          opacity: 1,
        },
      '& svg': {
        fontSize: 14,
        color: mapsPlaceholder,
      },
    }),

    selectedItem: css({
      backgroundColor: theme.colors.action.selected,
      ...(isFluvioTheme && !useMapsLayout && {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
      }),
      ...(useMapsLayout && {
        backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.16)' : 'rgba(59, 130, 246, 0.12)',
        boxShadow: '0 12px 20px rgba(15, 23, 42, 0.12)',
      }),
    }),

    resultContent: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
      flex: 1,
      minWidth: 0,
    }),

    resultTitle: css({
      fontWeight: theme.typography.fontWeightMedium,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: theme.typography.bodySmall.lineHeight,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),

    resultType: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      ...(isFluvioTheme && !useMapsLayout && {
        color: 'rgba(255, 255, 255, 0.7)',
      }),
    }),

    mapsResultType: css({
      color: mapsPlaceholder,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    }),

    loadingItem: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(2),
      color: theme.colors.text.secondary,
      ...(isFluvioTheme && !useMapsLayout && {
        color: 'rgba(255, 255, 255, 0.8)',
      }),
      ...(useMapsLayout && {
        color: mapsPlaceholder,
      }),
    }),

    noResults: css({
      padding: theme.spacing(3, 2),
      textAlign: 'center',
      color: theme.colors.text.secondary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
      ...(isFluvioTheme && !useMapsLayout && {
        color: 'rgba(255, 255, 255, 0.7)',
      }),
      ...(useMapsLayout && {
        color: mapsPlaceholder,
        '& svg': {
          fontSize: 32,
          opacity: 0.4,
          marginBottom: theme.spacing(0.5),
        },
      }),
    }),

    recentSearches: css({
      marginTop: theme.spacing(2),
      padding: theme.spacing(1.5),
      borderRadius: theme.shape.radius.default,
      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      border: `1px solid ${mapsBorder}`,
      '& span:first-of-type': {
        fontSize: '0.75rem',
        fontWeight: theme.typography.fontWeightMedium,
        color: mapsText,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing(0.75),
        display: 'block',
      },
    }),

    recentSearchesList: css({
      display: 'flex',
      gap: theme.spacing(0.5),
      flexWrap: 'wrap',
    }),

    recentSearchItem: css({
      padding: theme.spacing(0.5, 1),
      backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.8)',
      border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.3)'}`,
      borderRadius: theme.shape.radius.pill,
      fontSize: '0.75rem',
      color: mapsText,
      cursor: 'pointer',
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'background-color, border-color',
        transitionDuration: '140ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(59, 130, 246, 0.15)',
        borderColor: isDarkMode ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.4)',
      },
    }),

    smallScreenButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(1),
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: theme.shape.radius.default,
      color: theme.colors.text.primary,
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
      },
      ...(isFluvioTheme && !useMapsLayout && {
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      }),
      ...(useMapsLayout && {
        borderRadius: theme.shape.radius.pill,
        border: `1px solid ${mapsBorder}`,
        color: mapsText,
        '&:hover': {
          backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.08)',
        },
      }),
    }),
  };
};

TopSearchBarDropdown.displayName = 'TopSearchBarDropdown';
