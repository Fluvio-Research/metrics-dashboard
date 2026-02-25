import { cx, css, keyframes } from '@emotion/css';
import { useEffect, useState } from 'react';
import * as React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

import { Branding } from '../Branding/Branding';
import { BrandingSettings } from '../Branding/types';
import cascadeHorizontalLogo from 'img/CacadeNewHorizontal.png';
import wrdLogo from 'img/logo.svg';
import solomonGovLogo from 'img/MAIN_SIWIS.png';

interface InnerBoxProps {
  enterAnimation?: boolean;
}
export const InnerBox = ({ children, enterAnimation = true }: React.PropsWithChildren<InnerBoxProps>) => {
  const loginStyles = useStyles2(getLoginStyles);
  return <div className={cx(loginStyles.loginInnerBox, enterAnimation && loginStyles.enterAnimation)}>{children}</div>;
};

export interface LoginLayoutProps {
  /** Custom branding settings that can be used e.g. for previewing the Login page changes */
  branding?: BrandingSettings;
  isChangingPassword?: boolean;
}

export const LoginLayout = ({ children, branding }: React.PropsWithChildren<LoginLayoutProps>) => {
  const loginStyles = useStyles2(getLoginStyles);
  const [startAnim, setStartAnim] = useState(false);
  const loginBoxBackground = branding?.loginBoxBackground || Branding.LoginBoxBackground();
  // loginLogo available via: branding?.loginLogo

  useEffect(() => setStartAnim(true), []);

  return (
    <Branding.LoginBackground
      className={cx(loginStyles.container, startAnim && loginStyles.loginAnim, branding?.loginBackground)}
    >
      <div className={loginStyles.loginMain}>
        <div className={cx(loginStyles.splitContainer, 'login-content-box')}>
          {/* Login Form - Single Panel */}
          <div className={cx(loginStyles.loginContent, loginBoxBackground)}>
            <div className={loginStyles.loginHeader}>
              {/* Dual Logo Container - WRD and Solomon Government */}
              <div className={loginStyles.dualLogoContainer}>
                <div className={loginStyles.logoBox}>
                  <img src={wrdLogo} alt="Water Resources Division" className={loginStyles.loginLogoImg} />
                </div>
                <div className={loginStyles.logoBox}>
                  <img src={solomonGovLogo} alt="Solomon Islands Government" className={loginStyles.loginLogoImg} />
                </div>
              </div>
              <h2 className={loginStyles.loginTitle}>Solomon Islands Water Information System</h2>
            </div>
            <div className={loginStyles.loginFormWrapper}>
              {children}
            </div>
          </div>
        </div>
        {/* Footer below the panel */}
        <div className={loginStyles.loginFooter}>
          <div className={loginStyles.poweredBy}>
            <span className={loginStyles.poweredByText}>Powered by</span>
            <img src={cascadeHorizontalLogo} alt="Cascade" className={loginStyles.cascadeLogo} />
          </div>
        </div>
      </div>
    </Branding.LoginBackground>
  );
};

const flyInAnimation = keyframes`
from{
  opacity: 0;
  transform: translate(-60px, 0px);
}

to{
  opacity: 1;
  transform: translate(0px, 0px);
}`;

