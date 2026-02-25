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
import { DashboardCardsSection } from './DashboardCardsSection';
import { ControlsSection } from './ControlsSection';
import { SidebarLogos } from './SidebarLogos';
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
    
    // Pass isRestrictedUser to styles for conditional styling
    const styles = useStyles2((theme) => getStyles(theme, isRestrictedUser));
    
    // Fetch dashboards for non-admin users
    const { dashboards } = useDashboardList({ 
      limit: 50, // Fetch more dashboards to categorize by tags
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
          // Remove alerting section
          if (item.id === 'alerting') {
            return false;
          }
          // Remove administration sections
          if (item.id === 'cfg' || item.id === 'admin') {
            return false;
          }
          // Remove administration sub-sections
          if (item.id === 'datasources' || item.id === 'users' || item.id === 'teams' || 
              item.id === 'plugins' || item.id === 'org-settings' || item.id === 'apikeys' || 
              item.id === 'serviceaccounts' || item.id === 'global-users' || item.id === 'global-orgs' ||
              item.id === 'server-settings' || item.id === 'admin-plugins' || item.id === 'upgrading') {
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
              
              {/* Logos Section for non-admin users - inside scroll */}
              {isRestrictedUser && (
                <div className={styles.logosWrapper}>
                  <SidebarLogos />
                </div>
              )}
              
              {/* Controls Section for non-admin users - inside scroll */}
              {isRestrictedUser && (
                <div className={styles.controlsWrapper}>
                  <ControlsSection 
                    onToggleKioskMode={chrome.onToggleKioskMode}
                  />
                </div>
              )}
            </ScrollContainer>
          </div>
          
          {shouldRenderInviteUserButton && (
            <div className={styles.inviteNewMemberButton}>
              <InviteUserButton />
            </div>
          )}
        </nav>
      </div>
    );
  })
);

MegaMenu.displayName = 'MegaMenu';

