import { css } from '@emotion/css';

import { Trans } from '@grafana/i18n';
import { GrafanaTheme2 } from '@grafana/data';
import { LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { getConfig } from 'app/core/config';

export const UserSignup = () => {
  const styles = useStyles2(getStyles);
  const href = getConfig().verifyEmailEnabled ? `${getConfig().appSubUrl}/verify` : `${getConfig().appSubUrl}/signup`;

  return (
    <Stack direction="column" gap={2} alignItems="stretch">
      <div className={styles.signupDivider} />
      <div className={styles.signupText}>
        <Trans i18nKey="login.signup.new-to-question">New to SIWIS?</Trans>
      </div>
      <LinkButton
        className={styles.signupButton}
        href={href}
        variant="secondary"
        fill="outline"
      >
        <Trans i18nKey="login.signup.button-label">Sign up</Trans>
      </LinkButton>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  signupDivider: css({
    height: '1px',
    background: theme.isDark
      ? 'rgba(51, 65, 85, 1)'
      : 'rgba(226, 232, 240, 1)',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.75),
    
    // Mobile-first: compact for small screens
    '@media (max-width: 480px)': {
      marginTop: theme.spacing(0.75),
      marginBottom: theme.spacing(0.6),
    },
    
    [theme.breakpoints.up('sm')]: {
      marginTop: theme.spacing(1.25),
      marginBottom: theme.spacing(1),
    },
    
    [theme.breakpoints.up('md')]: {
      marginTop: theme.spacing(1.5),
      marginBottom: theme.spacing(1.25),
    },
    
    [theme.breakpoints.up('lg')]: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1.5),
    },
  }),
  signupText: css({
    textAlign: 'center',
    fontSize: '12px',
    color: theme.isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 1)',
    fontWeight: 500,
    letterSpacing: '0',
    marginBottom: theme.spacing(0.6),
    
    // Mobile-first: compact for small screens
    '@media (max-width: 480px)': {
      fontSize: '11px',
      marginBottom: theme.spacing(0.5),
    },
    
    [theme.breakpoints.up('sm')]: {
      fontSize: '12px',
      marginBottom: theme.spacing(0.75),
    },
    
    [theme.breakpoints.up('md')]: {
      fontSize: '13px',
      marginBottom: theme.spacing(1),
    },
    
    [theme.breakpoints.up('lg')]: {
      fontSize: '13px',
      marginBottom: theme.spacing(1.25),
    },
  }),
  
  signupButton: css({
    width: '100%',
    justifyContent: 'center',
    height: 38,
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '10px',
    border: theme.isDark
      ? '2px solid rgba(51, 65, 85, 1)'
      : '2px solid rgba(226, 232, 240, 1)',
    backgroundColor: theme.isDark 
      ? 'rgba(30, 41, 59, 1)' 
      : 'rgba(248, 250, 252, 1)',
    color: theme.isDark 
      ? 'rgba(255, 255, 255, 0.98)' 
      : 'rgba(15, 23, 42, 0.98)',
    transition: 'all 0.2s ease',
    
    // Mobile-first: compact for small screens
    '@media (max-width: 480px)': {
      height: 36,
      fontSize: '12px',
    },
    
    [theme.breakpoints.up('sm')]: {
      height: 40,
      fontSize: '13px',
    },
    
    [theme.breakpoints.up('md')]: {
      height: 42,
      fontSize: '14px',
    },
    
    [theme.breakpoints.up('lg')]: {
      height: 44,
      fontSize: '14px',
    },
    
    '&:hover': {
      borderColor: theme.isDark 
        ? 'rgba(71, 85, 105, 1)' 
        : 'rgba(203, 213, 225, 1)',
      backgroundColor: theme.isDark 
        ? 'rgba(30, 41, 59, 1)' 
        : 'rgba(255, 255, 255, 1)',
      transform: 'translateY(-1px)',
    },
    
    '&:active': {
      transform: 'translateY(0)',
    },
  }),
});