export const getLoginStyles = (theme: GrafanaTheme2) => {
  return {
    loginMain: css({
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: theme.spacing(1),
      minHeight: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      boxSizing: 'border-box',
      gap: theme.spacing(1.5),
      
      [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(1.5),
        gap: theme.spacing(2),
      },
      
      [theme.breakpoints.up('md')]: {
        padding: theme.spacing(2),
        gap: theme.spacing(2),
      },
      
      [theme.breakpoints.up('lg')]: {
        padding: 0,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: theme.spacing(6),
        paddingLeft: theme.spacing(3),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        gap: theme.spacing(2),
      },
      
      [theme.breakpoints.up('xl')]: {
        paddingRight: theme.spacing(8),
        paddingLeft: theme.spacing(4),
      },
    }),
    container: css({
      minHeight: '100vh',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      flex: 1,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      
      [theme.breakpoints.up('lg')]: {
        alignItems: 'flex-end',
      },
    }),
    splitContainer: css({
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '96%',
      maxHeight: '96vh',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: theme.isDark
        ? '0 12px 40px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)'
        : '0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
      opacity: 0,
      transform: 'scale(0.98)',
      marginLeft: 'auto',
      marginRight: 'auto',
      boxSizing: 'border-box',
      
      // Responsive scaling for small screens - more compact
      '@media (max-height: 800px)': {
        maxHeight: '98vh',
      },
      
      '@media (max-height: 700px)': {
        transform: 'scale(0.92)',
        maxHeight: '98vh',
      },
      
      '@media (max-height: 600px)': {
        transform: 'scale(0.85)',
      },
      
      '@media (max-height: 500px)': {
        transform: 'scale(0.75)',
      },
      
      [theme.transitions.handleMotion('no-preference', 'reduce')]: {
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      
      [theme.breakpoints.up('sm')]: {
        maxWidth: 400,
        borderRadius: '18px',
        '@media (max-height: 700px)': {
          transform: 'scale(0.92)',
        },
        '@media (max-height: 600px)': {
          transform: 'scale(0.85)',
        },
      },
      
      [theme.breakpoints.up('md')]: {
        maxWidth: 420,
        '@media (max-height: 700px)': {
          transform: 'scale(0.95)',
        },
      },
      
      [theme.breakpoints.up('lg')]: {
        maxWidth: 460,
        marginLeft: 'auto',
        marginRight: '0',
        '@media (max-height: 700px)': {
          transform: 'scale(1)',
        },
      },
      
      [theme.breakpoints.up('xl')]: {
        maxWidth: 480,
      },
    }),
    brandingPanel: css({
      background: theme.isDark
        ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(37, 99, 235, 0.04) 100%)',
      padding: theme.spacing(4, 3),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 240,
      position: 'relative',
      border: 'none',
      overflow: 'hidden',
      
      [theme.breakpoints.up('sm')]: {
        minHeight: 280,
        padding: theme.spacing(5, 4),
      },
      
      [theme.breakpoints.up('lg')]: {
        display: 'none',
      },
      
      [theme.breakpoints.up('xl')]: {
        display: 'none',       
      },
    }),
    loginHeader: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',          
      width: '100%',
      marginBottom: theme.spacing(0.25),                
      flexShrink: 1,
      minHeight: 0,
      
      // Mobile-first: compact for small screens
      '@media (max-width: 480px)': {
        marginBottom: theme.spacing(0.15),
      },
      
      [theme.breakpoints.up('sm')]: {
        marginBottom: theme.spacing(0.4),
      },
      
      [theme.breakpoints.up('md')]: {
        marginBottom: theme.spacing(0.6),
      },
      
      [theme.breakpoints.up('lg')]: {
        marginBottom: theme.spacing(1),
      },
      
      [theme.breakpoints.up('xl')]: {
        marginBottom: theme.spacing(1.25),
      },
    }),
    dualLogoContainer: css({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(4),
      marginBottom: theme.spacing(2),
      width: '100%',
      
      '@media (max-width: 480px)': {
        gap: theme.spacing(2.5),
        marginBottom: theme.spacing(1.5),
      },
      
      [theme.breakpoints.up('sm')]: {
        gap: theme.spacing(4),
        marginBottom: theme.spacing(2),
      },
      
      [theme.breakpoints.up('md')]: {
        gap: theme.spacing(5),
        marginBottom: theme.spacing(2.5),
      },
      
      [theme.breakpoints.up('lg')]: {
        gap: theme.spacing(6),
        marginBottom: theme.spacing(2.75),
      },
    }),
    logoBox: css({
      width: '90px',
      height: '90px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Clean, no background - just the logo
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      padding: 0,
      flexShrink: 0,
      
      '@media (max-width: 480px)': {
        width: '70px',
        height: '70px',
      },
      
      [theme.breakpoints.up('sm')]: {
        width: '100px',
        height: '100px',
      },
      
      [theme.breakpoints.up('md')]: {
        width: '110px',
        height: '110px',
      },
      
      [theme.breakpoints.up('lg')]: {
        width: '120px',
        height: '120px',
      },
      
      [theme.breakpoints.up('xl')]: {
        width: '130px',
        height: '130px',
      },
    }),
    loginLogoImg: css({
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      // Professional drop shadow for depth without background boxes
      filter: 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.15))',
      transition: 'transform 0.3s ease, filter 0.3s ease',
      
      '&:hover': {
        transform: 'scale(1.02)',
        filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.2))',
      },
    }),
    logoContainer: css({
      width: '100px',
      height: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing(1.5),
      position: 'relative',
      flexShrink: 0,
      
      // Mobile-first: compact for small screens
      '@media (max-width: 480px)': {
        width: '80px',
        height: '80px',
        marginBottom: theme.spacing(1),
      },
      
      [theme.breakpoints.up('sm')]: {
        width: '110px',
        height: '110px',
        marginBottom: theme.spacing(1.5),
      },
      
      [theme.breakpoints.up('md')]: {
        width: '120px',
        height: '120px',
        marginBottom: theme.spacing(1.75),
      },
      
      [theme.breakpoints.up('lg')]: {
        width: '130px',
        height: '130px',
        marginBottom: theme.spacing(2),
      },
      
      [theme.breakpoints.up('xl')]: {
        width: '140px',
        height: '140px',
        marginBottom: theme.spacing(2.25),
      },
    }),
    brandingLogo: css({
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      position: 'relative',
      zIndex: 1,
      filter: theme.isDark 
        ? 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))'
        : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
      flexShrink: 0,
    }),
    brandingContent: css({
      textAlign: 'center',
      color: '#ffffff',
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    }),
    brandingTitle: css({
      fontSize: 24,
      fontWeight: 700,
      marginBottom: theme.spacing(1),
      marginTop: theme.spacing(2),
      color: '#ffffff',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      
      [theme.breakpoints.up('sm')]: {
        fontSize: 26,
        marginTop: theme.spacing(2.5),
      },
      
      [theme.breakpoints.up('lg')]: {
        fontSize: 30,
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1.5),
      },
      
      [theme.breakpoints.up('xl')]: {
        fontSize: 32,
      },
    }),
    brandingSubtitle: css({
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.85)',
      fontWeight: 400,
      letterSpacing: '0.01em',
      lineHeight: 1.5,
      maxWidth: '280px',
      
      [theme.breakpoints.up('sm')]: {
        fontSize: 15,
      },
      
      [theme.breakpoints.up('lg')]: {
        fontSize: 16,
        maxWidth: '320px',
      },
    }),
    loginAnim: css({
      '&:before': {
        opacity: 1,
      },
      
      '&:after': {
        opacity: 1,
      },

      '.login-content-box': {
        opacity: 1,
        transform: 'scale(1)',
      },
    }),
    submitButton: css({
      justifyContent: 'center',
      width: '100%',
    }),
    loginLogo: css({
      width: '100%',
    }),
    loginLogoWrapper: css({
      display: 'none',
    }),
    titleWrapper: css({
      display: 'none',
    }),
    mainTitle: css({
      display: 'none',
    }),
    subTitle: css({
      display: 'none',
    }),
    loginOuterBox: css({
      display: 'none',
    }),
    loginContent: css({
      background: theme.isDark 
        ? 'rgba(30, 41, 59, 0.95)' 
        : 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: theme.spacing(1.25, 1.5),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: 'auto',
      maxHeight: 'none',
      overflow: 'visible',
      border: 'none',
      position: 'relative',
      borderRadius: '16px',
      boxSizing: 'border-box',
      flexShrink: 1,
      
      // Mobile-first: compact for small screens
      '@media (max-width: 480px)': {
        padding: theme.spacing(1, 1.25),
      },
      
      [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(1.5, 2),
        borderRadius: '18px',
      },
      
      [theme.breakpoints.up('md')]: {
        padding: theme.spacing(2, 2.5),
      },
      
      [theme.breakpoints.up('lg')]: {
        padding: theme.spacing(2.5, 3),
      },
      
      [theme.breakpoints.up('xl')]: {
        padding: theme.spacing(2.75, 3.5),
      },
    }),
    loginTitle: css({
      fontSize: 'clamp(12px, 3vw, 18px)',
      fontWeight: 700,
      marginBottom: theme.spacing(0.2),
      marginTop: theme.spacing(0),
      color: theme.isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
      textAlign: 'center',
      letterSpacing: '-0.02em',
      lineHeight: 1.15,
      width: '100%',
      flexShrink: 1,
      
      // Mobile-first: compact for small screens
      '@media (max-width: 480px)': {
        fontSize: 'clamp(11px, 3.2vw, 15px)',
        marginBottom: theme.spacing(0.1),
        lineHeight: 1.1,
      },
      
      [theme.breakpoints.up('sm')]: {
        fontSize: 'clamp(13px, 2.8vw, 17px)',
        marginBottom: theme.spacing(0.2),
      },
      
      [theme.breakpoints.up('md')]: {
        fontSize: 'clamp(14px, 2.5vw, 18px)',
        marginBottom: theme.spacing(0.3),
      },
      
      [theme.breakpoints.up('lg')]: {
        fontSize: 'clamp(15px, 2.2vw, 19px)',
        marginBottom: theme.spacing(0.4),
        lineHeight: 1.2,
      },
    }),
    loginSubtitle: css({
      fontSize: 'clamp(11px, 2.5vw, 14px)',
      fontWeight: 400,
      color: theme.isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 1)',
      textAlign: 'center',
      lineHeight: 1.5,
      marginBottom: theme.spacing(0),
      flexShrink: 1,
      
      [theme.breakpoints.up('sm')]: {
        fontSize: 'clamp(12px, 2.2vw, 14px)',
      },
      
      [theme.breakpoints.up('md')]: {
        fontSize: 'clamp(13px, 2vw, 14px)',
      },
    }),
    loginFormWrapper: css({
      width: '100%',
      maxWidth: '100%',
      flexShrink: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
    }),
    loginFooter: css({
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 0,
      paddingTop: theme.spacing(0.75),
      paddingBottom: theme.spacing(0.4),
      flexShrink: 0,
      
      // Mobile-first: small screens
      '@media (max-width: 480px)': {
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.2),
      },
      
      [theme.breakpoints.up('sm')]: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(0.4),
      },
      
      [theme.breakpoints.up('md')]: {
        paddingTop: theme.spacing(1.25),
        paddingBottom: theme.spacing(0.6),
      },
      
      [theme.breakpoints.up('lg')]: {
        paddingTop: theme.spacing(1.5),
        paddingBottom: theme.spacing(0.75),
        maxWidth: '460px',
        marginLeft: 'auto',
        marginRight: 0,
      },
      
      [theme.breakpoints.up('xl')]: {
        maxWidth: '480px',
      },
    }),
    poweredBy: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(0.6),
      color: '#ffffff',
      flexWrap: 'wrap',
      width: '100%',
      maxWidth: '100%',
      
      // Mobile-first: small screens
      '@media (max-width: 480px)': {
        gap: theme.spacing(0.5),
      },
      
      [theme.breakpoints.up('sm')]: {
        gap: theme.spacing(0.75),
      },
      
      [theme.breakpoints.up('md')]: {
        gap: theme.spacing(1),
      },
      
      [theme.breakpoints.up('lg')]: {
        gap: theme.spacing(1.25),
      },
      
      [theme.breakpoints.up('xl')]: {
        gap: theme.spacing(1.5),
      },
    }),
    poweredByText: css({
      fontSize: 'clamp(11px, 2.5vw, 15px)',
      fontWeight: 500,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
      lineHeight: 1.2,
      color: '#ffffff',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      
      // Mobile-first: small screens
      '@media (max-width: 480px)': {
        fontSize: 'clamp(10px, 2.8vw, 12px)',
      },
      
      [theme.breakpoints.up('sm')]: {
        fontSize: 'clamp(11px, 2.4vw, 14px)',
      },
      
      [theme.breakpoints.up('md')]: {
        fontSize: 'clamp(12px, 2vw, 15px)',
      },
      
      [theme.breakpoints.up('lg')]: {
        fontSize: 'clamp(13px, 1.8vw, 15px)',
      },
      
      [theme.breakpoints.up('xl')]: {
        fontSize: 'clamp(14px, 1.6vw, 16px)',
      },
    }),
    cascadeLogo: css({
      height: 'clamp(24px, 4vw, 40px)',
      width: 'auto',
      maxWidth: '200px',
      objectFit: 'contain',
      flexShrink: 0,
      display: 'block',
      filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))',
      transform: 'scale(1)',
      transition: 'transform 0.2s ease',
      
      '&:hover': {
        transform: 'scale(1.05)',
      },
      
      // Mobile-first: small screens
      '@media (max-width: 480px)': {
        height: 'clamp(20px, 4.5vw, 28px)',
        maxWidth: '140px',
      },
      
      [theme.breakpoints.up('sm')]: {
        height: 'clamp(24px, 4vw, 32px)',
        maxWidth: '160px',
      },
      
      [theme.breakpoints.up('md')]: {
        height: 'clamp(28px, 3.5vw, 36px)',
        maxWidth: '180px',
      },
      
      [theme.breakpoints.up('lg')]: {
        height: 'clamp(32px, 3vw, 38px)',
        maxWidth: '190px',
      },
      
      [theme.breakpoints.up('xl')]: {
        height: 'clamp(36px, 2.5vw, 40px)',
        maxWidth: '200px',
      },
    }),
    loginInnerBox: css({
      padding: theme.spacing(0),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      flexGrow: 1,
      flexShrink: 1,
      maxWidth: '100%',
      width: '100%',
      gap: theme.spacing(0),
      minHeight: 0,
      overflow: 'visible',
    }),
    enterAnimation: css({
      [theme.transitions.handleMotion('no-preference')]: {
        animation: `${flyInAnimation} ease-out 0.2s`,
      },
    }),
  };
};
