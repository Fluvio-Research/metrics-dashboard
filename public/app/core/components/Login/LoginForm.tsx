import { css } from '@emotion/css';
import { ReactElement, useId } from 'react';
import { useForm } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { Button, Input, Field, useStyles2 } from '@grafana/ui';

import { PasswordField } from '../PasswordField/PasswordField';

import { FormModel } from './LoginCtrl';

interface Props {
  children: ReactElement;
  onSubmit: (data: FormModel) => void;
  isLoggingIn: boolean;
  passwordHint: string;
  loginHint: string;
}

export const LoginForm = ({ children, onSubmit, isLoggingIn, passwordHint, loginHint }: Props) => {
  const styles = useStyles2(getStyles);
  const usernameId = useId();
  const passwordId = useId();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormModel>({ mode: 'onChange' });

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Field
          label={t('login.form.username-label', 'Email or username')}
          invalid={!!errors.user}
          error={errors.user?.message}
        >
          <Input
            {...register('user', { required: t('login.form.username-required', 'Email or username is required') })}
            id={usernameId}
            autoFocus
            autoCapitalize="none"
            placeholder={loginHint || t('login.form.username-placeholder', 'email or username')}
            data-testid={selectors.pages.Login.username}
          />
        </Field>
        <Field
          label={t('login.form.password-label', 'Password')}
          invalid={!!errors.password}
          error={errors.password?.message}
        >
          <PasswordField
            {...register('password', { required: t('login.form.password-required', 'Password is required') })}
            id={passwordId}
            autoComplete="current-password"
            placeholder={passwordHint || t('login.form.password-placeholder', 'password')}
          />
        </Field>
        <Button
          type="submit"
          data-testid={selectors.pages.Login.submit}
          className={styles.submitButton}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? t('login.form.submit-loading-label', 'Logging in...') : t('login.form.submit-label', 'Log in')}
        </Button>
        {children}
      </form>
    </div>
  );
};

