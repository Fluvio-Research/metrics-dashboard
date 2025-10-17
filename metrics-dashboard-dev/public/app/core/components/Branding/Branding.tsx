import { css, cx } from '@emotion/css';
import { FC, useEffect, useState } from 'react';

import { colorManipulator } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import g8LoginDarkSvg from 'img/g8_login_dark.svg';
import g8LoginLightSvg from 'img/g8_login_light.svg';
import metricsIconSvg from 'img/metrics_icon.svg';
import fluvioIconPng from 'img/fluvio_icon.png';

// ====================================
// 🎨 CENTRALIZED LOGO CONFIGURATION
// ====================================
// Change these paths to update ALL logos and icons across the entire application
const LOGO_CONFIG = {
  // Main logo used throughout the app (login, navigation, etc.)
  mainLogo: fluvioIconPng,
  // Alternative logo (if needed for specific contexts)
  altLogo: metricsIconSvg,
  
  // App branding & titles
  appTitle: 'Fluvio Cascade',
  loginTitle: '',
  
  // Icon files for favicon, apple-touch-icon, etc.
  iconFiles: {
    favicon: 'public/img/fav32.png',
    appleTouchIcon: 'public/img/apple-touch-icon.png',
    faviconIco: 'public/favicon.ico',
  },
  
  // Organization/Company info
  company: {
    name: 'Fluvio Cascade',
    fullName: 'Fluvio Cascade Analytics Platform',
    shortName: 'Cascade',
  }
};

export interface BrandComponentProps {
  className?: string;
  children?: JSX.Element | JSX.Element[];
}

export const LoginLogo: FC<BrandComponentProps & { logo?: string }> = ({ className, logo }) => {
  return <img className={className} src={`${logo ? logo : LOGO_CONFIG.mainLogo}`} alt={LOGO_CONFIG.appTitle} />;
};

const LoginBackground: FC<BrandComponentProps> = ({ className, children }) => {
  const theme = useTheme2();

  const background = css({
    '&:before': {
      content: '""',
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      background: `url(${theme.isDark ? g8LoginDarkSvg : g8LoginLightSvg})`,
      backgroundPosition: 'top center',
      backgroundSize: 'auto',
      backgroundRepeat: 'no-repeat',

      opacity: 0,
      transition: 'opacity 3s ease-in-out',

      [theme.breakpoints.up('md')]: {
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      },
    },
  });

  return <div className={cx(background, className)}>{children}</div>;
};

const MenuLogo: FC<BrandComponentProps> = ({ className }) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const theme = useTheme2();
  
  useEffect(() => {
    // Animation plays only once on mount
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 1000); // Animation duration
    
    return () => clearTimeout(timer);
  }, []);
  
  const animationStyles = css({
    animation: isAnimating ? 'logoIntro 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
    transformOrigin: 'center center',
    
    '@keyframes logoIntro': {
      '0%': {
        transform: 'scale(0.5)',
        opacity: 0,
      },
      '50%': {
        transform: 'scale(1.3)',
        opacity: 0.8,
        filter: theme.isDark 
          ? 'drop-shadow(0 0 12px rgba(77, 172, 255, 0.6))' 
          : 'drop-shadow(0 0 8px rgba(77, 172, 255, 0.4))',
      },
      '100%': {
        transform: 'scale(1)',
        opacity: 1,
        filter: 'drop-shadow(0 0 0 transparent)',
      },
    },
  });
  
  return (
    <img 
      className={cx(className, animationStyles)} 
      src={LOGO_CONFIG.mainLogo} 
      alt={LOGO_CONFIG.appTitle} 
    />
  );
};

const LoginBoxBackground = () => {
  const theme = useTheme2();
  return css({
    background: colorManipulator.alpha(theme.colors.background.primary, 0.7),
    backgroundSize: 'cover',
  });
};

export class Branding {
  static LoginLogo = LoginLogo;
  static LoginBackground = LoginBackground;
  static MenuLogo = MenuLogo;
  static LoginBoxBackground = LoginBoxBackground;
  static AppTitle = LOGO_CONFIG.appTitle;
  static LoginTitle = LOGO_CONFIG.loginTitle;
  static HideEdition = false;
  static GetLoginSubTitle = (): null | string => {
    return null;
  };
}
