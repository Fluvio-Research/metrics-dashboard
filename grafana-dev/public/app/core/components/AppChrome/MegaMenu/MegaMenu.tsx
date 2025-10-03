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
import { usePatchUserPreferencesMutation } from 'app/features/preferences/api/index';
import { useDispatch, useSelector } from 'app/types/store';

import { InviteUserButton } from '../../InviteUserButton/InviteUserButton';
import { shouldRenderInviteUserButton } from '../../InviteUserButton/utils';

import { MegaMenuHeader } from './MegaMenuHeader';
import { MegaMenuItem } from './MegaMenuItem';
import { UserTypeDisplay } from './UserTypeDisplay';
import { DashboardCardsSection } from './DashboardCardsSection';
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
    const styles = useStyles2(getStyles);
    const location = useLocation();
    const { chrome } = useGrafana();
    const dispatch = useDispatch();
    const state = chrome.useState();
    const [patchPreferences] = usePatchUserPreferencesMutation();
    const pinnedItems = usePinnedItems();
    
    // Check if user is admin (server admin or org admin)
    const isAdmin = contextSrv.user.isGrafanaAdmin || contextSrv.hasRole('Admin');
    
    // Fetch dashboards for non-admin users
    const { dashboards } = useDashboardList({ 
      limit: 8, // Show 8 dashboards in a 2x4 grid
      enabled: !isAdmin 
    });

    // Process navigation items based on user role
    let processedNavItems = navTree
      .filter((item) => {
        // Always remove profile and help
        if (item.id === 'profile' || item.id === 'help') {
          return false;
        }
        
        // For non-admin users
        if (!isAdmin) {
          // Remove bookmarks and starred items
          if (item.id === 'bookmarks' || item.id === 'starred') {
            return false;
          }
          // Remove the dashboards section (we'll add individual dashboards instead)
          if (item.id === 'dashboards/browse') {
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
              
              {/* Dashboard Cards Section for non-admin users - moved to bottom */}
              {!isAdmin && dashboards.length > 0 && (
                <DashboardCardsSection 
                  dashboards={dashboards} 
                  onClose={state.megaMenuDocked ? undefined : onClose}
                />
              )}
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
  
  return {
    content: css({
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      flexGrow: 1,
      position: 'relative',
      height: '100%',
      ...(false && {
        backgroundColor: '#1B4D72 !important',
        '& *': {
          color: '#FFFFFF !important',
        },
        '& a': {
          color: '#FFFFFF !important',
        },
        '& span': {
          color: '#FFFFFF !important',
        },
      }),
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
      padding: theme.spacing(1, 1, 2, 1),
      [theme.breakpoints.up('md')]: {
        width: MENU_WIDTH,
      },
      ...(false && {
        '& li': {
          borderRadius: '8px',
          margin: theme.spacing(0.25, 0),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateX(2px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        '& a': {
          borderRadius: '8px',
          padding: theme.spacing(1),
          transition: 'all 0.2s ease-in-out',
        },
        '& button': {
          backgroundColor: 'transparent !important',
          borderColor: 'rgba(255, 255, 255, 0.2) !important',
          color: '#FFFFFF !important',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
            borderColor: 'rgba(255, 255, 255, 0.3) !important',
          },
        },
      }),
    }),
    inviteNewMemberButton: css({
      display: 'flex',
      padding: theme.spacing(1.5, 1, 1.5, 1),
      borderTop: `1px solid ${theme.colors.border.weak}`,
      ...(false && {
        '& button': {
          backgroundColor: 'rgba(255, 255, 255, 0.15) !important',
          borderColor: 'rgba(255, 255, 255, 0.3) !important',
          color: '#FFFFFF !important',
          fontWeight: 500,
          borderRadius: '8px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.25) !important',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      }),
    }),
    scrollableContent: css({
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
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
