import { css } from '@emotion/css';
import { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Icon } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';
import { DashboardSearchItem } from 'app/features/search/types';
import { DashboardCard } from './DashboardCard';

interface DashboardCardsSectionProps {
  dashboards: DashboardSearchItem[];
  onClose?: () => void;
}

export function DashboardCardsSection({ dashboards, onClose }: DashboardCardsSectionProps) {
  const styles = useStyles2(getStyles);
  const [othersExpanded, setOthersExpanded] = useState(false); // Others collapsed by default

  // Check if user is admin or super admin
  const isSuperAdmin = Boolean((contextSrv.user as any).isSuperAdmin ?? contextSrv.user.isGrafanaAdmin);
  const isOrgAdmin = contextSrv.hasRole('Admin');
  const isRestrictedUser = !isOrgAdmin && !isSuperAdmin;

  if (dashboards.length === 0) {
    return null;
  }

  const handleDashboardClick = () => {
    if (onClose) {
      onClose();
    }
  };

  // Helper function to extract number from tags
  const extractNumberFromTags = (dashboard: DashboardSearchItem): number | null => {
    if (!dashboard.tags || dashboard.tags.length === 0) {
      return null;
    }
    
    for (const tag of dashboard.tags) {
      const match = tag.match(/\d+/);
      if (match) {
        return parseInt(match[0], 10);
      }
    }
    
    return null;
  };

  // Helper function to sort dashboards by numbered tags
  const sortDashboards = (dashboardList: DashboardSearchItem[]): DashboardSearchItem[] => {
    return [...dashboardList].sort((a, b) => {
      const numA = extractNumberFromTags(a);
      const numB = extractNumberFromTags(b);
      
      // Items with numbers come first
      if (numA !== null && numB === null) return -1;
      if (numA === null && numB !== null) return 1;
      
      // Both have numbers - sort by number
      if (numA !== null && numB !== null) {
        if (numA !== numB) {
          return numA - numB;
        }
        // Same number - sort alphabetically by title
        return (a.title || '').localeCompare(b.title || '');
      }
      
      // Both have no numbers - sort alphabetically by title
      return (a.title || '').localeCompare(b.title || '');
    });
  };

  // Categorize dashboards by tags
  const exploreDashboardsRaw = dashboards.filter(d => d.tags?.includes('explore'));
  const toolsDashboardsRaw = dashboards.filter(d => d.tags?.includes('tools'));
  const otherDashboardsRaw = dashboards.filter(d => 
    !d.tags?.includes('explore') && !d.tags?.includes('tools')
  );

  // Sort each category
  const exploreDashboards = sortDashboards(exploreDashboardsRaw);
  const toolsDashboards = sortDashboards(toolsDashboardsRaw);
  const otherDashboards = sortDashboards(otherDashboardsRaw);

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

      {/* Others Section - Collapsible - Only show for admin/super admin users */}
      {!isRestrictedUser && otherDashboards.length > 0 && (
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
      padding: theme.spacing(2, 0.75, 2.5, 0.75),
      borderBottom: `1.5px solid ${isDark ? 'rgba(98, 165, 212, 0.12)' : 'rgba(36, 122, 190, 0.12)'}`,
      position: 'relative',
      
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -1,
        left: '10%',
        right: '10%',
        height: '2px',
        background: isDark
          ? 'linear-gradient(90deg, transparent, rgba(98, 165, 212, 0.3), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(36, 122, 190, 0.25), transparent)',
        opacity: 0.6,
      },
    }),
    
    sectionTitle: css({
      fontSize: '12px',
      fontWeight: 600,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(1.5),
      padding: theme.spacing(0.875, 1.25),
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      background: isDark 
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(51, 65, 85, 0.6) 50%, rgba(30, 41, 59, 0.7) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 50%, rgba(248, 250, 252, 1) 100%)',
      border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(203, 213, 225, 0.6)'}`,
      borderRadius: `${theme.shape.radius.default}px`,
      boxShadow: isDark
        ? '0 3px 10px rgba(0, 0, 0, 0.2), 0 1px 4px rgba(96, 165, 250, 0.15), inset 0 1px 0 rgba(96, 165, 250, 0.08)'
        : '0 2px 4px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      // Add vibrant accent border
      position: 'relative',
      overflow: 'hidden',
      
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        backgroundColor: theme.colors.primary.main,
        borderRadius: `${theme.shape.radius.default}px 0 0 ${theme.shape.radius.default}px`,
        boxShadow: isDark
          ? '0 0 10px rgba(96, 165, 250, 0.4)'
          : 'none',
      },
    }),
    
    sectionIcon: css({
      color: theme.colors.text.secondary,
      fontSize: '15px',
      filter: isDark
        ? 'drop-shadow(0 1px 2px rgba(96, 165, 250, 0.3))'
        : 'none',
    }),

    // Explore Data - WRD Blue theme (#4ebff2, #62a5d4)
    sectionTitleExplore: css({
      background: isDark 
        ? 'linear-gradient(135deg, rgba(78, 191, 242, 0.2) 0%, rgba(98, 165, 212, 0.25) 50%, rgba(78, 191, 242, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(225, 245, 254, 1) 0%, rgba(207, 239, 252, 1) 50%, rgba(225, 245, 254, 1) 100%)',
      border: `1px solid ${isDark ? 'rgba(78, 191, 242, 0.35)' : 'rgba(78, 191, 242, 0.3)'}`,
      boxShadow: isDark
        ? '0 4px 12px rgba(78, 191, 242, 0.25), 0 2px 6px rgba(98, 165, 212, 0.15), inset 0 1px 0 rgba(131, 220, 251, 0.12)'
        : '0 2px 4px rgba(78, 191, 242, 0.12), 0 1px 2px rgba(36, 122, 190, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)',
      
      '&::before': {
        backgroundColor: isDark ? 'rgba(131, 220, 251, 0.95)' : 'rgba(78, 191, 242, 0.85)',
        boxShadow: isDark
          ? '0 0 12px rgba(131, 220, 251, 0.5)'
          : '0 0 6px rgba(78, 191, 242, 0.35)',
      },
    }),

    sectionIconExplore: css({
      color: isDark ? 'rgba(131, 220, 251, 1)' : 'rgba(36, 122, 190, 1)',
      fontSize: '16px',
      filter: isDark
        ? 'drop-shadow(0 2px 4px rgba(131, 220, 251, 0.5))'
        : 'drop-shadow(0 1px 2px rgba(78, 191, 242, 0.4))',
    }),

    // Tools - WRD Medium Blue theme (#247abe, #5989af)
    sectionTitleTools: css({
      background: isDark 
        ? 'linear-gradient(135deg, rgba(36, 122, 190, 0.2) 0%, rgba(89, 137, 175, 0.25) 50%, rgba(36, 122, 190, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(237, 245, 251, 1) 0%, rgba(224, 239, 250, 1) 50%, rgba(237, 245, 251, 1) 100%)',
      border: `1px solid ${isDark ? 'rgba(36, 122, 190, 0.35)' : 'rgba(36, 122, 190, 0.3)'}`,
      boxShadow: isDark
        ? '0 4px 12px rgba(36, 122, 190, 0.25), 0 2px 6px rgba(89, 137, 175, 0.15), inset 0 1px 0 rgba(98, 165, 212, 0.12)'
        : '0 2px 4px rgba(36, 122, 190, 0.12), 0 1px 2px rgba(21, 107, 183, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)',
      
      '&::before': {
        backgroundColor: isDark ? 'rgba(98, 165, 212, 0.95)' : 'rgba(36, 122, 190, 0.85)',
        boxShadow: isDark
          ? '0 0 12px rgba(98, 165, 212, 0.5)'
          : '0 0 6px rgba(36, 122, 190, 0.35)',
      },
    }),

    sectionIconTools: css({
      color: isDark ? 'rgba(98, 165, 212, 1)' : 'rgba(21, 107, 183, 1)',
      fontSize: '16px',
      filter: isDark
        ? 'drop-shadow(0 2px 4px rgba(98, 165, 212, 0.5))'
        : 'drop-shadow(0 1px 2px rgba(36, 122, 190, 0.4))',
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
