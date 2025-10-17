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

import { Branding } from '../../Branding/Branding';
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

          {/* Organization Name in Center */}
          <div className={styles.mapsCenterSection}>
            <span className={styles.orgName}>{orgName}</span>
          </div>

          <div className={styles.mapsRightGroup}>
            {/* All controls moved to sidebar for non-admin users */}
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
  const mapsSurface = isDarkMode ? 'rgba(20, 30, 48, 0.92)' : '#FFFFFF';
  const mapsBorder = isDarkMode ? 'rgba(148, 163, 184, 0.32)' : 'rgba(15, 23, 42, 0.08)';
  const mapsShadow = isDarkMode
    ? '0 14px 32px rgba(8, 15, 26, 0.55)'
    : '0 18px 34px rgba(15, 23, 42, 0.18)';
  const mapsText = isDarkMode ? 'rgba(226, 232, 240, 0.88)' : 'rgba(15, 23, 42, 0.78)';
  const mapsBreadcrumbSurface = isDarkMode ? 'rgba(17, 24, 39, 0.72)' : 'rgba(246, 248, 251, 0.9)';
  const mapsBreadcrumbBorder = isDarkMode ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.35)';
  const mapsBreadcrumbShadow = isDarkMode
    ? '0 10px 26px rgba(8, 15, 26, 0.4)'
    : '0 14px 24px rgba(15, 23, 42, 0.18)';
  const mapsSeparatorColor = isDarkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.55)';

  return {
    layout: css({
      height: getChromeHeaderLevelHeight(),
      display: 'flex',
      gap: theme.spacing(2),
      alignItems: 'center',
      padding: theme.spacing(0, 2),
      paddingLeft: menuDockedAndOpen ? theme.spacing(3.5) : theme.spacing(1.5),
      background: theme.isDark 
        ? 'linear-gradient(180deg, rgba(22, 27, 34, 0.95) 0%, rgba(17, 21, 27, 0.98) 100%)'
        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      boxShadow: theme.isDark
        ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15)'
        : '0 1px 4px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
      backdropFilter: 'blur(12px)',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: theme.zIndex.navbarFixed,
      
      // Add subtle top accent
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: theme.colors.gradients.brandVertical,
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
      minHeight: 56,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(1.5),
      flexWrap: 'nowrap',
      padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
      paddingLeft: menuDockedAndOpen ? theme.spacing(3) : theme.spacing(1.5),
      backgroundColor: mapsSurface,
      borderBottom: `1px solid ${mapsBorder}`,
      boxShadow: mapsShadow,
      backdropFilter: 'blur(14px)',
      position: 'sticky',
      top: 0,
      zIndex: theme.zIndex.navbarFixed,
      
      // Mobile optimizations - stacked layout
      [theme.breakpoints.down('md')]: {
        minHeight: 'auto',
        padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
        paddingLeft: theme.spacing(1.5),
        gap: theme.spacing(1),
        flexDirection: 'column',
        alignItems: 'stretch',
        boxShadow: isDarkMode
          ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)'
          : '0 2px 8px rgba(15, 23, 42, 0.12), 0 1px 2px rgba(15, 23, 42, 0.06)',
        backdropFilter: 'blur(20px)',
      },
      
      // Small mobile screens
      [theme.breakpoints.down('sm')]: {
        padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
        paddingLeft: theme.spacing(1),
        gap: theme.spacing(0.75),
      },
      
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'box-shadow, background-color',
        transitionDuration: '200ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&::before': {
        content: "''",
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: isDarkMode
          ? 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.4), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
        opacity: 0,
        [theme.transitions.handleMotion('no-preference')]: {
          transitionProperty: 'opacity',
          transitionDuration: '300ms',
          transitionTimingFunction: theme.transitions.easing.easeInOut,
        },
      },
      '&:hover::before': {
        opacity: 1,
      },
      [theme.breakpoints.down('lg')]: {
        rowGap: theme.spacing(1.5),
        paddingTop: theme.spacing(1.5),
        paddingBottom: theme.spacing(1.5),
      },
      [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
        alignItems: 'stretch',
      },
    }),
    mapsLeftGroup: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      minWidth: 'fit-content',
      color: mapsText,
      flex: '0 0 auto',
      
      // Mobile optimizations - top row
      [theme.breakpoints.down('md')]: {
        gap: theme.spacing(1),
        flex: '1 1 auto',
        minWidth: 0,
        width: '100%',
        justifyContent: 'space-between',
      },
      
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'transform',
        transitionDuration: '200ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&:hover': {
        transform: 'translateX(2px)',
      },
    }),
    mapsMenuButton: css({
      backgroundColor: 'transparent',
      borderRadius: theme.shape.radius.pill,
      border: `1px solid ${mapsBorder}`,
      padding: theme.spacing(0.75),
      color: mapsText,
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'background-color, border-color, box-shadow, transform',
        transitionDuration: '140ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.16)' : 'rgba(15, 23, 42, 0.08)',
        borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(15, 23, 42, 0.18)',
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.14)',
        transform: 'translateY(-1px)',
      },
      '& svg': {
        fontSize: '18px',
      },
      
      // Mobile menu button enhancement
      [theme.breakpoints.down('md')]: {
        padding: theme.spacing(0.625),
        border: `1.5px solid ${theme.colors.primary.border}`,
        backgroundColor: isDarkMode ? 'rgba(77, 172, 255, 0.08)' : 'rgba(77, 172, 255, 0.06)',
        
        '&:hover': {
          backgroundColor: isDarkMode ? 'rgba(77, 172, 255, 0.12)' : 'rgba(77, 172, 255, 0.1)',
          borderColor: theme.colors.primary.main,
        },
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
      
      [theme.breakpoints.down('md')]: {
        display: 'none', // Hide on mobile for cleaner layout
      },
    }),
    
    orgNameContainer: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(0.75, 2),
      borderRadius: theme.shape.radius.pill,
      background: isDarkMode
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)',
      border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.1)'}`,
      boxShadow: isDarkMode
        ? '0 4px 12px rgba(0, 0, 0, 0.25)'
        : '0 2px 8px rgba(15, 23, 42, 0.08)',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.2s ease-in-out',
      
      '&:hover': {
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(241, 245, 249, 1) 100%)',
        boxShadow: isDarkMode
          ? '0 6px 16px rgba(77, 172, 255, 0.2)'
          : '0 4px 12px rgba(77, 172, 255, 0.15)',
        transform: 'translateY(-1px)',
      },
    }),
    
    orgIcon: css({
      color: isDarkMode ? 'rgba(147, 197, 253, 0.9)' : 'rgba(59, 130, 246, 0.9)',
      transition: 'all 0.2s ease',
    }),
    
    orgName: css({
      fontSize: '18px',
      fontWeight: 600,
      color: isDarkMode ? 'rgba(226, 232, 240, 0.95)' : 'rgba(15, 23, 42, 0.9)',
      letterSpacing: '0.015em',
      whiteSpace: 'nowrap',
      maxWidth: '500px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
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

    mapsRightGroup: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing(1),
      flex: '0 0 auto',
      minWidth: 'fit-content',
      
      // Mobile optimizations - stay on first row
      [theme.breakpoints.down('md')]: {
        gap: theme.spacing(0.75),
        flex: '0 0 auto',
        order: 1, // Keep on first row
      },
      
      [theme.transitions.handleMotion('no-preference')]: {
        transitionProperty: 'transform',
        transitionDuration: '200ms',
        transitionTimingFunction: theme.transitions.easing.easeInOut,
      },
      '&:hover': {
        transform: 'translateX(-2px)',
      },
      [theme.breakpoints.down('md')]: {
        width: '100%',
        justifyContent: 'space-between',
        order: 2,
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
