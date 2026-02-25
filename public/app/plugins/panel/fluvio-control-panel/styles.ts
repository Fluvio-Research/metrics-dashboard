import { css, keyframes } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

import { DisplayMode, PanelTheme } from './panelcfg.gen';

// Keyframe animations
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(99, 179, 237, 0.3); }
  50% { box-shadow: 0 0 15px rgba(99, 179, 237, 0.6); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const getStyles = (
  theme: GrafanaTheme2,
  displayMode: DisplayMode,
  panelTheme: PanelTheme,
  borderRadius: number,
  padding: number,
  opacity: number
) => {
  const isDark = theme.isDark;
  
  // Theme-specific styles
  const getThemeStyles = () => {
    switch (panelTheme) {
      case PanelTheme.Glass:
        return {
          background: isDark
            ? `rgba(30, 41, 59, ${opacity / 100})`
            : `rgba(255, 255, 255, ${opacity / 100})`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        };
      case PanelTheme.Gradient:
        return {
          background: isDark
            ? `linear-gradient(135deg, rgba(59, 130, 246, ${opacity / 100}) 0%, rgba(147, 51, 234, ${opacity / 100}) 100%)`
            : `linear-gradient(135deg, rgba(96, 165, 250, ${opacity / 100}) 0%, rgba(167, 139, 250, ${opacity / 100}) 100%)`,
          backdropFilter: 'none',
          border: 'none',
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)',
        };
      case PanelTheme.Minimal:
        return {
          background: 'transparent',
          backdropFilter: 'none',
          border: 'none',
          boxShadow: 'none',
        };
      default:
        return {
          background: theme.colors.background.secondary,
          backdropFilter: 'none',
          border: `1px solid ${theme.colors.border.weak}`,
          boxShadow: theme.shadows.z1,
        };
    }
  };

  const themeStyles = getThemeStyles();

  return {
    // Main container
    container: css({
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      ...themeStyles,
      borderRadius: `${borderRadius}px`,
      padding: `${padding}px`,
      overflow: 'visible', // Changed from 'hidden' to allow dropdowns to escape
      transition: 'all 0.3s ease',
      animation: `${fadeIn} 0.3s ease-out`,
      // Removed position: relative and zIndex to avoid creating stacking context
      // This allows Portal-based dropdowns to render above other panels
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: panelTheme !== PanelTheme.Minimal ? `${themeStyles.boxShadow}, 0 4px 12px rgba(0, 0, 0, 0.1)` : 'none',
      },
    }),

    // Title section
    title: css({
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: panelTheme === PanelTheme.Gradient ? 'white' : theme.colors.text.primary,
      marginBottom: theme.spacing(1.5),
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      '& svg': {
        opacity: 0.8,
      },
    }),

    // Content wrapper
    content: css({
      flex: 1,
      display: 'flex',
      flexDirection: displayMode === DisplayMode.Vertical ? 'column' : 'row',
      flexWrap: displayMode === DisplayMode.Compact ? 'wrap' : 'nowrap',
      gap: theme.spacing(displayMode === DisplayMode.Compact ? 1 : 2),
      alignItems: displayMode === DisplayMode.Vertical ? 'stretch' : 'center',
      justifyContent: 'flex-start',
      overflow: 'visible', // Changed from 'auto' to allow dropdowns to escape
      // Removed position: relative to avoid creating stacking context
    }),

    // Section wrapper
    section: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),

    // Section label
    sectionLabel: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: panelTheme === PanelTheme.Gradient 
        ? 'rgba(255, 255, 255, 0.8)' 
        : theme.colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: theme.spacing(0.5),
    }),

    // Divider
    divider: css({
      width: displayMode === DisplayMode.Vertical ? '100%' : '1px',
      height: displayMode === DisplayMode.Vertical ? '1px' : '40px',
      background: panelTheme === PanelTheme.Gradient
        ? 'rgba(255, 255, 255, 0.2)'
        : theme.colors.border.weak,
      margin: displayMode === DisplayMode.Vertical 
        ? `${theme.spacing(1)} 0` 
        : `0 ${theme.spacing(2)}`,
    }),

    // Time picker wrapper
    timePickerWrapper: css({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(1),
      flexWrap: 'wrap',
    }),

    // Time range button
    timeRangeButton: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
      background: panelTheme === PanelTheme.Gradient
        ? 'rgba(255, 255, 255, 0.15)'
        : isDark 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.05)',
      border: panelTheme === PanelTheme.Gradient
        ? '1px solid rgba(255, 255, 255, 0.2)'
        : `1px solid ${theme.colors.border.weak}`,
      borderRadius: `${borderRadius}px`,
      cursor: 'pointer',
      color: panelTheme === PanelTheme.Gradient ? 'white' : theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      transition: 'all 0.2s ease',
      '&:hover': {
        background: panelTheme === PanelTheme.Gradient
          ? 'rgba(255, 255, 255, 0.25)'
          : isDark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.08)',
        transform: 'scale(1.02)',
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
    }),

    // Quick range buttons
    quickRangeContainer: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(0.5),
    }),

    quickRangeButton: css({
      padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
      fontSize: theme.typography.bodySmall.fontSize,
      background: panelTheme === PanelTheme.Gradient
        ? 'rgba(255, 255, 255, 0.1)'
        : 'transparent',
      border: panelTheme === PanelTheme.Gradient
        ? '1px solid rgba(255, 255, 255, 0.2)'
        : `1px solid ${theme.colors.border.weak}`,
      borderRadius: `${borderRadius - 2}px`,
      color: panelTheme === PanelTheme.Gradient ? 'white' : theme.colors.text.secondary,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        background: panelTheme === PanelTheme.Gradient
          ? 'rgba(255, 255, 255, 0.2)'
          : theme.colors.action.hover,
        color: panelTheme === PanelTheme.Gradient ? 'white' : theme.colors.text.primary,
        borderColor: theme.colors.primary.border,
      },
    }),

    quickRangeButtonActive: css({
      background: `${theme.colors.primary.main} !important`,
      color: `${theme.colors.primary.contrastText} !important`,
      borderColor: `${theme.colors.primary.main} !important`,
    }),

    // Control button (zoom, refresh)
    controlButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: panelTheme === PanelTheme.Gradient
        ? 'rgba(255, 255, 255, 0.1)'
        : 'transparent',
      border: panelTheme === PanelTheme.Gradient
        ? '1px solid rgba(255, 255, 255, 0.2)'
        : `1px solid ${theme.colors.border.weak}`,
      borderRadius: `${borderRadius}px`,
      color: panelTheme === PanelTheme.Gradient ? 'white' : theme.colors.text.secondary,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        background: panelTheme === PanelTheme.Gradient
          ? 'rgba(255, 255, 255, 0.2)'
          : theme.colors.action.hover,
        color: panelTheme === PanelTheme.Gradient ? 'white' : theme.colors.text.primary,
        transform: 'scale(1.1)',
      },
      '&:active': {
        transform: 'scale(0.95)',
      },
    }),

    refreshButtonSpinning: css({
      '& svg': {
        animation: 'spin 1s linear infinite',
      },
      '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
    }),

    // Variables filter wrapper
    variablesWrapper: css({
      display: 'flex',
      flexDirection: displayMode === DisplayMode.Vertical ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: theme.spacing(1.5),
      alignItems: displayMode === DisplayMode.Vertical ? 'stretch' : 'center',
    }),

    // Variable item
    variableItem: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      minWidth: '120px',
    }),

    variableItemCompact: css({
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(1),
      minWidth: 'auto',
    }),

    variableLabel: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: panelTheme === PanelTheme.Gradient 
        ? 'rgba(255, 255, 255, 0.8)' 
        : theme.colors.text.secondary,
    }),

    // Custom select styling
    selectWrapper: css({
      position: 'relative',
      '& .gf-form-select-box__control': {
        background: panelTheme === PanelTheme.Gradient
          ? 'rgba(255, 255, 255, 0.1) !important'
          : undefined,
        borderColor: panelTheme === PanelTheme.Gradient
          ? 'rgba(255, 255, 255, 0.2) !important'
          : undefined,
        borderRadius: `${borderRadius}px !important`,
        '&:hover': {
          borderColor: panelTheme === PanelTheme.Gradient
            ? 'rgba(255, 255, 255, 0.4) !important'
            : `${theme.colors.primary.border} !important`,
        },
      },
      '& .gf-form-select-box__single-value': {
        color: panelTheme === PanelTheme.Gradient
          ? 'white !important'
          : undefined,
      },
    }),

    // Loading shimmer effect
    loadingShimmer: css({
      background: `linear-gradient(
        90deg,
        ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 0%,
        ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 50%,
        ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 100%
      )`,
      backgroundSize: '200% 100%',
      animation: `${shimmer} 1.5s infinite`,
    }),

    // Empty state
    emptyState: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(3),
      color: theme.colors.text.secondary,
      textAlign: 'center',
      gap: theme.spacing(1),
    }),

    // Icon styling
    icon: css({
      color: panelTheme === PanelTheme.Gradient ? 'white' : theme.colors.text.secondary,
      opacity: 0.7,
    }),

    // Active state glow
    activeGlow: css({
      animation: `${pulseGlow} 2s ease-in-out infinite`,
    }),
  };
};












































