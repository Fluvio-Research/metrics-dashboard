import { css } from '@emotion/css';
import { cloneDeep } from 'lodash';
import { memo } from 'react';

import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { Components } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { ScopesContextValue } from '@grafana/runtime';
import { Dropdown, Icon, Stack, ToolbarButton, useStyles2, useTheme2 } from '@grafana/ui';
import { config } from 'app/core/config';
import { MEGA_MENU_TOGGLE_ID } from 'app/core/constants';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { contextSrv } from 'app/core/core';
import { useMediaQueryMinWidth } from 'app/core/hooks/useMediaQueryMinWidth';
import { HOME_NAV_ID } from 'app/core/reducers/navModel';
import { useSelector } from 'app/types/store';

import { Breadcrumbs } from '../../Breadcrumbs/Breadcrumbs';
import { buildBreadcrumbs } from '../../Breadcrumbs/utils';
import { ExtensionToolbarItem } from '../ExtensionSidebar/ExtensionToolbarItem';
import { HistoryContainer } from '../History/HistoryContainer';
import { enrichHelpItem } from '../MegaMenu/utils';
import { NavToolbarSeparator } from '../NavToolbar/NavToolbarSeparator';
import { QuickAdd } from '../QuickAdd/QuickAdd';

import { InviteUserButton } from './InviteUserButton';
import { ProfileButton } from './ProfileButton';
import { SignInLink } from './SignInLink';
import { SingleTopBarActions } from './SingleTopBarActions';
import { TopNavBarMenu } from './TopNavBarMenu';
import { TopSearchBarCommandPaletteTrigger } from './TopSearchBarCommandPaletteTrigger';
import { ThemeToggleButton } from './ThemeToggleButton';
import { getChromeHeaderLevelHeight } from './useChromeHeaderHeight';

interface Props {
  sectionNav: NavModelItem;
  pageNav?: NavModelItem;
  onToggleMegaMenu(): void;
  onToggleKioskMode(): void;
  actions?: React.ReactNode;
  breadcrumbActions?: React.ReactNode;
  scopes?: ScopesContextValue | undefined;
  showToolbarLevel: boolean;
}

