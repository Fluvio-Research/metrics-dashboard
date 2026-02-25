// Libraries
import { css } from '@emotion/css';

// Components
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Alert, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { Branding } from 'app/core/components/Branding/Branding';

import { ChangePassword } from '../ForgottenPassword/ChangePassword';
import { Page } from '../Page/Page';

import LoginCtrl from './LoginCtrl';
import { LoginForm } from './LoginForm';
import { LoginLayout, InnerBox } from './LoginLayout';
import { LoginServiceButtons } from './LoginServiceButtons';
import { PasswordlessConfirmation } from './PasswordlessConfirmationForm';
import { PasswordlessLoginForm } from './PasswordlessLoginForm';
import { UserSignup } from './UserSignup';

const LoginPage = () => {
  const styles = useStyles2(getStyles);

  document.title = Branding.AppTitle;

  return (
    <Page layout={PageLayoutType.Custom}>
      <LoginCtrl>
        {({
          loginHint,
          passwordHint,
          disableLoginForm,
          disableUserSignUp,
          login,
          passwordlessStart,
          passwordlessConfirm,
          showPasswordlessConfirmation,
          isLoggingIn,
          changePassword,
          skipPasswordChange,
          isChangingPassword,
          showDefaultPasswordWarning,
          loginErrorMessage,
        }) => (
          <LoginLayout isChangingPassword={isChangingPassword}>
            {!isChangingPassword && !showPasswordlessConfirmation && (
              <InnerBox>
                {loginErrorMessage && (
                  <Alert className={styles.alert} severity="error" title={t('login.error.title', 'Login failed')}>
                    {loginErrorMessage}
                  </Alert>
                )}

                {!disableLoginForm && !config.auth.passwordlessEnabled && (
                  <LoginForm
                    onSubmit={login}
                    loginHint={loginHint}
                    passwordHint={passwordHint}
                    isLoggingIn={isLoggingIn}
                  >
                    <Stack justifyContent="flex-end">
                      {!config.auth.disableLogin && (
                        <LinkButton
                          className={styles.forgottenPassword}
                          fill="text"
                          href={`${config.appSubUrl}/user/password/send-reset-email`}
                        >
                          <Trans i18nKey="login.forgot-password">Forgot your password?</Trans>
                        </LinkButton>
                      )}
                    </Stack>
                  </LoginForm>
                )}
                {config.auth.passwordlessEnabled && (
                  <PasswordlessLoginForm onSubmit={passwordlessStart} isLoggingIn={isLoggingIn}></PasswordlessLoginForm>
                )}
                <LoginServiceButtons />
                {!disableUserSignUp && <UserSignup />}
              </InnerBox>
            )}

            {config.auth.passwordlessEnabled && showPasswordlessConfirmation && (
              <InnerBox>
                <PasswordlessConfirmation
                  onSubmit={passwordlessConfirm}
                  isLoggingIn={isLoggingIn}
                ></PasswordlessConfirmation>
              </InnerBox>
            )}

            {isChangingPassword && !config.auth.passwordlessEnabled && (
              <InnerBox>
                <ChangePassword
                  showDefaultPasswordWarning={showDefaultPasswordWarning}
                  onSubmit={changePassword}
                  onSkip={() => skipPasswordChange()}
                />
              </InnerBox>
            )}
          </LoginLayout>
        )}
      </LoginCtrl>
    </Page>
  );
};

export default LoginPage;

const getStyles = (theme: GrafanaTheme2) => {
  return {
    forgottenPassword: css({
      padding: 0,
      marginTop: theme.spacing(0.5),
      fontSize: '12px',
      fontWeight: 500,
      fontStyle: 'italic',
      color: theme.isDark ? 'rgba(30, 64, 175, 1)' : 'rgba(30, 58, 138, 1)',
      transition: 'all 0.2s ease',
      textAlign: 'right',
      textDecoration: 'none',
      
      // Mobile-first: compact for small screens
      '@media (max-width: 480px)': {
        marginTop: theme.spacing(0.3),
        fontSize: '11px',
      },
      
      '&:hover': {
        color: theme.isDark ? 'rgba(37, 99, 235, 1)' : 'rgba(29, 78, 216, 1)',
        textDecoration: 'underline',
      },
      
      [theme.breakpoints.up('sm')]: {
        fontSize: '12px',
        marginTop: theme.spacing(0.6),
      },
      
      [theme.breakpoints.up('md')]: {
        fontSize: '13px',
        marginTop: theme.spacing(0.75),
      },
      
      [theme.breakpoints.up('lg')]: {
        fontSize: '13px',
        marginTop: theme.spacing(1),
      },
    }),

    alert: css({
      width: '100%',
      marginBottom: theme.spacing(1.5),
      borderRadius: '10px',
      border: 'none',
      backgroundColor: theme.isDark
        ? 'rgba(239, 68, 68, 0.1)'
        : 'rgba(254, 242, 242, 1)',
      
      [theme.breakpoints.up('sm')]: {
        marginBottom: theme.spacing(2),
      },
    }),
  };
};
