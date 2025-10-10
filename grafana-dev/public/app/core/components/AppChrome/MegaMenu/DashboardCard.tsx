import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Icon } from '@grafana/ui';
import { DashboardSearchItem } from 'app/features/search/types';
import { locationService } from '@grafana/runtime';
import kbn from 'app/core/utils/kbn';

interface DashboardCardProps {
  dashboard: DashboardSearchItem;
  onClick?: () => void;
}

export function DashboardCard({ dashboard, onClick }: DashboardCardProps) {
  const styles = useStyles2(getStyles);

  // Always use page icon for modern, consistent design
  const getDashboardIcon = () => 'dashboard' as const;

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onClick) {
      onClick();
    }
    
    if (dashboard.uid && dashboard.title) {
      // Navigate directly to the dashboard using its UID and slug
      const slug = kbn.slugifyForUrl(dashboard.title);
      const dashboardUrl = `/d/${dashboard.uid}/${slug}`;
      locationService.push(dashboardUrl);
    } else if (dashboard.uid) {
      // Fallback to just UID if no title
      const dashboardUrl = `/d/${dashboard.uid}`;
      locationService.push(dashboardUrl);
    } else if (dashboard.url) {
      // Fallback to the provided URL if no UID
      locationService.push(dashboard.url);
    }
  };


  // Render modern list item design
  const renderDashboardItem = () => {
    const iconName = getDashboardIcon();
    
    return (
      <div className={styles.listItem}>
        <div className={`${styles.iconContainer} icon-container`}>
          <Icon name={iconName} size="lg" className={`${styles.dashboardIcon} dashboard-icon`} />
        </div>
        
        <div className={styles.content}>
          <div className={styles.title}>
            {dashboard.title}
          </div>
          
          {dashboard.tags && dashboard.tags.length > 0 && (
            <div className={styles.tags}>
              {dashboard.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className={`${styles.tag} tag`}>
                  {tag}
                </span>
              ))}
              {dashboard.tags.length > 3 && (
                <span className={styles.tagMore}>+{dashboard.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.actions}>
          <Icon name="arrow-right" size="sm" className={`${styles.arrowIcon} arrow-icon`} />
        </div>
      </div>
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  };

  return (
    <div 
      className={styles.container} 
      onClick={handleClick} 
      onKeyDown={handleKeyDown}
      role="button" 
      tabIndex={0}
    >
      {renderDashboardItem()}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDarkTheme = theme.colors.mode === 'dark';
  
  return {
    container: css({
      width: '100%',
      cursor: 'pointer',
      
      '&:focus': {
        outline: `2px solid ${theme.colors.primary.main}`,
        outlineOffset: '2px',
        borderRadius: theme.shape.radius.default,
      },
    }),
    
    listItem: css({
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0.75, 1),
      margin: theme.spacing(0.25, 0),
      borderRadius: theme.shape.radius.default,
      transition: 'all 0.2s ease-in-out',
      border: `1px solid transparent`,
      borderLeft: '2px solid transparent',
      
      '&:hover': {
        backgroundColor: isDarkTheme 
          ? 'rgba(77, 172, 255, 0.06)' 
          : 'rgba(77, 172, 255, 0.04)',
        borderLeft: `2px solid ${theme.colors.primary.main}`,
        transform: 'translateX(2px)',
        boxShadow: `0 2px 8px ${isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)'}`,
        
        '& .icon-container': {
          transform: 'scale(1.05)',
          backgroundColor: isDarkTheme 
            ? 'rgba(77, 172, 255, 0.15)' 
            : 'rgba(77, 172, 255, 0.12)',
        },
        
        '& .dashboard-icon': {
          transform: 'scale(1.05)',
        },
        
        '& .arrow-icon': {
          opacity: 1,
          transform: 'translateX(2px)',
          color: theme.colors.primary.main,
        },
      },
      
      '&:active': {
        transform: 'translateX(1px)',
        transition: 'all 0.1s ease-out',
      },
    }),
    
    iconContainer: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: theme.spacing(4),
      height: theme.spacing(4),
      marginRight: theme.spacing(1),
      borderRadius: theme.shape.radius.default,
      backgroundColor: isDarkTheme 
        ? 'rgba(77, 172, 255, 0.1)' 
        : 'rgba(77, 172, 255, 0.08)',
      border: `1px solid ${isDarkTheme ? 'rgba(77, 172, 255, 0.2)' : 'rgba(77, 172, 255, 0.15)'}`,
      transition: 'all 0.2s ease-in-out',
    }),
    
    dashboardIcon: css({
      color: theme.colors.primary.main,
      opacity: 0.85,
      transition: 'all 0.2s ease-in-out',
    }),
    
    content: css({
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),
    
    title: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
      lineHeight: 1.4,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    
    tags: css({
      display: 'flex',
      gap: theme.spacing(0.5),
      flexWrap: 'wrap',
      alignItems: 'center',
    }),
    
    tag: css({
      fontSize: '10px',
      padding: theme.spacing(0.25, 0.5),
      backgroundColor: isDarkTheme 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.06)',
      color: theme.colors.text.secondary,
      borderRadius: theme.shape.radius.default,
      fontWeight: 500,
      border: `1px solid ${theme.colors.border.weak}`,
      transition: 'all 0.2s ease-in-out',
    }),
    
    tagMore: css({
      fontSize: '11px',
      padding: theme.spacing(0.25, 0.5),
      backgroundColor: theme.colors.primary.transparent,
      color: theme.colors.primary.text,
      borderRadius: theme.shape.radius.default,
      fontWeight: 600,
      border: `1px solid ${theme.colors.primary.border}`,
    }),
    
    actions: css({
      display: 'flex',
      alignItems: 'center',
      marginLeft: theme.spacing(1),
    }),
    
    arrowIcon: css({
      color: theme.colors.text.secondary,
      opacity: 0,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'translateX(-2px)',
    }),
  };
};
