import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { IconButton, Stack, ToolbarButton, useTheme2 } from '@grafana/ui';
import { useGrafana } from 'app/core/context/GrafanaContext';

import { Branding } from '../../Branding/Branding';
import { OrganizationSwitcher } from '../OrganizationSwitcher/OrganizationSwitcher';
import { getChromeHeaderLevelHeight } from '../TopBar/useChromeHeaderHeight';

export interface Props {
  handleMegaMenu: () => void;
  handleDockedMenu: () => void;
  onClose: () => void;
}

export const DOCK_MENU_BUTTON_ID = 'dock-menu-button';
export const MEGA_MENU_HEADER_TOGGLE_ID = 'mega-menu-header-toggle';

export function MegaMenuHeader({ handleMegaMenu, handleDockedMenu, onClose }: Props) {
  const theme = useTheme2();
  const { chrome } = useGrafana();
  const state = chrome.useState();

  const styles = getStyles(theme);

  return (
    <div className={styles.header}>
      <Stack alignItems="center" minWidth={0} gap={0.25}>
        <ToolbarButton
          narrow
          id={MEGA_MENU_HEADER_TOGGLE_ID}
          onClick={handleMegaMenu}
          tooltip={t('navigation.megamenu.close', 'Close menu')}
        >
          <Branding.MenuLogo className={styles.img} />
        </ToolbarButton>
        <OrganizationSwitcher />
      </Stack>
      <IconButton
        id={DOCK_MENU_BUTTON_ID}
        className={styles.dockMenuButton}
        tooltip={
          state.megaMenuDocked
            ? t('navigation.megamenu.undock', 'Unlock menu')
            : t('navigation.megamenu.dock', 'Lock menu')
        }
        name={state.megaMenuDocked ? "lock" : "unlock"}
        onClick={handleDockedMenu}
        variant="secondary"
      />
      <IconButton
        className={styles.mobileCloseButton}
        tooltip={t('navigation.megamenu.close', 'Close menu')}
        name="times"
        onClick={onClose}
        size="xl"
        variant="secondary"
      />
    </div>
  );
}

MegaMenuHeader.displayName = 'MegaMenuHeader';

const getStyles = (theme: GrafanaTheme2) => {
  const isDarkTheme = theme.colors.mode === 'dark';
  
  return {
    dockMenuButton: css({
      display: 'none',
      transition: 'all 0.2s ease-in-out',
      
      '&:hover': {
        backgroundColor: isDarkTheme 
          ? 'rgba(77, 172, 255, 0.08)' 
          : 'rgba(77, 172, 255, 0.06)',
        transform: 'scale(1.05)',
        boxShadow: `0 2px 8px ${isDarkTheme ? 'rgba(77, 172, 255, 0.2)' : 'rgba(77, 172, 255, 0.15)'}`,
      },
      
      '&:active': {
        transform: 'scale(0.98)',
      },

      [theme.breakpoints.up('xl')]: {
        display: 'inline-flex',
      },
    }),
    header: css({
      alignItems: 'center',
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      display: 'flex',
      gap: theme.spacing(1),
      justifyContent: 'space-between',
      padding: theme.spacing(0, 1, 0, 0.75),
      height: getChromeHeaderLevelHeight(),
      flexShrink: 0,
      backgroundColor: isDarkTheme 
        ? theme.colors.background.secondary 
        : theme.colors.background.primary,
      
      // Add subtle shadow for depth
      boxShadow: isDarkTheme 
        ? '0 2px 4px rgba(0, 0, 0, 0.3)' 
        : '0 1px 3px rgba(0, 0, 0, 0.1)',
      
      // Modern gradient accent
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: theme.colors.gradients.brandVertical,
      },
    }),
    img: css({
      alignSelf: 'center',
      height: theme.spacing(3),
      width: theme.spacing(3),
      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      '&:hover': {
        transform: 'scale(1.1)',
      },
    }),
    mobileCloseButton: css({
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      '&:hover': {
        backgroundColor: isDarkTheme 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.05)',
        transform: 'scale(1.05)',
      },
      
      [theme.breakpoints.up('md')]: {
        display: 'none',
      },
    }),
  };
};
