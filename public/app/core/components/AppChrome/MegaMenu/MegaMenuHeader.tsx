import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { IconButton, Stack, ToolbarButton, useTheme2 } from '@grafana/ui';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { contextSrv } from 'app/core/services/context_srv';

import { OrganizationSwitcher } from '../OrganizationSwitcher/OrganizationSwitcher';
import { getChromeHeaderLevelHeight } from '../TopBar/useChromeHeaderHeight';
import mainSiwisLogo from 'img/MAIN_SIWIS.png';
import siwisMenuBanner from 'img/siwis-menu-banner.jpg';

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

  const isSuperAdmin = Boolean((contextSrv.user as any).isSuperAdmin ?? contextSrv.user.isGrafanaAdmin);
  const isOrgAdmin = contextSrv.hasRole('Admin');
  const isRestrictedUser = !isOrgAdmin && !isSuperAdmin;

  const styles = getStyles(theme, isRestrictedUser);

  return (
    <div className={styles.header}>
      {isRestrictedUser ? (
        // SIWIS branding for non-admin users
        <div className={styles.brandingContainer}>
          <div className={styles.logoWrapper}>
            <img src={mainSiwisLogo} alt="Solomon Islands Coat of Arms" className={styles.mainSiwisLogo} />
          </div>
          <div className={styles.textWrapper}>
            <span className={styles.brandText}>SIWIS</span>
            <span className={styles.brandSubtext}>Solomon Islands<br />Water Information System</span>
          </div>
        </div>
      ) : (
        // Branding for admin / super-admin users
        <Stack alignItems="center" minWidth={0} gap={0.25}>
          <ToolbarButton
            narrow
            id={MEGA_MENU_HEADER_TOGGLE_ID}
            onClick={handleMegaMenu}
            tooltip={t('navigation.megamenu.close', 'Close menu')}
          >
            <img src={mainSiwisLogo} alt="Solomon Islands Coat of Arms" className={styles.adminMainLogo} />
          </ToolbarButton>
          <OrganizationSwitcher />
        </Stack>
      )}
      <IconButton
        id={DOCK_MENU_BUTTON_ID}
        className={styles.dockMenuButton}
        tooltip={
          state.megaMenuDocked
            ? t('navigation.megamenu.undock', 'Unlock menu')
            : t('navigation.megamenu.dock', 'Lock menu')
        }
        name={state.megaMenuDocked ? 'lock' : 'unlock'}
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

const getStyles = (theme: GrafanaTheme2, isRestrictedUser: boolean) => {
  // Shared banner background — show the left side of the image (circular tribal pattern)
  // which looks best behind the logo positioned on the left
  const bannerBg = `linear-gradient(rgba(0, 15, 42, 0.44), rgba(0, 15, 42, 0.44)), url(${siwisMenuBanner})`;

  if (!isRestrictedUser) {
    // Admin / super-admin: compact 40px header with banner
    return {
      dockMenuButton: css({
        display: 'none',
        color: 'rgba(255,255,255,0.85)',
        [theme.breakpoints.up('xl')]: { display: 'inline-flex' },
      }),
      header: css({
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        borderRight: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        gap: theme.spacing(1),
        justifyContent: 'space-between',
        padding: theme.spacing(0, 1, 0, 0.75),
        height: getChromeHeaderLevelHeight(),
        flexShrink: 0,
        backgroundImage: bannerBg,
        backgroundSize: 'cover',
        // Show the left portion (tribal circular motif) — most striking part
        backgroundPosition: '15% center',
        // All text / icons white so they read on the dark banner
        '& button, & [class*="Label"], & [class*="label"], & span': {
          color: 'rgba(255,255,255,0.92) !important',
        },
        '& svg': {
          color: 'rgba(255,255,255,0.85) !important',
        },
      }),
      adminMainLogo: css({
        height: theme.spacing(3.5),
        width: 'auto',
        objectFit: 'contain',
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
      }),
      // Unused in this branch
      brandingContainer: css({ display: 'none' }),
      logoWrapper: css({ display: 'none' }),
      mainSiwisLogo: css({ display: 'none' }),
      textWrapper: css({ display: 'none' }),
      brandText: css({ display: 'none' }),
      brandSubtext: css({ display: 'none' }),
      mobileCloseButton: css({
        color: 'rgba(255,255,255,0.85)',
        [theme.breakpoints.up('md')]: { display: 'none' },
      }),
    };
  }

  // Non-admin users: taller 64px header with full SIWIS branding
  return {
    dockMenuButton: css({
      display: 'none',
      color: 'rgba(255,255,255,0.8)',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.1)',
        transform: 'scale(1.05)',
      },
      '&:active': { transform: 'scale(0.98)' },
      [theme.breakpoints.up('xl')]: { display: 'inline-flex' },
    }),
    header: css({
      alignItems: 'center',
      borderBottom: 'none',
      borderRight: '1px solid rgba(255,255,255,0.12)',
      display: 'flex',
      gap: theme.spacing(1),
      justifyContent: 'space-between',
      padding: theme.spacing(0, 0.75, 0, 0.75),
      height: getChromeHeaderLevelHeight(), // 64px for non-admin
      flexShrink: 0,
      backgroundImage: bannerBg,
      backgroundSize: 'cover',
      // Show left-centre of image — circular tribal pattern sits behind the logo
      backgroundPosition: '15% center',
      position: 'relative',
      // Thin brand-colour accent line at the bottom
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, rgba(78,191,242,0.9) 0%, rgba(36,122,190,0.7) 50%, rgba(78,191,242,0.9) 100%)',
      },
    }),
    // Unused in this branch
    adminMainLogo: css({ display: 'none' }),
    brandingContainer: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.25),
      padding: theme.spacing(0, 0.5),
      minWidth: 0,
      flex: 1,
    }),
    logoWrapper: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      // Larger logo — fills the 64px header more prominently
      width: theme.spacing(7.25),   // 58px
      height: theme.spacing(7.25),  // 58px
      borderRadius: '6px',
      background: 'rgba(255,255,255,0.82)',
      border: '2px solid rgba(255,255,255,0.9)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(78,191,242,0.3)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
    }),
    mainSiwisLogo: css({
      width: '90%',
      height: '90%',
      objectFit: 'contain',
    }),
    textWrapper: css({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '2px',
      minWidth: 0,
      flex: 1,
    }),
    brandText: css({
      fontSize: '17px',
      fontWeight: 700,
      letterSpacing: '1.5px',
      color: 'rgba(255,255,255,0.97)',
      textShadow: '0 1px 6px rgba(0,0,0,0.7)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      lineHeight: 1.2,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    }),
    brandSubtext: css({
      fontSize: '9.5px',
      fontWeight: 500,
      letterSpacing: '0.4px',
      color: 'rgba(255,255,255,0.78)',
      textShadow: '0 1px 4px rgba(0,0,0,0.6)',
      whiteSpace: 'normal',
      lineHeight: 1.3,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    }),
    mobileCloseButton: css({
      color: 'rgba(255,255,255,0.85)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.1)',
        transform: 'scale(1.05)',
      },
      [theme.breakpoints.up('md')]: { display: 'none' },
    }),
  };
};
