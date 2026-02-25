import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Button, useStyles2 } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';

export function UserTypeDisplay() {
  const styles = useStyles2(getStyles);
  const user = contextSrv.user;
  
  // Determine user type display text
  const getUserTypeDisplay = () => {
    if (user.isGrafanaAdmin) {
      return 'Server Admin';
    }
    
    switch (user.orgRole) {
      case 'Admin':
        return 'Organization Admin';
      case 'Editor':
        return 'Editor';
      case 'Viewer':
        return 'Viewer';
      default:
        return 'User';
    }
  };

  if (!user.isSignedIn) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.userInfo}>
        <div className={styles.userName}>{user.name || user.login}</div>
        <div className={styles.userType}>{getUserTypeDisplay()}</div>
      </div>
      {!config.auth.disableSignoutMenu && (
        <Button
          size="sm"
          variant="secondary"
          icon="arrow-from-right"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.assign(`${config.appSubUrl}/logout`);
            }
          }}
          className={styles.logoutButton}
        >
          {t('nav.sign-out.title', 'Sign out')}
        </Button>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDarkTheme = theme.colors.mode === 'dark';
  
  return {
    container: css({
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(1.5, 1),
      borderTop: `1px solid ${theme.colors.border.weak}`,
      backgroundColor: theme.colors.background.secondary,
      marginTop: 'auto',
      gap: theme.spacing(1),
      
      ...(isDarkTheme && {
        backgroundColor: theme.colors.background.primary,
        borderTop: `1px solid ${theme.colors.border.medium}`,
      }),
    }),
    userInfo: css({
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minWidth: 0,
    }),
    userName: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(0.25),
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    userType: css({
      fontSize: '11px',
      fontWeight: 600,
      color: theme.colors.text.secondary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      backgroundColor: theme.colors.background.canvas,
      padding: theme.spacing(0.25, 0.5),
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      border: `1px solid ${theme.colors.border.weak}`,
      ...(isDarkTheme && {
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.medium}`,
      }),
    }),
    logoutButton: css({
      flexShrink: 0,
    }),
  };
};