const getStyles = (theme: GrafanaTheme2, isRestrictedUser: boolean) => {
  const isDarkTheme = theme.colors.mode === 'dark';
  
  // For admin users, use Grafana's default clean styling
  // For restricted users, use custom SIWIS/WRD branding
  if (!isRestrictedUser) {
    // ADMIN/SUPER ADMIN: Clean Grafana default styling
    return {
      content: css({
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        flexGrow: 1,
        height: '100%',
        background: theme.colors.background.primary,
        borderRight: `1px solid ${theme.colors.border.weak}`,
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
      logosWrapper: css({
        display: 'none',
      }),
      controlsWrapper: css({
        display: 'none',
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
  }
  
  // RESTRICTED USERS: Custom SIWIS/WRD branding with gradients and animations
  return {
    content: css({
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      flexGrow: 1,
      position: 'relative',
      height: '100%',
      
      // Modern gradient background - professional design for non-admin
      background: isDarkTheme
        ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.96) 30%, rgba(17, 24, 39, 0.98) 70%, rgba(15, 23, 42, 0.98) 100%)'
        : 'linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.96) 20%, rgba(238, 242, 255, 0.95) 40%, rgba(232, 239, 255, 0.96) 60%, rgba(238, 242, 255, 0.95) 80%, rgba(248, 250, 252, 0.98) 100%)',
      
      borderRight: `1px solid ${isDarkTheme ? 'rgba(98, 165, 212, 0.18)' : 'rgba(36, 122, 190, 0.15)'}`,
      
      // Enhanced shadow for depth (WRD colors)
      boxShadow: isDarkTheme
        ? '4px 0 24px rgba(0, 0, 0, 0.4), 2px 0 12px rgba(98, 165, 212, 0.1), inset -1px 0 0 rgba(98, 165, 212, 0.1)'
        : '3px 0 24px rgba(36, 122, 190, 0.15), 2px 0 12px rgba(21, 107, 183, 0.08), inset -1px 0 0 rgba(36, 122, 190, 0.12)',
      
      // Subtle pattern overlay (WRD colors)
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDarkTheme
          ? 'radial-gradient(circle at top left, rgba(98, 165, 212, 0.04) 0%, transparent 50%), radial-gradient(circle at bottom right, rgba(21, 107, 183, 0.02) 0%, transparent 50%)'
          : 'radial-gradient(ellipse at top left, rgba(36, 122, 190, 0.08) 0%, rgba(21, 107, 183, 0.03) 35%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(78, 191, 242, 0.06) 0%, rgba(131, 220, 251, 0.02) 40%, transparent 65%), radial-gradient(circle at center, rgba(89, 137, 175, 0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      },
      
      // Animated top accent - vibrant gradient (WRD colors)
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: isDarkTheme ? 3 : 4,
        background: isDarkTheme
          ? 'linear-gradient(90deg, rgba(98, 165, 212, 0.6) 0%, rgba(131, 220, 251, 0.4) 50%, rgba(98, 165, 212, 0.6) 100%)'
          : 'linear-gradient(90deg, rgba(9, 55, 101, 0.75) 0%, rgba(36, 122, 190, 0.6) 15%, rgba(78, 191, 242, 0.7) 35%, rgba(21, 107, 183, 0.5) 50%, rgba(78, 191, 242, 0.7) 65%, rgba(36, 122, 190, 0.6) 85%, rgba(9, 55, 101, 0.75) 100%)',
        zIndex: 1,
        boxShadow: isDarkTheme
          ? 'none'
          : '0 2px 8px rgba(36, 122, 190, 0.15), 0 1px 3px rgba(21, 107, 183, 0.1)',
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
      paddingTop: theme.spacing(3), // Account for the top accent bar
      position: 'relative',
      zIndex: 2,
      
      [theme.breakpoints.up('md')]: {
        width: MENU_WIDTH,
      },
      
      // Modern sidebar item styling with subtle professional animations
      '& li': {
        borderRadius: theme.shape.radius.default,
        margin: theme.spacing(0.375, 0),
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        
        // Gradient border effect - vibrant (WRD colors)
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: isDarkTheme
            ? 'linear-gradient(180deg, rgba(98, 165, 212, 0.7) 0%, rgba(131, 220, 251, 0.5) 100%)'
            : 'linear-gradient(180deg, rgba(9, 55, 101, 0.85) 0%, rgba(36, 122, 190, 0.7) 25%, rgba(78, 191, 242, 0.75) 50%, rgba(21, 107, 183, 0.65) 75%, rgba(89, 137, 175, 0.6) 100%)',
          opacity: 0,
          transform: 'scaleY(0)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '0 4px 4px 0',
          boxShadow: isDarkTheme
            ? 'none'
            : '0 0 12px rgba(36, 122, 190, 0.3), 0 0 6px rgba(21, 107, 183, 0.2)',
        },
        
        // Subtle hover background (WRD colors)
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: isDarkTheme
            ? 'linear-gradient(135deg, rgba(98, 165, 212, 0.1) 0%, rgba(131, 220, 251, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(36, 122, 190, 0.12) 0%, rgba(89, 137, 175, 0.08) 25%, rgba(78, 191, 242, 0.1) 50%, rgba(21, 107, 183, 0.06) 75%, rgba(81, 118, 147, 0.04) 100%)',
          opacity: 0,
          transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: theme.shape.radius.default,
        },
        
        '&:hover': {
          transform: 'translateX(4px)',
          
          '&::before': {
            opacity: 1,
            transform: 'scaleY(1)',
          },
          
          '&::after': {
            opacity: 1,
          },
        },
        
        '&:active': {
          transform: 'translateX(2px)',
          transition: 'all 0.1s ease-out',
        },
      },
      
      '& a': {
        borderRadius: theme.shape.radius.default,
        padding: `${theme.spacing(1)} ${theme.spacing(1.25)}`,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.25),
        textDecoration: 'none',
        color: isDarkTheme ? 'rgba(226, 232, 240, 0.9)' : 'rgba(30, 41, 59, 0.9)',
        fontWeight: theme.typography.fontWeightMedium,
        fontSize: '14px',
        position: 'relative',
        zIndex: 1,
        
        '&:hover': {
          color: isDarkTheme ? 'rgba(131, 220, 251, 1)' : 'rgba(21, 107, 183, 1)',
        },
      },
      
      // Enhanced icon styling (WRD colors)
      '& .icon, & svg': {
        opacity: 0.75,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        filter: isDarkTheme
          ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
          : 'drop-shadow(0 1px 2px rgba(36, 122, 190, 0.2))',
      },
      
      '& li:hover .icon, & li:hover svg': {
        opacity: 1,
        color: isDarkTheme ? 'rgba(131, 220, 251, 1)' : 'rgba(21, 107, 183, 1)',
        transform: 'scale(1.15) translateX(2px)',
        filter: isDarkTheme
          ? 'drop-shadow(0 2px 4px rgba(98, 165, 212, 0.4))'
          : 'drop-shadow(0 2px 6px rgba(36, 122, 190, 0.5)) drop-shadow(0 1px 3px rgba(21, 107, 183, 0.3))',
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
      
      // Custom professional scrollbar styling for non-admin users
      '& > div': {
        // Target the ScrollContainer's inner scrollable div
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkTheme 
          ? 'rgba(98, 165, 212, 0.4) rgba(30, 41, 59, 0.3)' 
          : 'rgba(36, 122, 190, 0.35) rgba(241, 245, 249, 0.5)',
        
        // Webkit scrollbar (Chrome, Safari, Edge)
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        
        '&::-webkit-scrollbar-track': {
          background: isDarkTheme 
            ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(51, 65, 85, 0.3) 50%, rgba(30, 41, 59, 0.4) 100%)'
            : 'linear-gradient(180deg, rgba(241, 245, 249, 0.6) 0%, rgba(226, 232, 240, 0.4) 50%, rgba(241, 245, 249, 0.6) 100%)',
          borderRadius: '4px',
          margin: '4px 0',
        },
        
        '&::-webkit-scrollbar-thumb': {
          background: isDarkTheme 
            ? 'linear-gradient(180deg, rgba(98, 165, 212, 0.6) 0%, rgba(78, 191, 242, 0.5) 50%, rgba(98, 165, 212, 0.6) 100%)'
            : 'linear-gradient(180deg, rgba(36, 122, 190, 0.5) 0%, rgba(78, 191, 242, 0.45) 50%, rgba(36, 122, 190, 0.5) 100%)',
          borderRadius: '4px',
          border: isDarkTheme 
            ? '2px solid rgba(30, 41, 59, 0.4)' 
            : '2px solid rgba(241, 245, 249, 0.6)',
          backgroundClip: 'padding-box',
          transition: 'all 0.3s ease',
          
          '&:hover': {
            background: isDarkTheme 
              ? 'linear-gradient(180deg, rgba(131, 220, 251, 0.7) 0%, rgba(98, 165, 212, 0.65) 50%, rgba(131, 220, 251, 0.7) 100%)'
              : 'linear-gradient(180deg, rgba(21, 107, 183, 0.6) 0%, rgba(36, 122, 190, 0.55) 50%, rgba(21, 107, 183, 0.6) 100%)',
            boxShadow: isDarkTheme
              ? '0 0 8px rgba(98, 165, 212, 0.4)'
              : '0 0 6px rgba(36, 122, 190, 0.3)',
          },
          
          '&:active': {
            background: isDarkTheme 
              ? 'linear-gradient(180deg, rgba(131, 220, 251, 0.8) 0%, rgba(98, 165, 212, 0.75) 50%, rgba(131, 220, 251, 0.8) 100%)'
              : 'linear-gradient(180deg, rgba(9, 55, 101, 0.65) 0%, rgba(21, 107, 183, 0.6) 50%, rgba(9, 55, 101, 0.65) 100%)',
          },
        },
        
        '&::-webkit-scrollbar-corner': {
          background: 'transparent',
        },
      },
    }),
    logosWrapper: css({
      padding: theme.spacing(0.5, 0.625),
      borderTop: `1px solid ${isDarkTheme ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.4)'}`,
      position: 'relative',
      overflow: 'visible',
      marginTop: 'auto',
      flexShrink: 0,
      
      // Responsive padding
      [theme.breakpoints.down('lg')]: {
        padding: theme.spacing(0.5, 0.5),
      },
      
      [theme.breakpoints.down('md')]: {
        padding: theme.spacing(0.5, 0.5),
      },
    }),
    controlsWrapper: css({
      padding: theme.spacing(0.5, 0.625),
      borderTop: `1px solid ${isDarkTheme ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.4)'}`,
      position: 'relative',
      overflow: 'visible',
      marginTop: 'auto',
      flexShrink: 0,
      
      // Responsive padding
      [theme.breakpoints.down('lg')]: {
        padding: theme.spacing(0.5, 0.5),
      },
      
      [theme.breakpoints.down('md')]: {
        padding: theme.spacing(0.5, 0.5),
      },
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