export const SingleTopBar = memo(function SingleTopBar({
  onToggleMegaMenu,
  onToggleKioskMode,
  pageNav,
  sectionNav,
  scopes,
  actions,
  breadcrumbActions,
  showToolbarLevel,
}: Props) {
  const { chrome } = useGrafana();
  const state = chrome.useState();
  const menuDockedAndOpen = !state.chromeless && state.megaMenuDocked && state.megaMenuOpen;
  const theme = useTheme2();
  const isSuperAdmin = Boolean((contextSrv.user as any).isSuperAdmin ?? contextSrv.user.isGrafanaAdmin);
  const isOrgAdmin = contextSrv.hasRole('Admin');
  const isNonAdminUser = !isOrgAdmin && !isSuperAdmin;
  const useMapsLayout = isNonAdminUser;
  const styles = useStyles2(getStyles, menuDockedAndOpen, theme.isDark);
  const navIndex = useSelector((state) => state.navIndex);
  const helpNode = cloneDeep(navIndex['help']);
  const enrichedHelpNode = helpNode ? enrichHelpItem(helpNode) : undefined;
  const profileNode = navIndex['profile'];
  const homeNav = useSelector((state) => state.navIndex)[HOME_NAV_ID];
  const breadcrumbs = buildBreadcrumbs(sectionNav, pageNav, homeNav);
  const unifiedHistoryEnabled = config.featureToggles.unifiedHistory;
  const isSmallScreen = !useMediaQueryMinWidth('sm');

  // Layout for non-admin users
  if (useMapsLayout) {
    // Get org name from context
    const orgName = contextSrv.user.orgName || 'Organization';
    
    return (
      <>
        <div className={styles.mapsLayout}>
          {/* Left Section: Menu Button */}
          <div className={styles.mapsLeftGroup}>
            {!menuDockedAndOpen && (
              <ToolbarButton
                narrow
                id={MEGA_MENU_TOGGLE_ID}
                onClick={onToggleMegaMenu}
                tooltip={t('navigation.megamenu.open', 'Open menu')}
                className={styles.mapsMenuButton}
              >
                <Icon size="lg" name="bars" />
              </ToolbarButton>
            )}
          </div>

          {/* Center Section: Organization Name - Maximized Space */}
          <div className={styles.mapsCenterSection}>
            <div className={styles.orgNameWrapper}>
              <span className={styles.orgName}>{orgName}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Default layout
  return (
    <>
      <div className={styles.layout}>
        <Stack minWidth={0} gap={0.5} alignItems="center" flex={{ xs: 2, lg: 1 }}>
          {!menuDockedAndOpen && (
            <ToolbarButton
              narrow
              id={MEGA_MENU_TOGGLE_ID}
              onClick={onToggleMegaMenu}
              tooltip={t('navigation.megamenu.open', 'Open menu')}
              iconOnly
              icon="bars"
            />
          )}
          <Breadcrumbs breadcrumbs={breadcrumbs} className={styles.breadcrumbsWrapper} />
          {!showToolbarLevel && breadcrumbActions}
        </Stack>

        <Stack
          gap={0.5}
          alignItems="center"
          justifyContent={'flex-end'}
          flex={1}
          data-testid={!showToolbarLevel ? Components.NavToolbar.container : undefined}
          minWidth={{ xs: 'unset', lg: 0 }}
        >
          <TopSearchBarCommandPaletteTrigger />
          {unifiedHistoryEnabled && !isSmallScreen && <HistoryContainer />}
          {!isSmallScreen && <QuickAdd />}
          {enrichedHelpNode && (
            <Dropdown overlay={() => <TopNavBarMenu node={enrichedHelpNode} />} placement="bottom-end">
              <ToolbarButton iconOnly icon="question-circle" aria-label={t('navigation.help.aria-label', 'Help')} />
            </Dropdown>
          )}
          <NavToolbarSeparator />
          <ThemeToggleButton />
          {config.featureToggles.extensionSidebar && !isSmallScreen && <ExtensionToolbarItem />}
          {!showToolbarLevel && actions}
          {!contextSrv.user.isSignedIn && <SignInLink />}
          {config.featureToggles.inviteUserExperimental && <InviteUserButton />}
          {profileNode && <ProfileButton profileNode={profileNode} onToggleKioskMode={onToggleKioskMode} />}
        </Stack>
      </div>
      {showToolbarLevel && (
        <SingleTopBarActions scopes={scopes} actions={actions} breadcrumbActions={breadcrumbActions} />
      )}
    </>
  );
});

const getStyles = (
  theme: GrafanaTheme2,
  menuDockedAndOpen: boolean,
  isDarkMode: boolean
) => {
  // Check if user is restricted (non-admin)
  const isSuperAdmin = Boolean((contextSrv.user as any).isSuperAdmin ?? contextSrv.user.isGrafanaAdmin);
  const isOrgAdmin = contextSrv.hasRole('Admin');
  const isRestrictedUser = !isOrgAdmin && !isSuperAdmin;
  
  // WRD color palette for non-admin users
  const mapsBorder = isDarkMode ? 'rgba(148, 163, 184, 0.32)' : isRestrictedUser ? 'rgba(36, 122, 190, 0.15)' : 'rgba(15, 23, 42, 0.08)';
  const mapsText = isDarkMode ? 'rgba(226, 232, 240, 0.88)' : 'rgba(15, 23, 42, 0.78)';
  const mapsBreadcrumbSurface = isDarkMode ? 'rgba(17, 24, 39, 0.72)' : isRestrictedUser ? 'rgba(225, 245, 254, 0.9)' : 'rgba(246, 248, 251, 0.9)';
  const mapsBreadcrumbBorder = isDarkMode ? 'rgba(148, 163, 184, 0.22)' : isRestrictedUser ? 'rgba(36, 122, 190, 0.25)' : 'rgba(148, 163, 184, 0.35)';
  const mapsBreadcrumbShadow = isDarkMode
    ? '0 10px 26px rgba(8, 15, 26, 0.4)'
    : isRestrictedUser
      ? '0 12px 24px rgba(36, 122, 190, 0.15)'
      : '0 14px 24px rgba(15, 23, 42, 0.18)';
  const mapsSeparatorColor = isDarkMode ? 'rgba(148, 163, 184, 0.6)' : isRestrictedUser ? 'rgba(36, 122, 190, 0.5)' : 'rgba(71, 85, 105, 0.55)';

  return {
    layout: css({
      height: getChromeHeaderLevelHeight(),
      display: 'flex',
      gap: theme.spacing(2),
      alignItems: 'center',
      padding: theme.spacing(0, 2),
      paddingLeft: menuDockedAndOpen ? theme.spacing(3.5) : theme.spacing(1.5),
      background: theme.isDark 
        ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 50%, rgba(17, 24, 39, 0.96) 100%)'
        : isRestrictedUser
          ? 'linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.97) 30%, rgba(238, 242, 255, 0.96) 50%, rgba(232, 239, 255, 0.96) 70%, rgba(241, 245, 249, 0.97) 100%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
      borderBottom: `1px solid ${theme.isDark ? 'rgba(98, 165, 212, 0.15)' : isRestrictedUser ? 'rgba(36, 122, 190, 0.15)' : theme.colors.border.weak}`,
      boxShadow: theme.isDark
        ? '0 3px 12px rgba(0, 0, 0, 0.35), 0 1px 4px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(98, 165, 212, 0.08)'
        : isRestrictedUser
          ? '0 3px 10px rgba(36, 122, 190, 0.15), 0 2px 6px rgba(21, 107, 183, 0.08), 0 1px 3px rgba(36, 122, 190, 0.1)'
          : '0 1px 4px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
      backdropFilter: 'blur(16px) saturate(150%)',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: theme.zIndex.navbarFixed,
      
      // Add vibrant top accent for non-admin (WRD colors)
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: isRestrictedUser && !theme.isDark ? '4px' : theme.isDark ? '3px' : '2px',
        background: theme.isDark
          ? 'linear-gradient(90deg, rgba(98, 165, 212, 0.7) 0%, rgba(131, 220, 251, 0.5) 50%, rgba(98, 165, 212, 0.7) 100%)'
          : isRestrictedUser
            ? 'linear-gradient(90deg, rgba(9, 55, 101, 0.8) 0%, rgba(36, 122, 190, 0.65) 15%, rgba(78, 191, 242, 0.75) 30%, rgba(21, 107, 183, 0.55) 50%, rgba(78, 191, 242, 0.75) 70%, rgba(36, 122, 190, 0.65) 85%, rgba(9, 55, 101, 0.8) 100%)'
            : theme.colors.gradients.brandVertical,
        boxShadow: theme.isDark
          ? 'none'
          : isRestrictedUser
            ? '0 2px 8px rgba(36, 122, 190, 0.2), 0 1px 4px rgba(21, 107, 183, 0.12)'
            : 'none',
        zIndex: 1,
      },
      
      // Subtle gradient overlay for non-admin (WRD colors)
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.isDark
          ? 'radial-gradient(ellipse at top, rgba(98, 165, 212, 0.03) 0%, transparent 50%)'
          : isRestrictedUser
            ? 'radial-gradient(ellipse at top, rgba(36, 122, 190, 0.05) 0%, rgba(21, 107, 183, 0.02) 30%, transparent 60%)'
            : 'none',
        pointerEvents: 'none',
        zIndex: 0,
      },
    }),
    leftSection: css({
      display: 'flex',
    }),
    centerSection: css({
      display: 'flex',
    }),
    rightSection: css({
      display: 'flex',
    }),
    logoButton: css({}),

    searchContainer: css({}),

    breadcrumbsWrapper: css({
      display: 'flex',
      overflow: 'hidden',
      [theme.breakpoints.down('sm')]: {
        minWidth: '40%',
      },
    }),
    modernNavButton: css({}),

    img: css({
      alignSelf: 'center',
      height: theme.spacing(3),
      width: theme.spacing(3),
    }),
    kioskToggle: css({
      [theme.breakpoints.down('lg')]: {
        display: 'none',
      },
    }),
    mapsLayout: css({
      minHeight: 64,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
      flexWrap: 'nowrap',
      padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
      paddingLeft: menuDockedAndOpen ? theme.spacing(3.5) : theme.spacing(2),
      
      // Modern gradient background
      background: isDarkMode
        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.98) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 50%, rgba(255, 255, 255, 0.98) 100%)',
      
      borderBottom: `1px solid ${mapsBorder}`,
      
      // Enhanced shadow for depth
      boxShadow: isDarkMode
        ? '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        : '0 2px 12px rgba(15, 23, 42, 0.12), 0 1px 6px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      
      backdropFilter: 'blur(16px) saturate(180%)',
      position: 'sticky',
      top: 0,
      zIndex: theme.zIndex.navbarFixed,
      
      // Animated top accent bar
      '&::before': {
        content: "''",
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: isDarkMode
          ? 'linear-gradient(90deg, rgba(96, 165, 250, 0.4) 0%, rgba(147, 197, 253, 0.6) 50%, rgba(96, 165, 250, 0.4) 100%)'
          : 'linear-gradient(90deg, rgba(59, 130, 246, 0.4) 0%, rgba(96, 165, 250, 0.6) 50%, rgba(59, 130, 246, 0.4) 100%)',
        opacity: 1,
        [theme.transitions.handleMotion('no-preference')]: {
          animation: 'topBarGlow 3s ease-in-out infinite',
        },
      },
      
      // Subtle bottom glow effect
      '&::after': {
        content: "''",
        position: 'absolute',
        bottom: -1,
        left: '20%',
        right: '20%',
        height: 1,
        background: isDarkMode
          ? 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.2), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.15), transparent)',
        opacity: 0,
        [theme.transitions.handleMotion('no-preference')]: {
          transition: 'opacity 0.3s ease',
        },
      },
      
      '&:hover::after': {
        opacity: 1,
      },
      
      // Mobile optimizations
      [theme.breakpoints.down('md')]: {
        minHeight: 56,
        padding: `${theme.spacing(0.875)} ${theme.spacing(1.5)}`,
        paddingLeft: menuDockedAndOpen ? theme.spacing(2.5) : theme.spacing(1.5),
        gap: theme.spacing(1),
      },
      
      [theme.breakpoints.down('sm')]: {
        minHeight: 52,
        padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
        paddingLeft: theme.spacing(1),
        gap: theme.spacing(0.75),
      },
      
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'box-shadow, background',
        transitionDuration: '250ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      
      // Add keyframe animation
      '@keyframes topBarGlow': {
        '0%, 100%': {
          opacity: 0.6,
        },
        '50%': {
          opacity: 1,
        },
      },
    }),
    mapsLeftGroup: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      minWidth: 'fit-content',
      color: mapsText,
      flex: '0 0 auto',
      zIndex: 1,
      
      [theme.breakpoints.down('md')]: {
        gap: theme.spacing(0.75),
      },
      
      [theme.breakpoints.down('sm')]: {
        gap: theme.spacing(0.5),
      },
    }),
    
    userGreeting: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      padding: `${theme.spacing(0.625)} ${theme.spacing(1.25)}`,
      borderRadius: theme.shape.radius.pill,
      
      background: isDarkMode
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.5) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.95) 100%)',
      
      border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.15)' : 'rgba(15, 23, 42, 0.08)'}`,
      
      boxShadow: isDarkMode
        ? '0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        : '0 1px 3px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      '&:hover': {
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.7) 0%, rgba(71, 85, 105, 0.6) 100%)'
          : 'linear-gradient(135deg, rgba(241, 245, 249, 1) 0%, rgba(226, 232, 240, 1) 100%)',
        
        borderColor: isDarkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.25)',
        
        boxShadow: isDarkMode
          ? '0 4px 12px rgba(96, 165, 250, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 2px 8px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
        
        transform: 'translateY(-1px)',
      },
    }),
    
    userIcon: css({
      color: isDarkMode ? 'rgba(147, 197, 253, 0.85)' : 'rgba(59, 130, 246, 0.85)',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    }),
    
    greetingText: css({
      fontSize: '13px',
      fontWeight: theme.typography.fontWeightRegular,
      color: isDarkMode ? 'rgba(226, 232, 240, 0.9)' : 'rgba(15, 23, 42, 0.85)',
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
      
      '& strong': {
        fontWeight: theme.typography.fontWeightMedium,
        color: isDarkMode ? 'rgba(226, 232, 240, 1)' : 'rgba(15, 23, 42, 1)',
      },
    }),
    mapsMenuButton: css({
      borderRadius: theme.shape.radius.pill,
      padding: `${theme.spacing(0.75)} ${theme.spacing(0.875)}`,
      color: mapsText,
      
      background: isDarkMode
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(51, 65, 85, 0.6) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 1) 100%)',
      
      border: `1px solid ${isDarkMode ? 'rgba(96, 165, 250, 0.25)' : 'rgba(59, 130, 246, 0.2)'}`,
      
      boxShadow: isDarkMode
        ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
        : '0 1px 4px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      '&:hover': {
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.85) 0%, rgba(71, 85, 105, 0.75) 100%)'
          : 'linear-gradient(135deg, rgba(241, 245, 249, 1) 0%, rgba(226, 232, 240, 1) 100%)',
        
        borderColor: isDarkMode ? 'rgba(96, 165, 250, 0.45)' : 'rgba(59, 130, 246, 0.4)',
        
        boxShadow: isDarkMode
          ? '0 4px 16px rgba(96, 165, 250, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
          : '0 2px 8px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        
        transform: 'translateY(-1px) scale(1.02)',
      },
      
      '&:active': {
        transform: 'translateY(0) scale(0.98)',
        transition: 'all 0.1s ease',
      },
      
      '& svg': {
        fontSize: '18px',
        color: isDarkMode ? 'rgba(147, 197, 253, 0.95)' : 'rgba(59, 130, 246, 0.95)',
        filter: isDarkMode
          ? 'drop-shadow(0 1px 2px rgba(96, 165, 250, 0.3))'
          : 'drop-shadow(0 1px 1px rgba(59, 130, 246, 0.2))',
      },
      
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(0.625),
      },
    }),
    mapsLogo: css({
      height: theme.spacing(4),
      width: theme.spacing(4),
      borderRadius: theme.shape.radius.circle,
      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.18)',
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'transform, box-shadow',
        transitionDuration: '200ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&:hover': {
        transform: 'scale(1.05) rotate(2deg)',
        boxShadow: isDarkMode
          ? '0 12px 28px rgba(96, 165, 250, 0.25)'
          : '0 12px 28px rgba(59, 130, 246, 0.25)',
      },
    }),
    mapsBreadcrumbs: css({
      display: 'flex',
      alignItems: 'center',
      fontSize: '12px',
      fontWeight: theme.typography.fontWeightMedium,
      color: mapsText,
      whiteSpace: 'nowrap',
      padding: `${theme.spacing(0.375)} ${theme.spacing(1)}`,
      borderRadius: theme.shape.radius.pill,
      backgroundColor: mapsBreadcrumbSurface,
      border: `1px solid ${mapsBreadcrumbBorder}`,
      boxShadow: mapsBreadcrumbShadow,
      backdropFilter: 'blur(12px)',
      maxWidth: '40vw',
       '& ol': {
         display: 'flex',
         alignItems: 'center',
         gap: theme.spacing(0.5),
         margin: 0,
         padding: 0,
         listStyle: 'none',
       },
       '& li': {
         padding: theme.spacing(0.375, 0.875),
         borderRadius: theme.shape.radius.pill,
         backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)',
         boxShadow: `0 1px 4px ${isDarkMode ? 'rgba(15, 23, 42, 0.25)' : 'rgba(148, 163, 184, 0.2)'}`,
         color: mapsText,
         position: 'relative',
         overflow: 'hidden',
         fontSize: '11px',
         [theme.transitions.handleMotion('no-preference')]: {
           transitionProperty: 'background-color, box-shadow, transform',
           transitionDuration: '140ms',
           transitionTimingFunction: theme.transitions.easing.easeInOut,
         },
         '&::before': {
           content: "''",
           position: 'absolute',
           inset: 0,
           background: isDarkMode
             ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(147, 197, 253, 0.06))'
             : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 197, 253, 0.04))',
           opacity: 0,
           [theme.transitions.handleMotion('no-preference')]: {
             transitionProperty: 'opacity',
             transitionDuration: '140ms',
             transitionTimingFunction: theme.transitions.easing.easeInOut,
           },
         },
         '&:hover': {
           backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
           boxShadow: `0 2px 8px ${isDarkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.15)'}`,
           transform: 'translateY(-1px)',
           '&::before': {
             opacity: 1,
           },
         },
         '&:active': {
           transform: 'translateY(0) scale(0.98)',
           [theme.transitions.handleMotion('no-preference')]: {
             transitionDuration: '80ms',
           },
         },
         '&:last-child': {
           fontWeight: 600,
           backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.12)' : 'rgba(59, 130, 246, 0.1)',
           color: isDarkMode ? 'rgba(147, 197, 253, 0.95)' : 'rgba(30, 64, 175, 0.9)',
         },
       },
      '& a': {
        color: mapsText,
        opacity: 0.9,
        textDecoration: 'none',
        [theme.transitions.handleMotion('no-preference')]: {
          transitionProperty: 'opacity',
          transitionDuration: '180ms',
          transitionTimingFunction: theme.transitions.easing.easeInOut,
        },
        '&:hover': {
          opacity: 1,
        },
      },
      '& span': {
        opacity: 0.75,
      },
       '& svg': {
         color: mapsSeparatorColor,
         fontSize: 10,
         [theme.transitions.handleMotion('no-preference')]: {
           transitionProperty: 'transform, color',
           transitionDuration: '140ms',
           transitionTimingFunction: theme.transitions.easing.easeInOut,
         },
         '&:hover': {
           transform: 'scale(1.05)',
           color: isDarkMode ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)',
         },
       },
      
      // Hide breadcrumbs on mobile for cleaner layout
      [theme.breakpoints.down('md')]: {
        display: 'none',
      },
    }),
    mapsCenterSection: css({
      flex: '1 1 auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 0,
      maxWidth: '100%',
      width: '100%',
      padding: `0 ${theme.spacing(3)}`,
      zIndex: 0,
      
      [theme.breakpoints.down('lg')]: {
        padding: `0 ${theme.spacing(2)}`,
      },
      
      [theme.breakpoints.down('md')]: {
        padding: `0 ${theme.spacing(1.5)}`,
      },
      
      [theme.breakpoints.down('sm')]: {
        padding: `0 ${theme.spacing(1)}`,
      },
    }),
    
    orgNameWrapper: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
      flex: '1 1 auto',
      maxWidth: '100%',
      width: '100%',
      padding: `${theme.spacing(0.75)} ${theme.spacing(4)}`,
      
      [theme.breakpoints.down('xl')]: {
        padding: `${theme.spacing(0.75)} ${theme.spacing(3)}`,
      },
      
      [theme.breakpoints.down('lg')]: {
        padding: `${theme.spacing(0.625)} ${theme.spacing(2.5)}`,
      },
      
      [theme.breakpoints.down('md')]: {
        padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
      },
      
      [theme.breakpoints.down('sm')]: {
        padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
      },
    }),
    
    orgName: css({
      // Steve Jobs style - elegant, spacious, clear hierarchy
      fontSize: '28px',
      fontWeight: 400,
      color: isDarkMode ? 'rgba(226, 232, 240, 1)' : 'rgba(15, 23, 42, 1)',
      letterSpacing: '-0.03em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      lineHeight: 1.15,
      transition: 'all 0.2s ease',
      minWidth: 0,
      maxWidth: '100%',
      width: '100%',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", system-ui, sans-serif',
      
      // Responsive typography - scales beautifully while maintaining elegance
      [theme.breakpoints.down('xl')]: {
        fontSize: '26px',
        letterSpacing: '-0.025em',
      },
      
      [theme.breakpoints.down('lg')]: {
        fontSize: '24px',
        fontWeight: 400,
        letterSpacing: '-0.02em',
      },
      
      [theme.breakpoints.down('md')]: {
        fontSize: '22px',
        fontWeight: 400,
        letterSpacing: '-0.018em',
      },
      
      [theme.breakpoints.down('sm')]: {
        fontSize: '20px',
        fontWeight: 400,
        letterSpacing: '-0.015em',
      },
    }),
    
    mapsRightGroup: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexShrink: 0,
      minWidth: 0,
      gap: theme.spacing(0.5),
      zIndex: 1,
      
      [theme.breakpoints.down('sm')]: {
        gap: theme.spacing(0.25),
      },
    }),
    mapsSearchButton: css({
      position: 'relative',
      flex: 1,
      maxWidth: 560,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.25),
      padding: theme.spacing(0.875, 1.5),
      borderRadius: 12,
      border: `1.5px solid ${theme.isDark ? 'rgba(77, 172, 255, 0.2)' : 'rgba(77, 172, 255, 0.15)'}`,
      background: theme.isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
      boxShadow: theme.isDark
        ? '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 2px 8px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      color: theme.colors.text.primary,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      '&:hover': {
        borderColor: theme.colors.primary.main,
        background: theme.isDark
          ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(241, 245, 249, 1) 100%)',
        boxShadow: theme.isDark
          ? '0 8px 24px rgba(77, 172, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          : '0 4px 16px rgba(77, 172, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)',
        transform: 'translateY(-1px) scale(1.01)',
      },
      
      '&:focus': {
        outline: 'none',
      },
      
      '&:focus-visible': {
        borderColor: theme.colors.primary.main,
        boxShadow: `0 0 0 3px ${theme.isDark ? 'rgba(77, 172, 255, 0.3)' : 'rgba(77, 172, 255, 0.2)'}`,
      },
      
      '& svg': {
        color: theme.colors.primary.main,
        fontSize: 18,
        opacity: 0.8,
      },
      
      // Mobile - full width search
      [theme.breakpoints.down('md')]: {
        maxWidth: 'none',
        width: '100%',
        padding: theme.spacing(0.875, 1.5),
      },
    }),
    mapsSearchPlaceholder: css({
      flex: 1,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.fontWeightRegular,
      letterSpacing: 0.2,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      opacity: 0.85,
      transition: 'all 0.2s ease-in-out',
    }),
    mapsSearchShortcut: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.25),
      borderRadius: 6,
      padding: theme.spacing(0.375, 0.75),
      fontSize: '11px',
      fontWeight: theme.typography.fontWeightMedium,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.colors.text.secondary,
      backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 1)',
      border: `1px solid ${theme.isDark ? 'rgba(77, 172, 255, 0.25)' : 'rgba(148, 163, 184, 0.3)'}`,
      boxShadow: theme.isDark
        ? '0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 1px 3px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
      transition: 'all 0.2s ease-in-out',
      
      'button:hover &': {
        backgroundColor: theme.isDark ? 'rgba(51, 65, 85, 0.9)' : 'rgba(226, 232, 240, 1)',
        borderColor: theme.colors.primary.border,
        transform: 'scale(1.05)',
      },
    }),
    mapsCompactSearch: css({
      borderRadius: theme.shape.radius.pill,
      border: `1.5px solid ${theme.colors.primary.border}`,
      backgroundColor: isDarkMode ? 'rgba(77, 172, 255, 0.08)' : 'rgba(77, 172, 255, 0.06)',
      color: theme.colors.primary.text,
      padding: theme.spacing(0.75, 1),
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'background-color, border-color, transform, box-shadow',
        transitionDuration: '200ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgba(77, 172, 255, 0.12)' : 'rgba(77, 172, 255, 0.1)',
        borderColor: theme.colors.primary.main,
        transform: 'scale(1.05)',
        boxShadow: `0 4px 12px ${isDarkMode ? 'rgba(77, 172, 255, 0.25)' : 'rgba(77, 172, 255, 0.2)'}`,
      },
      '& svg': {
        color: theme.colors.primary.main,
        fontSize: '20px',
      },
    }),
    mapsActionSlot: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
      borderRadius: theme.shape.radius.pill,
      backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.05)',
      boxShadow: `inset 0 0 0 1px ${isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(15, 23, 42, 0.08)'}`,
      position: 'relative',
      overflow: 'hidden',
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'background-color, box-shadow, transform',
        transitionDuration: '160ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&::before': {
        content: "''",
        position: 'absolute',
        inset: 0,
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(41, 121, 255, 0.05))'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.03))',
        opacity: 0,
        [theme.transitions.handleMotion('no-preference')]: {
          transitionProperty: 'opacity',
          transitionDuration: '160ms',
          transitionTimingFunction: theme.transitions.easing.easeInOut,
        },
      },
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.08)',
        boxShadow: `0 6px 16px ${isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
        transform: 'translateY(-1px)',
        '&::before': {
          opacity: 1,
        },
      },
      '& > *': {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      },
      [theme.breakpoints.down('md')]: {
        flex: 1,
        justifyContent: 'center',
      },
    }),
    mapsIconShell: css({
      display: 'flex',
      alignItems: 'center',
      '& button': {
        backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)',
        borderRadius: theme.shape.radius.pill,
        border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(15, 23, 42, 0.12)'}`,
        minHeight: 36,
        minWidth: 36,
        color: mapsText,
        [theme.transitions.handleMotion('no-preference')]: {
          transitionProperty: 'background-color, border-color, box-shadow, transform',
          transitionDuration: '160ms',
          transitionTimingFunction: theme.transitions.easing.easeInOut,
        },
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.12)',
        borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(15, 23, 42, 0.18)',
        boxShadow: '0 8px 18px rgba(15, 23, 42, 0.18)',
        transform: 'translateY(-1px) scale(1.02)',
      },
      '&:active': {
        transform: 'translateY(0) scale(0.98)',
        [theme.transitions.handleMotion('no-preference')]: {
          transitionDuration: '80ms',
        },
      },
      },
      '& svg': {
        color: mapsText,
      },
      '& > div': {
        display: 'none',
      },
    }),
  };
};
