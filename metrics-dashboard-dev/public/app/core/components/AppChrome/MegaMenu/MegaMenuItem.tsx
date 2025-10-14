import { css, cx } from '@emotion/css';
import { useEffect, useRef } from 'react';
import * as React from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import { useLocalStorage } from 'react-use';

import { FeatureState, GrafanaTheme2, NavModelItem, toIconName } from '@grafana/data';
import { t } from '@grafana/i18n';
import { useStyles2, Text, IconButton, Icon, Stack, FeatureBadge } from '@grafana/ui';
import { useGrafana } from 'app/core/context/GrafanaContext';

import { Indent } from '../../Indent/Indent';

import { FeatureHighlight } from './FeatureHighlight';
import { MegaMenuItemText } from './MegaMenuItemText';
import { hasChildMatch } from './utils';

interface Props {
  link: NavModelItem;
  activeItem?: NavModelItem;
  onClick?: () => void;
  level?: number;
  onPin: (item: NavModelItem) => void;
  isPinned: (id?: string) => boolean;
}

const MAX_DEPTH = 2;

export function MegaMenuItem({ link, activeItem, level = 0, onClick, onPin, isPinned }: Props) {
  const { chrome } = useGrafana();
  const state = chrome.useState();
  const menuIsDocked = state.megaMenuDocked;
  const location = useLocation();
  const FeatureHighlightWrapper = link.highlightText ? FeatureHighlight : React.Fragment;
  const hasActiveChild = hasChildMatch(link, activeItem);
  const isActive = link === activeItem || (level === MAX_DEPTH && hasActiveChild);
  const [sectionExpanded, setSectionExpanded] = useLocalStorage(
    `grafana.navigation.expanded[${link.text}]`,
    Boolean(hasActiveChild)
  );
  const showExpandButton = level < MAX_DEPTH && Boolean(linkHasChildren(link) || link.emptyMessage);
  const item = useRef<HTMLLIElement>(null);

  const styles = useStyles2(getStyles);

  // expand parent sections if child is active
  useEffect(() => {
    if (hasActiveChild) {
      setSectionExpanded(true);
    }
  }, [hasActiveChild, location, menuIsDocked, setSectionExpanded]);

  // scroll active element into center if it's offscreen
  useEffect(() => {
    if (isActive && item.current && isElementOffscreen(item.current)) {
      item.current.scrollIntoView({
        block: 'center',
      });
    }
  }, [isActive]);

  if (!link.url) {
    return null;
  }

  let iconElement: React.JSX.Element | null = null;

  if (link.icon) {
    iconElement = <Icon className={styles.icon} name={toIconName(link.icon) ?? 'link'} size="lg" />;
  } else if (link.img) {
    iconElement = (
      <Stack width={3} justifyContent="center">
        <img className={styles.img} src={link.img} alt="" />
      </Stack>
    );
  }

  function getIconName(isExpanded: boolean) {
    return isExpanded ? 'angle-up' : 'angle-down';
  }

  return (
    <li ref={item} className={styles.listItem}>
      <div
        className={cx(styles.menuItem, {
          [styles.menuItemWithIcon]: Boolean(level === 0 && iconElement),
        })}
      >
        {level !== 0 && <Indent level={level === MAX_DEPTH ? level - 1 : level} spacing={3} />}
        {level === MAX_DEPTH && <div className={styles.itemConnector} />}
        <div className={styles.collapsibleSectionWrapper}>
          <MegaMenuItemText
            isActive={isActive}
            onClick={() => {
              link.onClick?.();
              onClick?.();
            }}
            target={link.target}
            url={link.url}
            onPin={() => onPin(link)}
            isPinned={isPinned(link.url)}
          >
            <div
              className={cx(styles.labelWrapper, {
                [styles.hasActiveChild]: hasActiveChild,
                [styles.labelWrapperWithIcon]: Boolean(level === 0 && iconElement),
              })}
            >
              {level === 0 && iconElement && <FeatureHighlightWrapper>{iconElement}</FeatureHighlightWrapper>}
              <Text truncate>{link.text}</Text>
              {link.isNew && <FeatureBadge featureState={FeatureState.new} />}
            </div>
          </MegaMenuItemText>
        </div>
        <div className={styles.collapseButtonWrapper}>
          {showExpandButton && (
            <IconButton
              aria-label={
                sectionExpanded
                  ? t('navigation.megamenu-item.collapse-aria-label', 'Collapse section: {{sectionName}}', {
                      sectionName: link.text,
                    })
                  : t('navigation.megamenu-item.expand-aria-label', 'Expand section: {{sectionName}}', {
                      sectionName: link.text,
                    })
              }
              className={styles.collapseButton}
              onClick={() => setSectionExpanded(!sectionExpanded)}
              name={getIconName(Boolean(sectionExpanded))}
              size="md"
              variant="secondary"
            />
          )}
        </div>
      </div>
      {showExpandButton && sectionExpanded && (
        <ul className={styles.children}>
          {linkHasChildren(link) ? (
            link.children
              .filter((childLink) => !childLink.isCreateAction)
              .map((childLink) => (
                <MegaMenuItem
                  key={`${link.text}-${childLink.text}`}
                  link={childLink}
                  activeItem={activeItem}
                  onClick={onClick}
                  level={level + 1}
                  onPin={onPin}
                  isPinned={isPinned}
                />
              ))
          ) : (
            <div className={styles.emptyMessage} aria-live="polite">
              {link.emptyMessage}
            </div>
          )}
        </ul>
      )}
    </li>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const isDarkTheme = theme.colors.mode === 'dark';
  
  return {
    icon: css({
      width: theme.spacing(3),
      color: theme.colors.text.secondary,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      // Add subtle glow effect for dark theme
      ...(isDarkTheme && {
        filter: 'drop-shadow(0 0 2px rgba(77, 172, 255, 0.3))',
      }),
    }),
    img: css({
      height: theme.spacing(2),
      width: theme.spacing(2),
      ...(false && {
        filter: 'brightness(0) invert(1)',
      }),
    }),
    listItem: css({
      flex: 1,
      maxWidth: '100%',
      position: 'relative',
      
      // Modern hover effects
      '&:hover': {
        '& .icon': {
          color: theme.colors.primary.main,
          transform: 'scale(1.1)',
        },
        
        '& a, & button': {
          color: theme.colors.primary.main,
        },
      },
      
      // Active state indicator
      '&:has([aria-current="page"])': {
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '60%',
          backgroundColor: theme.colors.primary.main,
          borderRadius: '0 2px 2px 0',
        },
        
        backgroundColor: isDarkTheme 
          ? 'rgba(77, 172, 255, 0.1)' 
          : 'rgba(77, 172, 255, 0.05)',
      },
    }),
    menuItem: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      height: theme.spacing(4.5), // Slightly taller for better touch targets
      paddingLeft: theme.spacing(0.5),
      paddingRight: theme.spacing(1),
      position: 'relative',
      borderRadius: theme.shape.radius.default,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      '&:hover': {
        backgroundColor: isDarkTheme 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.04)',
        transform: 'translateX(2px)',
      },
      
      '&:active': {
        transform: 'translateX(1px)',
      },
    }),
    menuItemWithIcon: css({
      paddingLeft: theme.spacing(0),
      ...(false && {
        paddingLeft: theme.spacing(1),
      }),
    }),
    collapseButtonWrapper: css({
      display: 'flex',
      justifyContent: 'center',
      width: theme.spacing(3),
      flexShrink: 0,
      ...(false && {
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
    itemConnector: css({
      position: 'relative',
      height: '100%',
      width: theme.spacing(1.5),
      '&::before': {
        borderLeft: `1px solid ${theme.colors.border.medium}`,
        content: '""',
        height: '100%',
        right: 0,
        position: 'absolute',
        transform: 'translateX(50%)',
      },
    }),
    collapseButton: css({
      margin: 0,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.colors.border.weak}`,
      color: theme.colors.text.primary,
      borderRadius: theme.shape.radius.default,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      '&:hover': {
        backgroundColor: isDarkTheme 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.04)',
        borderColor: theme.colors.border.medium,
      },
    }),
    collapsibleSectionWrapper: css({
      alignItems: 'center',
      display: 'flex',
      flex: 1,
      height: '100%',
      minWidth: 0,
    }),
    labelWrapper: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
      minWidth: 0,
      paddingLeft: theme.spacing(1),
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
      
      '& *': {
        color: 'inherit',
      },
      '& a': {
        color: 'inherit',
        textDecoration: 'none',
      },
      '& span': {
        color: 'inherit',
      },
    }),
    labelWrapperWithIcon: css({
      paddingLeft: theme.spacing(0.5),
    }),
    hasActiveChild: css({
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeightBold,
      backgroundColor: isDarkTheme 
        ? 'rgba(77, 172, 255, 0.1)' 
        : 'rgba(77, 172, 255, 0.05)',
      borderRadius: theme.shape.radius.default,
      padding: theme.spacing(0.5),
    }),
    children: css({
      display: 'flex',
      listStyleType: 'none',
      flexDirection: 'column',
      backgroundColor: isDarkTheme 
        ? 'rgba(255, 255, 255, 0.02)' 
        : 'rgba(0, 0, 0, 0.02)',
      borderRadius: theme.shape.radius.default,
      margin: theme.spacing(0.5, 0),
      padding: theme.spacing(0.5),
      border: `1px solid ${theme.colors.border.weak}`,
    }),
    emptyMessage: css({
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
      padding: theme.spacing(1, 1.5, 1, 7),
    }),
  };
};

function linkHasChildren(link: NavModelItem): link is NavModelItem & { children: NavModelItem[] } {
  return Boolean(link.children && link.children.length > 0);
}

function isElementOffscreen(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.bottom < 0 || rect.top >= window.innerHeight;
}
