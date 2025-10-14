import { css } from '@emotion/css';
import { DOMAttributes } from '@react-types/shared';
import { memo, forwardRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { config, reportInteraction } from '@grafana/runtime';
import { ScrollContainer, useStyles2 } from '@grafana/ui';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { contextSrv } from 'app/core/services/context_srv';
import { setBookmark } from 'app/core/reducers/navBarTree';
import { HOME_NAV_ID } from 'app/core/reducers/navModel';
import { usePatchUserPreferencesMutation } from 'app/features/preferences/api/index';
import { useDispatch, useSelector } from 'app/types/store';

import { InviteUserButton } from '../../InviteUserButton/InviteUserButton';
import { shouldRenderInviteUserButton } from '../../InviteUserButton/utils';
import { buildBreadcrumbs } from '../../Breadcrumbs/utils';

import { MegaMenuHeader } from './MegaMenuHeader';
import { MegaMenuItem } from './MegaMenuItem';
import { UserTypeDisplay } from './UserTypeDisplay';
import { DashboardCardsSection } from './DashboardCardsSection';
import { ControlsSection } from './ControlsSection';
import { usePinnedItems } from './hooks';
import { useDashboardList } from './useDashboardList';
import { enrichWithInteractionTracking, findByUrl, getActiveItem } from './utils';

export const MENU_WIDTH = '300px';

export interface Props extends DOMAttributes {
  onClose: () => void;
}

export const MegaMenu = memo(
  forwardRef<HTMLDivElement, Props>(({ onClose, ...restProps }, ref) => {
    const navTree = useSelector((state) => state.navBarTree);
    const navIndex = useSelector((state) => state.navIndex);
    const styles = useStyles2(getStyles);
    const location = useLocation();
    const { chrome } = useGrafana();
    const dispatch = useDispatch();
    const state = chrome.useState();
    const [patchPreferences] = usePatchUserPreferencesMutation();
    const pinnedItems = usePinnedItems();
    
    // Distinguish between org admins and super admins (server admins)
    const isSuperAdmin = Boolean((contextSrv.user as any).isSuperAdmin ?? contextSrv.user.isGrafanaAdmin);
    const isOrgAdmin = contextSrv.hasRole('Admin');
    const isRestrictedUser = !isOrgAdmin && !isSuperAdmin;
    
    // Build breadcrumbs for non-admin users
    const homeNav = navIndex[HOME_NAV_ID];
    const breadcrumbs = buildBreadcrumbs(state.sectionNav.node, state.pageNav, homeNav);
    
    // Get profile node for non-admin users
    const profileNode = navIndex['profile'];
    
    // Fetch dashboards for non-admin users
    const { dashboards } = useDashboardList({ 
      limit: 8, // Show 8 dashboards in a 2x4 grid
      enabled: isRestrictedUser // Only fetch for users without elevated admin permissions
    });

    // Process navigation items based on user role
    let processedNavItems = navTree
      .filter((item) => {
        // Always remove profile and help
        if (item.id === 'profile' || item.id === 'help') {
          return false;
        }
        
        // For non-admin users (neither org admin nor super admin)
        if (isRestrictedUser) {
          // Remove bookmarks and starred items
          if (item.id === 'bookmarks' || item.id === 'starred') {
            return false;
          }
          // Remove the dashboards section (we'll add individual dashboards instead)
          if (item.id === 'dashboards/browse') {
            return false;
          }
          // Remove the home section
          if (item.id === 'home') {
            return false;
          }
        }
        
        return true;
      })
      .map((item) => enrichWithInteractionTracking(item, state.megaMenuDocked));

    const navItems = processedNavItems;

    if (config.featureToggles.pinNavItems) {
      const bookmarksItem = navItems.find((item) => item.id === 'bookmarks');
      if (bookmarksItem) {
        // Add children to the bookmarks section
        bookmarksItem.children = pinnedItems.reduce((acc: NavModelItem[], url) => {
          const item = findByUrl(navItems, url);
          if (!item) {
            return acc;
          }
          const newItem = {
            id: item.id,
            text: item.text,
            url: item.url,
            parentItem: { id: 'bookmarks', text: 'Bookmarks' },
          };
          acc.push(enrichWithInteractionTracking(newItem, state.megaMenuDocked));
          return acc;
        }, []);
      }
    }

    const activeItem = getActiveItem(navItems, state.sectionNav.node, location.pathname);

    const handleMegaMenu = () => {
      chrome.setMegaMenuOpen(!state.megaMenuOpen);
    };

    const handleDockedMenu = () => {
      chrome.setMegaMenuDocked(!state.megaMenuDocked);
      if (state.megaMenuDocked) {
        chrome.setMegaMenuOpen(false);
      }
    };

    const isPinned = useCallback(
      (url?: string) => {
        if (!url || !pinnedItems?.length) {
          return false;
        }
        return pinnedItems?.includes(url);
      },
      [pinnedItems]
    );

    const onPinItem = (item: NavModelItem) => {
      const url = item.url;
      if (url && config.featureToggles.pinNavItems) {
        const isSaved = isPinned(url);
        const newItems = isSaved ? pinnedItems.filter((i) => url !== i) : [...pinnedItems, url];
        const interactionName = isSaved ? 'grafana_nav_item_unpinned' : 'grafana_nav_item_pinned';
        reportInteraction(interactionName, {
          path: url,
        });
        patchPreferences({
          patchPrefsCmd: {
            navbar: {
              bookmarkUrls: newItems,
            },
          },
        }).then((data) => {
          if (!data.error) {
            dispatch(setBookmark({ item: item, isSaved: !isSaved }));
          }
        });
      }
    };

    return (
      <div data-testid={selectors.components.NavMenu.Menu} ref={ref} {...restProps}>
        <MegaMenuHeader handleDockedMenu={handleDockedMenu} handleMegaMenu={handleMegaMenu} onClose={onClose} />
        <nav className={styles.content}>
          <div className={styles.scrollableContent}>
            <ScrollContainer height="100%" overflowX="hidden" showScrollIndicators>
              {/* Controls Section for non-admin users */}
              {isRestrictedUser && (
                <div className={styles.controlsWrapper}>
                  <ControlsSection 
                    breadcrumbs={breadcrumbs} 
                    profileNode={profileNode}
                    onToggleKioskMode={chrome.onToggleKioskMode}
                  />
                </div>
              )}
              
              {/* Dashboard Cards Section for non-admin users */}
              {isRestrictedUser && dashboards.length > 0 && (
                <DashboardCardsSection 
                  dashboards={dashboards} 
                  onClose={state.megaMenuDocked ? undefined : onClose}
                />
              )}
              
              <ul className={styles.itemList} aria-label={t('navigation.megamenu.list-label', 'Navigation')}>
                {navItems.map((link, index) => (
                  <MegaMenuItem
                    key={link.text}
                    link={link}
                    isPinned={isPinned}
                    onClick={state.megaMenuDocked ? undefined : onClose}
                    activeItem={activeItem}
                    onPin={onPinItem}
                  />
                ))}
              </ul>
            </ScrollContainer>
          </div>
          {shouldRenderInviteUserButton && (
            <div className={styles.inviteNewMemberButton}>
              <InviteUserButton />
            </div>
          )}
          <UserTypeDisplay />
        </nav>
      </div>
    );
  })
);

MegaMenu.displayName = 'MegaMenu';

const getStyles = (theme: GrafanaTheme2) => {
  const isDarkTheme = theme.colors.mode === 'dark';
  
  return {
    content: css({
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      flexGrow: 1,
      position: 'relative',
      height: '100%',
      backgroundColor: isDarkTheme ? theme.colors.background.primary : theme.colors.background.canvas,
      borderRight: `1px solid ${theme.colors.border.weak}`,
      
      // Modern sidebar styling
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: theme.colors.gradients.brandVertical,
        zIndex: 1,
      },
    }),
    mobileHeader: css({
      display: 'flex',
      justifyContent: 'space-between',
      padding: theme.spacing(1, 1, 1, 2),
      borderBottom: `1px solid ${theme.colors.border.weak}`,

      [theme.breakpoints.up('md')]: {
        display: 'none',
      },
    }),
    itemList: css({
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      listStyleType: 'none',
      padding: theme.spacing(1.5, 1, 2, 1),
      paddingTop: theme.spacing(2), // Account for the top accent bar
      [theme.breakpoints.up('md')]: {
        width: MENU_WIDTH,
      },
      
      // Modern sidebar item styling with subtle professional animations
      '& li': {
        borderRadius: theme.shape.radius.default,
        margin: theme.spacing(0.25, 0),
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        borderLeft: '2px solid transparent',
        
        '&:hover': {
          backgroundColor: isDarkTheme 
            ? 'rgba(77, 172, 255, 0.06)' 
            : 'rgba(77, 172, 255, 0.04)',
          transform: 'translateX(2px)',
          borderLeft: `2px solid ${theme.colors.primary.main}`,
          boxShadow: `0 2px 8px ${isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)'}`,
        },
        
        '&:active': {
          transform: 'translateX(1px)',
          transition: 'all 0.1s ease-out',
        },
      },
      
      '& a': {
        borderRadius: theme.shape.radius.default,
        padding: theme.spacing(0.75, 1),
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        textDecoration: 'none',
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeightMedium,
        
        '&:hover': {
          color: theme.colors.primary.main,
        },
      },
      
      // Subtle icon styling
      '& .icon': {
        opacity: 0.7,
        transition: 'all 0.2s ease-in-out',
      },
      
      '& li:hover .icon': {
        opacity: 1,
        color: theme.colors.primary.main,
        transform: 'scale(1.1)',
      },
    }),
    inviteNewMemberButton: css({
      display: 'flex',
      padding: theme.spacing(1.5, 1, 1.5, 1),
      borderTop: `1px solid ${theme.colors.border.weak}`,
    }),
    scrollableContent: css({
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
    }),
    controlsWrapper: css({
      padding: theme.spacing(2, 1.5),
      borderBottom: `1px solid ${isDarkTheme ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.06)'}`,
    }),
    dockMenuButton: css({
      display: 'none',
      position: 'relative',
      top: theme.spacing(1),

      [theme.breakpoints.up('xl')]: {
        display: 'inline-flex',
      },
    }),
  };
};
