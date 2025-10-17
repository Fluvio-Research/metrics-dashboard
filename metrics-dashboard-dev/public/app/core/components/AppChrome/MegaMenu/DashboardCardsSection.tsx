import { css } from '@emotion/css';
import { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Icon } from '@grafana/ui';
import { DashboardSearchItem } from 'app/features/search/types';
import { DashboardCard } from './DashboardCard';

interface DashboardCardsSectionProps {
  dashboards: DashboardSearchItem[];
  onClose?: () => void;
}

export function DashboardCardsSection({ dashboards, onClose }: DashboardCardsSectionProps) {
  const styles = useStyles2(getStyles);
  const [othersExpanded, setOthersExpanded] = useState(false); // Others collapsed by default

  if (dashboards.length === 0) {
    return null;
  }

  const handleDashboardClick = () => {
    if (onClose) {
      onClose();
    }
  };

  // Categorize dashboards by tags
  const exploreDashboards = dashboards.filter(d => d.tags?.includes('explore'));
  const toolsDashboards = dashboards.filter(d => d.tags?.includes('tools'));
  const otherDashboards = dashboards.filter(d => 
    !d.tags?.includes('explore') && !d.tags?.includes('tools')
  );

  return (
    <>
      {/* Explore Data Section */}
      {exploreDashboards.length > 0 && (
        <div className={styles.section}>
          <div className={`${styles.sectionTitle} ${styles.sectionTitleExplore}`}>
            <Icon name="compass" className={styles.sectionIconExplore} />
            <span>Explore Data</span>
          </div>
          <div className={styles.dashboardList}>
            {exploreDashboards.map((dashboard) => (
              <DashboardCard
                key={dashboard.uid}
                dashboard={dashboard}
                onClick={handleDashboardClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tools Section */}
      {toolsDashboards.length > 0 && (
        <div className={styles.section}>
          <div className={`${styles.sectionTitle} ${styles.sectionTitleTools}`}>
            <Icon name="cog" className={styles.sectionIconTools} />
            <span>Tools</span>
          </div>
          <div className={styles.dashboardList}>
            {toolsDashboards.map((dashboard) => (
              <DashboardCard
                key={dashboard.uid}
                dashboard={dashboard}
                onClick={handleDashboardClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Others Section - Collapsible */}
      {otherDashboards.length > 0 && (
        <div className={styles.section}>
          <div 
            className={styles.sectionTitleCollapsible}
            onClick={() => setOthersExpanded(!othersExpanded)}
          >
            <Icon 
              name={othersExpanded ? "angle-down" : "angle-right"} 
              className={styles.chevronIcon} 
            />
            <Icon name="apps" className={styles.sectionIcon} />
            <span>Others</span>
            <span className={styles.count}>({otherDashboards.length})</span>
          </div>
          {othersExpanded && (
            <div className={styles.dashboardList}>
              {otherDashboards.map((dashboard) => (
                <DashboardCard
                  key={dashboard.uid}
                  dashboard={dashboard}
                  onClick={handleDashboardClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;
  
  return {
    section: css({
      padding: theme.spacing(1.5, 0.5, 2, 0.5),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      
    }),
    
    sectionTitle: css({
      fontSize: '12px',
      fontWeight: theme.typography.fontWeightBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(1.5),
      padding: theme.spacing(0.75, 1.25),
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      background: isDark 
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)'}`,
      borderRadius: theme.shape.radius.default,
      
      // Add subtle accent
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        backgroundColor: theme.colors.primary.main,
        borderRadius: `${theme.shape.radius.default} 0 0 ${theme.shape.radius.default}`,
      },
    }),
    
    sectionIcon: css({
      color: theme.colors.primary.main,
      fontSize: '14px',
    }),

    // Explore Data - Blue theme
    sectionTitleExplore: css({
      background: isDark 
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(219, 234, 254, 0.8) 0%, rgba(191, 219, 254, 0.9) 100%)',
      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
      
      '&::before': {
        backgroundColor: isDark ? 'rgba(96, 165, 250, 0.9)' : 'rgba(59, 130, 246, 0.9)',
      },
    }),

    sectionIconExplore: css({
      color: isDark ? 'rgba(147, 197, 253, 0.95)' : 'rgba(37, 99, 235, 0.95)',
      fontSize: '14px',
    }),

    // Tools - Green theme
    sectionTitleTools: css({
      background: isDark 
        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(220, 252, 231, 0.8) 0%, rgba(187, 247, 208, 0.9) 100%)',
      border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.2)'}`,
      
      '&::before': {
        backgroundColor: isDark ? 'rgba(74, 222, 128, 0.9)' : 'rgba(34, 197, 94, 0.9)',
      },
    }),

    sectionIconTools: css({
      color: isDark ? 'rgba(134, 239, 172, 0.95)' : 'rgba(22, 163, 74, 0.95)',
      fontSize: '14px',
    }),

    sectionTitleCollapsible: css({
      fontSize: '12px',
      fontWeight: theme.typography.fontWeightBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(1.5),
      padding: theme.spacing(0.75, 1.25),
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      background: isDark 
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)'}`,
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      
      // Add subtle accent
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        backgroundColor: theme.colors.primary.main,
        borderRadius: `${theme.shape.radius.default} 0 0 ${theme.shape.radius.default}`,
      },

      '&:hover': {
        background: isDark 
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 1) 100%)',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.1)',
      },
    }),

    chevronIcon: css({
      color: theme.colors.text.secondary,
      fontSize: '14px',
      transition: 'transform 0.2s ease',
    }),

    count: css({
      marginLeft: 'auto',
      fontSize: '10px',
      fontWeight: theme.typography.fontWeightRegular,
      color: theme.colors.text.secondary,
      opacity: 0.7,
    }),
    
    dashboardList: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
      padding: theme.spacing(0, 0.5),
    }),
  };
};
