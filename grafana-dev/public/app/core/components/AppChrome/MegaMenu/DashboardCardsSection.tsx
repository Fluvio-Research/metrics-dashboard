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
        Your Dashboards
      </div>
      <div className={styles.cardsGrid}>
        {dashboards.map((dashboard) => (
          <DashboardCard
            key={dashboard.uid }
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
      
      ...(false && {
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
      }),
    }),
    
    sectionTitle: css({
      fontSize: theme.typography.h6.fontSize,
      fontWeight: theme.typography.fontWeightBold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(1),
      padding: theme.spacing(0, 0.5),
      textAlign: 'center',
      
      ...(false && {
        color: '#FFFFFF',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
      }),
    }),
    
    cardsGrid: css({
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: theme.spacing(0.5),
      padding: theme.spacing(0, 0.5),
      
      // For very narrow sidebars, stack cards vertically
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
      },
      
      // For wider sidebars, we could show more columns
      [theme.breakpoints.up('xl')]: {
        gridTemplateColumns: '1fr 1fr',
      },
    }),
  };
};
