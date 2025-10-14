import { css } from '@emotion/css';
import { t } from '@grafana/i18n';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import store from 'app/core/store';
import { useState, useEffect } from 'react';

const FULL_HEIGHT_STORAGE_KEY = 'grafana.dashboard.fullheight';

export function FullWidthToggleButton() {
  const styles = useStyles2(getStyles);
  const [isFullHeight, setIsFullHeight] = useState(() => {
    // Default to true (full height enabled)
    const stored = store.get(FULL_HEIGHT_STORAGE_KEY);
    return stored !== undefined ? stored === 'true' : true;
  });

  // Set initial height on mount
  useEffect(() => {
    if (isFullHeight) {
      document.documentElement.style.setProperty('--grafana-dashboard-min-height', 'calc(100vh - 80px)');
    } else {
      document.documentElement.style.setProperty('--grafana-dashboard-min-height', 'auto');
    }
  }, [isFullHeight]);

  const handleToggle = () => {
    const newValue = !isFullHeight;
    setIsFullHeight(newValue);
    store.set(FULL_HEIGHT_STORAGE_KEY, String(newValue));
    
    // Apply height to document root for global access
    if (newValue) {
      document.documentElement.style.setProperty('--grafana-dashboard-min-height', 'calc(100vh - 80px)');
    } else {
      document.documentElement.style.setProperty('--grafana-dashboard-min-height', 'auto');
    }
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('fullHeightToggle', { detail: { isFullHeight: newValue } }));
  };

  return (
    <button
      className={styles.toggleButton}
      onClick={handleToggle}
      aria-label={
        isFullHeight
          ? t('dashboard.fullheight.disable', 'Disable full height')
          : t('dashboard.fullheight.enable', 'Enable full height')
      }
      title={isFullHeight ? 'Full Height: Enabled' : 'Full Height: Disabled'}
    >
      <div className={styles.iconContainer}>
        <Icon
          name="arrows-v"
          size="sm"
          className={`${styles.icon} ${styles.expandIcon} ${isFullHeight ? styles.activeIcon : ''}`}
        />
        <Icon
          name="minus"
          size="sm"
          className={`${styles.icon} ${styles.contractIcon} ${!isFullHeight ? styles.activeIcon : ''}`}
        />
      </div>
    </button>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;

  return {
    toggleButton: css({
      position: 'relative',
      width: 48,
      height: 28,
      borderRadius: 28,
      border: `2px solid ${isDark ? 'rgba(77, 172, 255, 0.3)' : 'rgba(77, 172, 255, 0.25)'}`,
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      padding: 0,
      overflow: 'hidden',

      '&:hover': {
        backgroundColor: isDark ? 'rgba(51, 65, 85, 0.9)' : 'rgba(226, 232, 240, 1)',
        borderColor: theme.colors.primary.main,
        transform: 'scale(1.05)',
        boxShadow: `0 4px 12px ${isDark ? 'rgba(77, 172, 255, 0.3)' : 'rgba(77, 172, 255, 0.25)'}`,
      },

      '&:active': {
        transform: 'scale(0.98)',
      },
    }),

    iconContainer: css({
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 4px',
    }),

    icon: css({
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 0.3,
      transform: 'scale(0.8)',
      filter: 'grayscale(1)',
    }),

    expandIcon: css({
      color: isDark ? 'rgba(34, 211, 238, 1)' : 'rgba(6, 182, 212, 1)',
    }),

    contractIcon: css({
      color: isDark ? 'rgba(251, 146, 60, 0.5)' : 'rgba(249, 115, 22, 0.5)',
    }),

    activeIcon: css({
      opacity: 1,
      transform: 'scale(1.1)',
      filter: 'grayscale(0) drop-shadow(0 0 4px currentColor)',
      animation: 'pulse 2s ease-in-out infinite',

      '@keyframes pulse': {
        '0%, 100%': {
          opacity: 1,
        },
        '50%': {
          opacity: 0.85,
        },
      },
    }),
  };
};

