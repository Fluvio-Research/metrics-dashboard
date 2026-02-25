import { css } from '@emotion/css';
import { t } from '@grafana/i18n';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2, useTheme2 } from '@grafana/ui';
import { changeTheme } from 'app/core/services/theme';

export function ThemeToggleButton() {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const isDark = theme.isDark;

  const handleToggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    await changeTheme(newTheme);
  };

  return (
    <button
      className={styles.toggleButton}
      onClick={handleToggleTheme}
      aria-label={isDark ? t('theme.toggle.light', 'Switch to light mode') : t('theme.toggle.dark', 'Switch to dark mode')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className={styles.iconContainer}>
        <Icon name="star" size="sm" className={`${styles.icon} ${styles.sunIcon} ${!isDark ? styles.activeIcon : ''}`} />
        <Icon name="circle-mono" size="sm" className={`${styles.icon} ${styles.moonIcon} ${isDark ? styles.activeIcon : ''}`} />
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
    
    sunIcon: css({
      color: isDark ? 'rgba(251, 191, 36, 0.5)' : 'rgba(251, 191, 36, 1)',
    }),
    
    moonIcon: css({
      color: isDark ? 'rgba(147, 197, 253, 1)' : 'rgba(100, 116, 139, 0.5)',
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

