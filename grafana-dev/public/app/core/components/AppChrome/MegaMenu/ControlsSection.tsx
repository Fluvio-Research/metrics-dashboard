import { css } from '@emotion/css';

import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Icon, useStyles2 } from '@grafana/ui';

import { Breadcrumbs } from '../../Breadcrumbs/Breadcrumbs';
import { Breadcrumb } from '../../Breadcrumbs/types';
import { HistoryContainer } from '../History/HistoryContainer';
import { ThemeToggleButton } from '../TopBar/ThemeToggleButton';
import { FullWidthToggleButton } from '../TopBar/FullWidthToggleButton';
import { ProfileButton } from '../TopBar/ProfileButton';
import { SidebarSearch } from './SidebarSearch';

interface ControlsSectionProps {
  breadcrumbs?: Breadcrumb[];
  profileNode?: NavModelItem;
  onToggleKioskMode?: () => void;
}

export function ControlsSection({ breadcrumbs, profileNode, onToggleKioskMode }: ControlsSectionProps) {
  const styles = useStyles2(getStyles);
  const unifiedHistoryEnabled = config.featureToggles.unifiedHistory;

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <Icon name="sliders-v-alt" size="sm" />
        <span className={styles.sectionTitle}>{t('navigation.controls', 'Controls')}</span>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className={styles.breadcrumbsContainer}>
          <Breadcrumbs breadcrumbs={breadcrumbs} className={styles.breadcrumbs} />
        </div>
      )}

      {/* Sidebar Search */}
      <SidebarSearch />

      {/* Action Items - Compact Grid Layout */}
      <div className={styles.actionGrid}>
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

        {profileNode && onToggleKioskMode && (
          <div className={styles.gridItem} title="Profile">
            <ProfileButton profileNode={profileNode} onToggleKioskMode={onToggleKioskMode} />
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
      padding: theme.spacing(1.5),
      marginBottom: theme.spacing(1.5),
      borderRadius: theme.shape.radius.default,
      background: isDark 
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)'}`,
      boxShadow: isDark
        ? '0 2px 8px rgba(0, 0, 0, 0.2)'
        : '0 1px 4px rgba(15, 23, 42, 0.06)',
    }),

    sectionHeader: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      marginBottom: theme.spacing(1.25),
      paddingBottom: theme.spacing(1),
      borderBottom: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.05)'}`,
    }),

    sectionTitle: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: 600,
      color: isDark ? 'rgba(226, 232, 240, 0.85)' : 'rgba(15, 23, 42, 0.8)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }),

    breadcrumbsContainer: css({
      marginBottom: theme.spacing(1.25),
      padding: theme.spacing(1),
      borderRadius: theme.shape.radius.default,
      background: isDark 
        ? 'rgba(17, 24, 39, 0.4)'
        : 'rgba(255, 255, 255, 0.6)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.05)'}`,
    }),

    breadcrumbs: css({
      fontSize: '11px',
      
      '& ol': {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        margin: 0,
        padding: 0,
        listStyle: 'none',
      },
      
      '& li': {
        fontSize: '11px',
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
        fontSize: 10,
      },
    }),

    actionGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing(0.75),
    }),

    gridItem: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(0.75),
      borderRadius: theme.shape.radius.default,
      background: isDark 
        ? 'rgba(17, 24, 39, 0.3)'
        : 'rgba(255, 255, 255, 0.5)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(15, 23, 42, 0.04)'}`,
      transition: 'all 0.2s ease',
      cursor: 'pointer',

      '&:hover': {
        background: isDark 
          ? 'rgba(30, 41, 59, 0.5)'
          : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark ? 'rgba(77, 172, 255, 0.3)' : 'rgba(77, 172, 255, 0.25)',
        transform: 'translateY(-2px)',
        boxShadow: isDark
          ? '0 4px 8px rgba(0, 0, 0, 0.2)'
          : '0 2px 6px rgba(15, 23, 42, 0.1)',
      },

      '&:active': {
        transform: 'translateY(0)',
      },
    }),
  };
};

