import { css, cx } from '@emotion/css';
import { FC } from 'react';

import { colorManipulator } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import g8LoginDarkSvg from 'img/g8_login_dark.svg';
import g8LoginLightSvg from 'img/g8_login_light.svg';
import grafanaIconPng from 'img/grafana_icon.png';
import fluvioIconPng from 'img/fluvio_icon.png';

// ====================================
// 🎨 CENTRALIZED LOGO CONFIGURATION
// ====================================
// Change these paths to update ALL logos and icons across the entire application
const LOGO_CONFIG = {
  // Main logo used throughout the app (login, navigation, etc.)
  mainLogo: fluvioIconPng,
  // Alternative logo (if needed for specific contexts)
  altLogo: grafanaIconPng,
  
  // App branding & titles
  appTitle: 'Fluvio Cascade',
  loginTitle: 'Welcome to Fluvio Cascade',
  
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
  return <img className={className} src={LOGO_CONFIG.mainLogo} alt={LOGO_CONFIG.appTitle} />;
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