export const getStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css({
      width: '100%',
      maxWidth: '100%',
      paddingBottom: theme.spacing(0.5),
      paddingTop: theme.spacing(0),
      boxSizing: 'border-box',
      overflow: 'hidden',
      
      // Mobile-first: compact for small screens
      '@media (max-width: 480px)': {
        paddingBottom: theme.spacing(0.25),
        paddingTop: theme.spacing(0),
      },
      
      // Professional form styling
      '& label': {
        fontWeight: 600,
        fontSize: '13px',
        letterSpacing: '0',
        marginBottom: theme.spacing(0.4),
        color: theme.isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        display: 'block',
        width: '100%',
        
        '@media (max-width: 480px)': {
          marginBottom: theme.spacing(0.3),
          fontSize: '12px',
        },
        
        [theme.breakpoints.up('sm')]: {
          fontSize: '13px',
        },
        
        [theme.breakpoints.up('md')]: {
          fontSize: '14px',
        },
      },
      
      // Field wrapper
      '& [class*="Field"]': {
        width: '100%',
        maxWidth: '100%',
        marginBottom: 0,
      },
      
      // Professional input field styling
      '& input': {
        width: '100%',
        maxWidth: '100%',
        height: '38px',
        fontSize: '14px',
        borderRadius: '10px',
        border: theme.isDark 
          ? '2px solid rgba(51, 65, 85, 1)' 
          : '2px solid rgba(226, 232, 240, 1)',
        backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 1)' : 'rgba(248, 250, 252, 1)',
        transition: 'all 0.2s ease',
        padding: '0 12px',
        color: theme.isDark ? 'rgba(255, 255, 255, 0.98)' : 'rgba(15, 23, 42, 0.98)',
        fontWeight: 400,
        boxSizing: 'border-box',
        
        '@media (max-width: 480px)': {
          height: '36px',
          fontSize: '13px',
          padding: '0 10px',
        },
        
        [theme.breakpoints.up('sm')]: {
          height: '40px',
          fontSize: '14px',
          padding: '0 14px',
        },
        
        [theme.breakpoints.up('md')]: {
          height: '42px',
          fontSize: '14px',
          padding: '0 14px',
        },
        
        [theme.breakpoints.up('lg')]: {
          height: '44px',
          fontSize: '15px',
          padding: '0 16px',
        },
        
        '&::placeholder': {
          fontSize: '14px',
          color: theme.isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)',
          fontWeight: 400,
          
          '@media (max-width: 480px)': {
            fontSize: '14px',
          },
          
          [theme.breakpoints.up('sm')]: {
            fontSize: '15px',
          },
          
          [theme.breakpoints.up('lg')]: {
            fontSize: '16px',
          },
        },
        
        '&:focus': {
          borderColor: theme.isDark ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)',
          boxShadow: theme.isDark 
            ? '0 0 0 3px rgba(59, 130, 246, 0.1)' 
            : '0 0 0 3px rgba(37, 99, 235, 0.1)',
          outline: 'none',
          backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 1)' : 'rgba(255, 255, 255, 1)',
        },
        
        '&:hover:not(:focus)': {
          borderColor: theme.isDark ? 'rgba(71, 85, 105, 1)' : 'rgba(203, 213, 225, 1)',
        },
      },
      
      // Fix vertical alignment of password field suffix (eye icon)
      '& [data-testid="input-wrapper"]': {
        display: 'flex !important',
        alignItems: 'stretch !important',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
      },
      
      '& [class*="input-suffix"]': {
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        height: '100% !important',
        top: '0 !important',
        bottom: '0 !important',
        position: 'absolute',
        right: '12px !important',
        padding: '0 !important',
        
        '@media (max-width: 480px)': {
          right: '10px !important',
        },
      },
      
      '& [class*="input-suffix"] > *': {
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        height: '100% !important',
        margin: '0 !important',
      },
      
      '& [class*="input-suffix"] button, & [class*="input-suffix"] > button': {
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        margin: '0 !important',
        padding: '0 8px !important',
        height: '100% !important',
        minWidth: 'auto !important',
        alignSelf: 'center !important',
        verticalAlign: 'middle !important',
      },
      
      '& [class*="input-suffix"] svg': {
        verticalAlign: 'middle !important',
        display: 'inline-block !important',
        width: '18px !important',
        height: '18px !important',
      },
      
      // Improved form structure
      '& > form': {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        
        '@media (max-width: 480px)': {
          gap: theme.spacing(0.75),
        },
        
        [theme.breakpoints.up('sm')]: {
          gap: theme.spacing(1.25),
        },
        
        [theme.breakpoints.up('md')]: {
          gap: theme.spacing(1.5),
        },
        
        [theme.breakpoints.up('lg')]: {
          gap: theme.spacing(1.75),
        },
      },
    }),

    submitButton: css({
      justifyContent: 'center',
      width: '100%',
      maxWidth: '100%',
      marginTop: theme.spacing(0.25),
      height: '38px',
      fontSize: '14px',
      fontWeight: 600,
      borderRadius: '10px',
      textTransform: 'none',
      letterSpacing: '-0.01em',
      boxSizing: 'border-box',
      
      // Mobile-first: compact for small screens
      '@media (max-width: 480px)': {
        height: '36px',
        fontSize: '13px',
        marginTop: theme.spacing(0.15),
      },
      
      // Clean, solid blue button
      background: theme.isDark ? '#3b82f6' : '#2563eb',
      border: 'none',
      boxShadow: 'none',
      transition: 'all 0.2s ease',
      color: '#ffffff',
      
      '&:hover:not(:disabled)': {
        background: theme.isDark ? '#2563eb' : '#1d4ed8',
        transform: 'translateY(-1px)',
        boxShadow: theme.isDark 
          ? '0 4px 12px rgba(37, 99, 235, 0.3)' 
          : '0 4px 12px rgba(37, 99, 235, 0.25)',
      },
      
      '&:active:not(:disabled)': {
        transform: 'translateY(0)',
        background: theme.isDark ? '#1d4ed8' : '#1e40af',
        boxShadow: 'none',
      },
      
      '&:disabled': {
        opacity: 0.4,
        cursor: 'not-allowed',
        background: theme.isDark ? '#64748b' : '#94a3b8',
      },
      
      [theme.breakpoints.up('sm')]: {
        height: '40px',
        fontSize: '14px',
      },
      
      [theme.breakpoints.up('md')]: {
        height: '42px',
        fontSize: '14px',
      },
      
      [theme.breakpoints.up('lg')]: {
        height: '44px',
        fontSize: '15px',
      },
    }),

    skipButton: css({
      alignSelf: 'flex-start',
    }),
  };
};
