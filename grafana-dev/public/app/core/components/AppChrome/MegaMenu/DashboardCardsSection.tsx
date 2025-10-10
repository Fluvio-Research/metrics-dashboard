import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { DashboardSearchItem } from 'app/features/search/types';
import { DashboardCard } from './DashboardCard';

interface DashboardCardsSectionProps {
  dashboards: DashboardSearchItem[];
  onClose?: () => void;
}

export function DashboardCardsSection({ dashboards, onClose }: DashboardCardsSectionProps) {
  const styles = useStyles2(getStyles);

  if (dashboards.length === 0) {
    return null;
  }

  const handleDashboardClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>
        Your Menu
      </div>
      <div className={styles.dashboardList}>
        {dashboards.map((dashboard) => (
          <DashboardCard
            key={dashboard.uid}
            dashboard={dashboard}
            onClick={handleDashboardClick}
          />
        ))}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  
  return {
    section: css({
      padding: theme.spacing(1, 0.5, 2, 0.5),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      
    }),
    
    sectionTitle: css({
      fontSize: '12px',
      fontWeight: theme.typography.fontWeightBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(1),
      padding: theme.spacing(0, 1),
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      
      // Add subtle accent
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '-2px',
        left: theme.spacing(1),
        right: theme.spacing(1),
        height: '2px',
        backgroundColor: theme.colors.primary.main,
        borderRadius: '1px',
        opacity: 0.6,
      },
    }),
    
    dashboardList: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
      padding: theme.spacing(0, 0.5),
    }),
  };
};
