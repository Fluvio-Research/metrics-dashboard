import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Icon, useStyles2 } from '@grafana/ui';

import { Breadcrumbs } from '../../Breadcrumbs/Breadcrumbs';
import { Breadcrumb } from '../../Breadcrumbs/types';
import { HistoryContainer } from '../History/HistoryContainer';
import { ThemeToggleButton } from '../TopBar/ThemeToggleButton';
import { FullWidthToggleButton } from '../TopBar/FullWidthToggleButton';
import { SidebarSearch } from './SidebarSearch';

interface ControlsSectionProps {
  breadcrumbs?: Breadcrumb[];
  onToggleKioskMode?: () => void;
}

export function ControlsSection({
  breadcrumbs,
  onToggleKioskMode,
}: ControlsSectionProps) {
  const styles = useStyles2(getStyles);
  const unifiedHistoryEnabled = config.featureToggles.unifiedHistory;

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <Icon name="sliders-v-alt" size="xs" />
        <span className={styles.sectionTitle}>{t('navigation.controls', 'Controls')}</span>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className={styles.breadcrumbsContainer}>
          <Breadcrumbs breadcrumbs={breadcrumbs} className={styles.breadcrumbs} />
        </div>
      )}

      {/* Sidebar Search */}
      <div className={styles.searchWrapper}>
        <SidebarSearch />
      </div>

      {/* Action Items - Compact Grid Layout */}
      <div className={styles.actionGrid}>
        <div className={styles.utilityButtonsRow}>
          {unifiedHistoryEnabled && (
            <div className={styles.gridItem} title="History">
              <HistoryContainer />
            </div>
          )}

          <div className={styles.gridItem} title="Dashboard Height">
            <FullWidthToggleButton />
          </div>

          <div className={styles.gridItem} title="Theme Toggle">
            <ThemeToggleButton />
          </div>

          {/* Kiosk Mode Icon Button */}
          {onToggleKioskMode && (
            <div className={styles.gridItem} title="Enable kiosk mode">
              <button
                onClick={onToggleKioskMode}
                aria-label="Enable kiosk mode"
                className={styles.iconButton}
              >
                <Icon name="monitor" />
              </button>
            </div>
          )}

          {/* Change Password Icon Button */}
          <div className={styles.gridItem} title="Change password">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.assign(`${config.appSubUrl}/profile/password`);
                }
              }}
              aria-label="Change password"
              className={styles.iconButton}
            >
              <Icon name="lock" />
            </button>
          </div>
        </div>

        {/* Logout Button */}
        {!config.auth.disableSignoutMenu && (
          <div className={styles.logoutButton} title="Logout">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.assign(`${config.appSubUrl}/logout`);
                }
              }}
              aria-label="Logout"
              className={styles.logoutButtonInner}
            >
              <Icon name="signout" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;
 
  return {
    container: css({
      padding: theme.spacing(0.5, 0.75),
      marginBottom: theme.spacing(0.75),
      borderRadius: theme.shape.radius.default,
      background: isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)'}`,
      boxShadow: isDark
        ? '0 1px 4px rgba(0, 0, 0, 0.15)'
        : '0 1px 2px rgba(15, 23, 42, 0.04)',
      position: 'relative',
      overflow: 'visible',
    }),

    sectionHeader: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      marginBottom: theme.spacing(0.5),
      paddingBottom: theme.spacing(0.375),
      borderBottom: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.05)'}`,
    }),

    sectionTitle: css({
      fontSize: '9px',
      fontWeight: 600,
      color: isDark ? 'rgba(226, 232, 240, 0.85)' : 'rgba(15, 23, 42, 0.8)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }),

    breadcrumbsContainer: css({
      marginBottom: theme.spacing(0.5),
      padding: theme.spacing(0.375, 0.5),
      borderRadius: theme.shape.radius.default,
      background: isDark ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.6)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.05)'}`,
    }),

    breadcrumbs: css({
      fontSize: '9px',
 
      '& ol': {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: theme.spacing(0.25),
        margin: 0,
        padding: 0,
        listStyle: 'none',
      },
 
      '& li': {
        fontSize: '9px',
        color: isDark ? 'rgba(226, 232, 240, 0.8)' : 'rgba(15, 23, 42, 0.75)',
      },
 
      '& a': {
        color: isDark ? 'rgba(147, 197, 253, 0.9)' : 'rgba(59, 130, 246, 0.9)',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
 
        '&:hover': {
          color: theme.colors.primary.main,
          textDecoration: 'underline',
        },
      },
 
      '& svg': {
        color: isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)',
        fontSize: 8,
      },
    }),

    searchWrapper: css({
      marginBottom: theme.spacing(0.5),
      
      '& input': {
        fontSize: '10px',
        padding: `${theme.spacing(0.375)} ${theme.spacing(0.75)}`,
        height: '24px',
        minHeight: 'unset',
      },
      
      '& button': {
        padding: theme.spacing(0.375),
        minHeight: '24px',
        height: '24px',
        
        '& svg': {
          width: '12px',
          height: '12px',
        },
      },
      
      '& > div': {
        minHeight: 'unset',
      },
    }),

    actionGrid: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      position: 'relative',
    }),

    utilityButtonsRow: css({
      display: 'flex',
      gap: theme.spacing(0.375),
      justifyContent: 'center',
      alignItems: 'center',
    }),

    gridItem: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(0.375),
      borderRadius: theme.shape.radius.default,
      background: isDark ? 'rgba(17, 24, 39, 0.3)' : 'rgba(255, 255, 255, 0.5)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(15, 23, 42, 0.04)'}`,
      transition: 'all 0.15s ease',
      cursor: 'pointer',
      position: 'relative',
      zIndex: 1,
      minHeight: '24px',

      '& button': {
        padding: `${theme.spacing(0.25)} ${theme.spacing(0.375)}`,
        fontSize: '10px',
        minHeight: 'unset',
        height: '20px',
        
        '& svg': {
          width: '12px',
          height: '12px',
        },
      },

      '&:hover': {
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark ? 'rgba(77, 172, 255, 0.3)' : 'rgba(77, 172, 255, 0.25)',
        transform: 'translateY(-1px)',
        boxShadow: isDark
          ? '0 2px 4px rgba(0, 0, 0, 0.2)'
          : '0 1px 3px rgba(15, 23, 42, 0.1)',
        zIndex: 1000,
      },

      '&:active': {
        transform: 'translateY(0)',
      },
    }),

    iconButton: css({
      all: 'unset',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      cursor: 'pointer',
      padding: `${theme.spacing(0.25)} ${theme.spacing(0.375)}`,
      fontSize: '10px',
      minHeight: 'unset',
      
      '& svg': {
        width: '12px',
        height: '12px',
        color: isDark ? 'rgba(147, 197, 253, 0.9)' : 'rgba(59, 130, 246, 0.9)',
        transition: 'all 0.15s ease',
      },

      '&:hover svg': {
        color: isDark ? 'rgba(147, 197, 253, 1)' : 'rgba(37, 99, 235, 1)',
        transform: 'scale(1.1)',
      },

      '&:active svg': {
        transform: 'scale(0.95)',
      },
    }),

    logoutButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
    }),

    logoutButtonInner: css({
      all: 'unset',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(0.5),
      width: '100%',
      padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      
      // Elegant gradient background
      background: isDark
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.18) 100%)'
        : 'linear-gradient(135deg, rgba(254, 226, 226, 0.8) 0%, rgba(254, 202, 202, 0.9) 100%)',
      
      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(220, 38, 38, 0.3)'}`,
      boxShadow: isDark
        ? '0 1px 2px rgba(220, 38, 38, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        : '0 1px 2px rgba(220, 38, 38, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      // Subtle shine effect
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        transition: 'left 0.5s ease',
        pointerEvents: 'none',
      },
      
      '&:hover': {
        background: isDark
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.28) 100%)'
          : 'linear-gradient(135deg, rgba(254, 202, 202, 1) 0%, rgba(252, 165, 165, 1) 100%)',
        
        borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.5)',
        transform: 'translateY(-1px)',
        boxShadow: isDark
          ? '0 3px 8px rgba(220, 38, 38, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 2px 6px rgba(220, 38, 38, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
        
        '&::before': {
          left: '100%',
        },
        
        '& svg': {
          transform: 'translateX(1px)',
        },
      },
      
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: isDark
          ? '0 1px 2px rgba(220, 38, 38, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1)'
          : '0 1px 2px rgba(220, 38, 38, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.05)',
      },
      
      '& svg': {
        width: '12px',
        height: '12px',
        flexShrink: 0,
        color: isDark ? 'rgba(254, 202, 202, 1)' : 'rgba(153, 27, 27, 1)',
        filter: isDark 
          ? 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))' 
          : 'drop-shadow(0 0.5px 0.5px rgba(153, 27, 27, 0.3))',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      '& span': {
        fontSize: '10px',
        fontWeight: 600,
        color: isDark ? 'rgba(254, 202, 202, 1)' : 'rgba(153, 27, 27, 1)',
        textShadow: isDark 
          ? '0 1px 1px rgba(0, 0, 0, 0.2)' 
          : '0 0.5px 0.5px rgba(153, 27, 27, 0.2)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      },
    }),

    actionButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
    }),

    actionButtonInner: css({
      all: 'unset',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(0.5),
      width: '100%',
      padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      
      // Blue gradient background for action buttons
      background: isDark
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.18) 100%)'
        : 'linear-gradient(135deg, rgba(219, 234, 254, 0.8) 0%, rgba(191, 219, 254, 0.9) 100%)',
      
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.3)'}`,
      boxShadow: isDark
        ? '0 1px 2px rgba(37, 99, 235, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        : '0 1px 2px rgba(37, 99, 235, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      '&:hover': {
        background: isDark
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.28) 100%)'
          : 'linear-gradient(135deg, rgba(191, 219, 254, 1) 0%, rgba(147, 197, 253, 1) 100%)',
        
        borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.5)',
        transform: 'translateY(-1px)',
        boxShadow: isDark
          ? '0 3px 8px rgba(37, 99, 235, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 2px 6px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
        
        '& svg': {
          transform: 'translateX(1px)',
        },
      },
      
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: isDark
          ? '0 1px 2px rgba(37, 99, 235, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1)'
          : '0 1px 2px rgba(37, 99, 235, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.05)',
      },
      
      '& svg': {
        width: '12px',
        height: '12px',
        flexShrink: 0,
        color: isDark ? 'rgba(147, 197, 253, 1)' : 'rgba(29, 78, 216, 1)',
        filter: isDark 
          ? 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))' 
          : 'drop-shadow(0 0.5px 0.5px rgba(29, 78, 216, 0.3))',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      '& span': {
        fontSize: '10px',
        fontWeight: 600,
        color: isDark ? 'rgba(147, 197, 253, 1)' : 'rgba(29, 78, 216, 1)',
        textShadow: isDark 
          ? '0 1px 1px rgba(0, 0, 0, 0.2)' 
          : '0 0.5px 0.5px rgba(29, 78, 216, 0.2)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      },
    }),
  };
};
