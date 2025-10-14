import { css, cx } from '@emotion/css';
import classNames from 'classnames';
import { Resizable } from 're-resizable';
import { PropsWithChildren, useEffect, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { locationSearchToObject, locationService, useScopes } from '@grafana/runtime';
import { ErrorBoundaryAlert, getDragStyles, LinkButton, useStyles2 } from '@grafana/ui';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { useMediaQueryMinWidth } from 'app/core/hooks/useMediaQueryMinWidth';
import store from 'app/core/store';
import { CommandPalette } from 'app/features/commandPalette/CommandPalette';
import { ScopesDashboards } from 'app/features/scopes/dashboards/ScopesDashboards';

import './dashboard-height.css';

import { AppChromeMenu } from './AppChromeMenu';
import { AppChromeService, DOCKED_LOCAL_STORAGE_KEY } from './AppChromeService';
import {
  ExtensionSidebar,
  MAX_EXTENSION_SIDEBAR_WIDTH,
  MIN_EXTENSION_SIDEBAR_WIDTH,
} from './ExtensionSidebar/ExtensionSidebar';
import { useExtensionSidebarContext } from './ExtensionSidebar/ExtensionSidebarProvider';
import { MegaMenu, MENU_WIDTH } from './MegaMenu/MegaMenu';
import { useMegaMenuFocusHelper } from './MegaMenu/utils';
import { ReturnToPrevious } from './ReturnToPrevious/ReturnToPrevious';
import { SingleTopBar } from './TopBar/SingleTopBar';
import { getChromeHeaderLevelHeight, useChromeHeaderLevels } from './TopBar/useChromeHeaderHeight';

export interface Props extends PropsWithChildren<{}> {}

const FULL_HEIGHT_STORAGE_KEY = 'grafana.dashboard.fullheight';

export function AppChrome({ children }: Props) {
  const { chrome } = useGrafana();
  const {
    isOpen: isExtensionSidebarOpen,
    isEnabled: isExtensionSidebarEnabled,
    extensionSidebarWidth,
    setExtensionSidebarWidth,
  } = useExtensionSidebarContext();
  const state = chrome.useState();
  const scopes = useScopes();

  const menuDockedAndOpen = !state.chromeless && state.megaMenuDocked && state.megaMenuOpen;
  const isScopesDashboardsOpen = Boolean(
    scopes?.state.enabled && scopes?.state.drawerOpened && !scopes?.state.readOnly
  );

  const headerLevels = useChromeHeaderLevels();
  const headerHeight = headerLevels * getChromeHeaderLevelHeight();
  
  // Track full height toggle state
  const [isFullHeight, setIsFullHeight] = useState(() => {
    const stored = store.get(FULL_HEIGHT_STORAGE_KEY);
    return stored !== undefined ? stored === 'true' : true;
  });

  const styles = useStyles2(getStyles, headerHeight, isFullHeight);
  const contentSizeStyles = useStyles2(getContentSizeStyles, extensionSidebarWidth);
  const dragStyles = useStyles2(getDragStyles);

  useResponsiveDockedMegaMenu(chrome);
  useMegaMenuFocusHelper(state.megaMenuOpen, state.megaMenuDocked);

  const contentClass = cx({
    [styles.content]: true,
    [styles.contentChromeless]: state.chromeless,
    [styles.contentWithSidebar]: isExtensionSidebarOpen && !state.chromeless,
  });

  const handleMegaMenu = () => {
    chrome.setMegaMenuOpen(!state.megaMenuOpen);
  };

  const { pathname, search } = locationService.getLocation();
  const url = pathname + search;
  const shouldShowReturnToPrevious = state.returnToPrevious && url !== state.returnToPrevious.href;

  // Clear returnToPrevious when the page is manually navigated to
  useEffect(() => {
    if (state.returnToPrevious && url === state.returnToPrevious.href) {
      chrome.clearReturnToPrevious('auto_dismissed');
    }
    // We only want to pay attention when the location changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chrome, url]);

  // Sync updates from kiosk mode query string back into app chrome
  useEffect(() => {
    const queryParams = locationSearchToObject(search);
    chrome.setKioskModeFromUrl(queryParams.kiosk);
  }, [chrome, search]);

  // Listen for full height toggle events
  useEffect(() => {
    const handleFullHeightToggle = (event: CustomEvent) => {
      setIsFullHeight(event.detail.isFullHeight);
    };

    window.addEventListener('fullHeightToggle', handleFullHeightToggle as EventListener);
    return () => {
      window.removeEventListener('fullHeightToggle', handleFullHeightToggle as EventListener);
    };
  }, []);

  // Chromeless routes are without topNav, mega menu, search & command palette
  // We check chromeless twice here instead of having a separate path so {children}
  // doesn't get re-mounted when chromeless goes from true to false.
  return (
    <div
      className={classNames('main-view', {
        'main-view--chrome-hidden': state.chromeless,
      })}
    >
      {!state.chromeless && (
        <>
          <LinkButton className={styles.skipLink} href="#pageContent">
            <Trans i18nKey="app-chrome.skip-content-button">Skip to main content</Trans>
          </LinkButton>
          {menuDockedAndOpen && (
            <MegaMenu className={styles.dockedMegaMenu} onClose={() => chrome.setMegaMenuOpen(false)} />
          )}
          <header className={cx(styles.topNav, menuDockedAndOpen && styles.topNavMenuDocked)}>
            <SingleTopBar
              sectionNav={state.sectionNav.node}
              pageNav={state.pageNav}
              onToggleMegaMenu={handleMegaMenu}
              onToggleKioskMode={chrome.onToggleKioskMode}
              actions={state.actions}
              breadcrumbActions={state.breadcrumbActions}
              scopes={scopes}
              showToolbarLevel={headerLevels === 2}
            />
          </header>
        </>
      )}
      <div className={contentClass}>
        <div className={cx(styles.panes, { [styles.panesWithSidebar]: isExtensionSidebarOpen })}>
          {!state.chromeless && (
            <div
              className={cx(styles.scopesDashboardsContainer, {
                [styles.scopesDashboardsContainerDocked]: menuDockedAndOpen,
              })}
            >
              <ErrorBoundaryAlert>
                <ScopesDashboards />
              </ErrorBoundaryAlert>
            </div>
          )}
          <main
            className={cx(styles.pageContainer, {
              [styles.pageContainerMenuDocked]: menuDockedAndOpen || isScopesDashboardsOpen,
              [styles.pageContainerMenuDockedScopes]: menuDockedAndOpen && isScopesDashboardsOpen,
              [styles.pageContainerWithSidebar]: !state.chromeless && isExtensionSidebarOpen,
              [contentSizeStyles.contentWidth]: !state.chromeless && isExtensionSidebarOpen,
            })}
            id="pageContent"
          >
            {children}
          </main>
          {!state.chromeless && isExtensionSidebarEnabled && isExtensionSidebarOpen && (
            <Resizable
              className={styles.sidebarContainer}
              defaultSize={{ width: extensionSidebarWidth }}
              enable={{ left: true }}
              onResize={(_evt, _direction, ref) => setExtensionSidebarWidth(ref.getBoundingClientRect().width)}
              handleClasses={{ left: dragStyles.dragHandleBaseVertical }}
              minWidth={MIN_EXTENSION_SIDEBAR_WIDTH}
              maxWidth={MAX_EXTENSION_SIDEBAR_WIDTH}
            >
              <ExtensionSidebar />
            </Resizable>
          )}
        </div>
      </div>
      {!state.chromeless && !state.megaMenuDocked && <AppChromeMenu />}
      {!state.chromeless && <CommandPalette />}
      {shouldShowReturnToPrevious && state.returnToPrevious && (
        <ReturnToPrevious href={state.returnToPrevious.href} title={state.returnToPrevious.title} />
      )}
    </div>
  );
}

/**
 * When having docked mega menu we automatically undock it on smaller screens
 */
function useResponsiveDockedMegaMenu(chrome: AppChromeService) {
  const dockedMenuLocalStorageState = store.getBool(DOCKED_LOCAL_STORAGE_KEY, false); // Default to false to prevent auto-lock
  const isLargeScreen = useMediaQueryMinWidth('xl');

  useEffect(() => {
    // Only auto-dock if explicitly set by user and on large screen
    // Don't auto-undock on small screens - let user control it
    if (!dockedMenuLocalStorageState || !isLargeScreen) {
      return;
    }

    const state = chrome.state.getValue();
    // Only auto-dock if user previously chose to dock and we're on large screen
    if (isLargeScreen && !state.megaMenuDocked && dockedMenuLocalStorageState) {
      chrome.setMegaMenuDocked(true, false);
      chrome.setMegaMenuOpen(true);
    }
  }, [isLargeScreen, chrome, dockedMenuLocalStorageState]);
}

const getStyles = (theme: GrafanaTheme2, headerHeight: number, isFullHeight: boolean = true) => {
  return {
    content: css({
      label: 'page-content',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: headerHeight, // Always add padding to prevent content from flowing behind the fixed header
      flexGrow: 1,
      minHeight: 'var(--grafana-dashboard-min-height, auto)', // Use CSS custom property
      height: 'auto',
      transition: 'min-height 0.3s ease-in-out',
    }),
    contentWithSidebar: css({
      height: '100vh',
      overflow: 'hidden',
    }),
    contentChromeless: css({
      paddingTop: 0,
    }),
    dockedMegaMenu: css({
      background: theme.colors.background.primary,
      borderRight: `1px solid ${theme.colors.border.weak}`,
      display: 'none',
      height: '100%',
      position: 'fixed',
      top: 0,
      width: MENU_WIDTH,
      zIndex: 2,
      boxShadow: 'none',

      [theme.breakpoints.up('xl')]: {
        display: 'flex',
        flexDirection: 'column',
      },
    }),
    scopesDashboardsContainer: css({
      position: 'fixed',
      height: `calc(100% - ${headerHeight}px)`,
      zIndex: 1,
    }),
    scopesDashboardsContainerDocked: css({
      left: MENU_WIDTH,
    }),
    topNav: css({
      display: 'flex',
      position: 'fixed',
      zIndex: theme.zIndex.navbarFixed,
      left: 0,
      right: 0,
      background: theme.colors.background.primary,
      flexDirection: 'column',
    }),
    topNavMenuDocked: css({
      left: MENU_WIDTH,
    }),
    panes: css({
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      minHeight: 'var(--grafana-dashboard-min-height, auto)', // Apply min-height from CSS custom property
      label: 'page-panes',
    }),
    panesWithSidebar: css({
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
    }),
    pageContainerMenuDocked: css({
      paddingLeft: MENU_WIDTH,
    }),
    pageContainerMenuDockedScopes: css({
      paddingLeft: `calc(${MENU_WIDTH} * 2)`,
    }),
    pageContainer: css({
      label: 'page-container',
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      minHeight: 'var(--grafana-dashboard-min-height, auto)', // Apply min-height from CSS custom property
    }),
    pageContainerWithSidebar: css({
      overflow: 'auto',
      height: '100%',
      minHeight: 0,
    }),
    skipLink: css({
      position: 'fixed',
      top: -1000,

      ':focus': {
        left: theme.spacing(1),
        top: theme.spacing(1),
        zIndex: theme.zIndex.portal,
      },
    }),
    sidebarContainer: css({
      // the `Resizeable` component overrides the needed `position` and `height`
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      position: 'fixed !important' as 'fixed',
      top: headerHeight,
      bottom: 0,
      zIndex: 2,
      right: 0,
    }),
  };
};

const getContentSizeStyles = (_: GrafanaTheme2, extensionSidebarWidth = 0) => {
  return {
    contentWidth: css({
      maxWidth: `calc(100% - ${extensionSidebarWidth}px) !important`,
    }),
  };
};
