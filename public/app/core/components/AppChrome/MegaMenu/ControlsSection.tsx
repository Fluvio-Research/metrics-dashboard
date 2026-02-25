import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, useStyles2 } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';

import { HistoryContainer } from '../History/HistoryContainer';
import { ThemeToggleButton } from '../TopBar/ThemeToggleButton';
import { SidebarSearch } from './SidebarSearch';

interface ControlsSectionProps {
  onToggleKioskMode?: () => void;
}

export function ControlsSection({
  onToggleKioskMode,
}: ControlsSectionProps) {
  const styles = useStyles2(getStyles);
  const unifiedHistoryEnabled = config.featureToggles.unifiedHistory;
  
  // Check if user is admin or super admin
  const isSuperAdmin = Boolean((contextSrv.user as any).isSuperAdmin ?? contextSrv.user.isGrafanaAdmin);
  const isOrgAdmin = contextSrv.hasRole('Admin');
  const isRestrictedUser = !isOrgAdmin && !isSuperAdmin;

  return (
    <div className={styles.container}>
      {/* Sidebar Search - Only show for admin/super admin users */}
      {!isRestrictedUser && (
        <div className={styles.searchWrapper}>
          <SidebarSearch />
        </div>
      )}

      {/* Action Items - Professional Grid Layout */}
      <div className={styles.actionGrid}>
        <div className={styles.buttonsContainer}>
          {unifiedHistoryEnabled && (
            <div className={styles.buttonWrapper} title="History">
              <HistoryContainer />
            </div>
          )}

          <div className={styles.buttonWrapper} title="Theme Toggle">
            <ThemeToggleButton />
          </div>

          {/* Kiosk Mode Button */}
          {onToggleKioskMode && (
            <div className={styles.buttonWrapper} title="Enable kiosk mode">
              <button
                onClick={onToggleKioskMode}
                aria-label="Enable kiosk mode"
                className={styles.controlButton}
              >
                <Icon name="monitor" />
              </button>
            </div>
          )}
        </div>

        {/* Logout Button */}
        {!config.auth.disableSignoutMenu && (
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.assign(`${config.appSubUrl}/logout`);
              }
            }}
            aria-label="Logout"
            className={styles.logoutButton}
            title="Logout"
          >
            <Icon name="signout" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;
 
  return {
    container: css({
      padding: theme.spacing(0.75, 0.75),
      marginTop: theme.spacing(1.5),
      marginBottom: theme.spacing(1),
      borderRadius: theme.shape.radius.default,
      background: isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(51, 65, 85, 0.4) 50%, rgba(30, 41, 59, 0.5) 100%)'
        : 'linear-gradient(135deg, rgba(226, 232, 240, 0.25) 0%, rgba(241, 245, 249, 0.3) 50%, rgba(226, 232, 240, 0.25) 100%)',
      border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.12)' : 'rgba(203, 213, 225, 0.3)'}`,
      boxShadow: isDark
        ? '0 2px 6px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(96, 165, 250, 0.08)'
        : '0 1px 2px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
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
      width: '100%',
    }),

    buttonsContainer: css({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing(0.75),
      width: '100%',
      padding: 0,
      
      // Responsive design
      [theme.breakpoints.down('lg')]: {
        gap: theme.spacing(0.5),
      },
    }),

    buttonWrapper: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '38px',
      height: '30px',
      flexShrink: 0,
      position: 'relative',
      
      // Responsive sizing
      [theme.breakpoints.down('xl')]: {
        minWidth: '36px',
        height: '28px',
      },
      
      [theme.breakpoints.down('lg')]: {
        minWidth: '34px',
        height: '28px',
      },
      
      '& > *': {
        width: '100%',
        height: '100%',
      },
      
      // Ensure icons inside wrapped components are properly sized
      '& svg': {
        width: '15px !important',
        height: '15px !important',
        color: isDark ? 'rgba(147, 197, 253, 0.95)' : 'rgba(71, 85, 105, 0.9)',
        filter: isDark
          ? 'drop-shadow(0 1px 2px rgba(96, 165, 250, 0.3))'
          : 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        
        // Responsive icon sizing
        [theme.breakpoints.down('lg')]: {
          width: '14px !important',
          height: '14px !important',
        },
      },
      
      '& button:hover svg': {
        transform: 'scale(1.05)',
        color: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(51, 65, 85, 1)',
        filter: isDark
          ? 'drop-shadow(0 2px 4px rgba(96, 165, 250, 0.5))'
          : 'none',
      },
      
      '& button': {
        width: '100%',
        height: '100%',
        minHeight: '30px !important',
        maxHeight: '30px !important',
        minWidth: '38px !important',
        padding: '0 ${theme.spacing(0.5)} !important',
        borderRadius: `${theme.shape.radius.default}px`,
        background: isDark
          ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.6) 0%, rgba(30, 41, 59, 0.7) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 250, 251, 1) 100%)',
        border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.25)' : 'rgba(203, 213, 225, 0.7)'}`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isDark
          ? '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(96, 165, 250, 0.1)'
          : '0 1px 2px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)',
        
        // Responsive button sizing
        [theme.breakpoints.down('xl')]: {
          minHeight: '28px !important',
          maxHeight: '28px !important',
          minWidth: '36px !important',
        },
        
        [theme.breakpoints.down('lg')]: {
          minHeight: '28px !important',
          maxHeight: '28px !important',
          minWidth: '34px !important',
          padding: '0 ${theme.spacing(0.5)} !important',
        },
        
        // Shimmer effect
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
          transition: 'left 0.5s ease',
          pointerEvents: 'none',
        },
        
        '&:hover': {
          background: isDark
            ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.25) 0%, rgba(59, 130, 246, 0.3) 100%)'
            : 'linear-gradient(135deg, rgba(241, 245, 249, 1) 0%, rgba(248, 250, 252, 1) 100%)',
          borderColor: isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(100, 116, 139, 0.3)',
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 6px 16px rgba(96, 165, 250, 0.35), 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(96, 165, 250, 0.2)'
            : '0 4px 12px rgba(15, 23, 42, 0.1), 0 2px 4px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)',
          
          '&::before': {
            left: '100%',
          },
        },
        
        '&:active': {
          transform: 'translateY(-1px) scale(0.98)',
          boxShadow: isDark
            ? '0 3px 8px rgba(0, 0, 0, 0.25)'
            : '0 3px 8px rgba(36, 122, 190, 0.15)',
        },
      },
    }),

    controlButton: css({
      all: 'unset',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: '30px',
      maxHeight: '30px',
      minWidth: '38px',
      padding: `0 ${theme.spacing(0.5)}`,
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
      background: isDark
        ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.6) 0%, rgba(30, 41, 59, 0.7) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 250, 251, 1) 100%)',
      border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.25)' : 'rgba(203, 213, 225, 0.7)'}`,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isDark
        ? '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(96, 165, 250, 0.1)'
        : '0 1px 2px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)',
      
      // Responsive sizing
      [theme.breakpoints.down('xl')]: {
        minHeight: '28px',
        maxHeight: '28px',
        minWidth: '36px',
      },
      
      [theme.breakpoints.down('lg')]: {
        minHeight: '28px',
        maxHeight: '28px',
        minWidth: '34px',
        padding: `0 ${theme.spacing(0.5)}`,
      },
      
      // Shimmer effect
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
        transition: 'left 0.5s ease',
        pointerEvents: 'none',
      },
      
      '& svg': {
        width: '15px',
        height: '15px',
        color: isDark ? 'rgba(147, 197, 253, 0.95)' : 'rgba(71, 85, 105, 0.9)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        filter: isDark
          ? 'drop-shadow(0 1px 2px rgba(96, 165, 250, 0.3))'
          : 'none',
        
        // Responsive icon sizing
        [theme.breakpoints.down('lg')]: {
          width: '14px',
          height: '14px',
        },
      },
      
      '&:hover': {
        background: isDark
          ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.25) 0%, rgba(59, 130, 246, 0.3) 100%)'
          : 'linear-gradient(135deg, rgba(241, 245, 249, 1) 0%, rgba(248, 250, 252, 1) 100%)',
        borderColor: isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(100, 116, 139, 0.3)',
        transform: 'translateY(-2px)',
        boxShadow: isDark
          ? '0 6px 16px rgba(96, 165, 250, 0.35), 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(96, 165, 250, 0.2)'
          : '0 4px 12px rgba(15, 23, 42, 0.1), 0 2px 4px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)',
        
        '&::before': {
          left: '100%',
        },
        
        '& svg': {
          color: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(51, 65, 85, 1)',
          transform: 'scale(1.05)',
          filter: isDark
            ? 'drop-shadow(0 2px 4px rgba(96, 165, 250, 0.5))'
            : 'none',
        },
      },
      
      '&:active': {
        transform: 'translateY(-1px)',
        boxShadow: isDark
          ? '0 3px 8px rgba(0, 0, 0, 0.25)'
          : '0 2px 4px rgba(15, 23, 42, 0.08)',
      },
    }),

    logoutButton: css({
      all: 'unset',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(0.625),
      width: '100%',
      minHeight: '32px',
      padding: `${theme.spacing(0.625)} ${theme.spacing(0.875)}`,
      borderRadius: `${theme.shape.radius.default}px`,
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      marginTop: theme.spacing(0.5),
      
      // Professional muted background
      background: isDark
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 100%)',
      
      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.2)'}`,
      boxShadow: isDark
        ? '0 2px 6px rgba(239, 68, 68, 0.2), 0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 1px 2px rgba(220, 38, 38, 0.08), 0 1px 1px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1)',
      
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      // Responsive sizing
      [theme.breakpoints.down('lg')]: {
        minHeight: '30px',
        padding: `${theme.spacing(0.5)} ${theme.spacing(0.75)}`,
        gap: theme.spacing(0.5),
      },
      
      // Subtle shine effect on hover
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        transition: 'left 0.4s ease',
        pointerEvents: 'none',
        zIndex: 1,
      },
      
      '& svg': {
        width: '16px',
        height: '16px',
        flexShrink: 0,
        color: isDark ? 'rgba(248, 113, 113, 1)' : 'rgba(185, 28, 28, 0.9)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 2,
        filter: 'none',
        
        [theme.breakpoints.down('lg')]: {
          width: '15px',
          height: '15px',
        },
      },
      
      '& span': {
        fontSize: '12px',
        fontWeight: 600,
        color: isDark ? 'rgba(248, 113, 113, 1)' : 'rgba(127, 29, 29, 1)',
        letterSpacing: '0.025em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        position: 'relative',
        zIndex: 2,
        textShadow: 'none',
        
        [theme.breakpoints.down('lg')]: {
          fontSize: '11px',
        },
      },
      
      '&:hover': {
        background: isDark
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.3) 100%)'
          : 'linear-gradient(135deg, rgba(254, 242, 242, 1) 0%, rgba(253, 232, 232, 1) 100%)',
        
        borderColor: isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.3)',
        transform: 'translateY(-2px)',
        boxShadow: isDark
          ? '0 4px 12px rgba(239, 68, 68, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          : '0 2px 6px rgba(220, 38, 38, 0.12), 0 1px 2px rgba(220, 38, 38, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)',
        
        '&::before': {
          left: '100%',
        },
        
        '& svg': {
          color: isDark ? 'rgba(254, 202, 202, 1)' : 'rgba(153, 27, 27, 1)',
          transform: 'translateX(3px)',
          filter: 'none',
        },
        
        '& span': {
          color: isDark ? 'rgba(254, 202, 202, 1)' : 'rgba(127, 29, 29, 1)',
          textShadow: 'none',
        },
      },
      
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: isDark
          ? '0 2px 4px rgba(239, 68, 68, 0.25), inset 0 1px 2px rgba(0, 0, 0, 0.15)'
          : '0 1px 2px rgba(220, 38, 38, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.05)',
        
        '& svg': {
          transform: 'translateX(1px)',
        },
      },
      
      '&:focus-visible': {
        outline: `2px solid ${isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.4)'}`,
        outlineOffset: '2px',
      },
    }),
  };
};
