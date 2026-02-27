import { css, keyframes } from '@emotion/css';
import { useMemo } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { contextSrv } from 'app/core/core';

/**
 * Extract up to 2 initials from a display name.
 * Falls back to parsing the local part of the email address.
 */
function getInitials(name: string, email: string): string {
  const source = name?.trim() || email?.split('@')[0] || '';
  if (!source) {
    return '?';
  }

  // Split on whitespace, hyphens, underscores, or dots (common email separators)
  const parts = source.split(/[\s.\-_]+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Single token – return first two characters (or one if single char)
  return source.slice(0, 2).toUpperCase();
}

/**
 * Deterministic colour from a string – picks a hue so each user gets a
 * consistent accent without storing anything server-side.
 */
function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function UserAvatarBadge() {
  const styles = useStyles2(getStyles);
  const { name, email, login } = contextSrv.user;

  const initials = useMemo(() => getInitials(name, email || login), [name, email, login]);
  const displayName = name || login || email?.split('@')[0] || 'User';
  const displayEmail = email || login || '';

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      <span className={styles.tooltipName}>{displayName}</span>
      {displayEmail && <span className={styles.tooltipEmail}>{displayEmail}</span>}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} placement="bottom">
      <button
        className={styles.avatar}
        aria-label={`Signed in as ${displayName}`}
        type="button"
        tabIndex={0}
      >
        <span className={styles.initials} aria-hidden="true">
          {initials}
        </span>
        <span className={styles.onlineRing} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

const subtleEntrance = keyframes({
  from: { opacity: 0, transform: 'scale(0.85)' },
  to: { opacity: 1, transform: 'scale(1)' },
});

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;
  const { name, email, login } = contextSrv.user;
  const seed = name || email || login || 'default';
  const hue = stringToHue(seed);

  // Adaptive palette — softer in light mode, more vibrant in dark mode
  const bgGradient = isDark
    ? `linear-gradient(135deg, hsl(${hue}, 55%, 32%) 0%, hsl(${hue + 30}, 50%, 26%) 100%)`
    : `linear-gradient(135deg, hsl(${hue}, 58%, 52%) 0%, hsl(${hue + 30}, 52%, 46%) 100%)`;

  const ringColor = isDark
    ? `hsla(${hue}, 60%, 60%, 0.35)`
    : `hsla(${hue}, 55%, 50%, 0.25)`;

  const hoverRingColor = isDark
    ? `hsla(${hue}, 65%, 65%, 0.55)`
    : `hsla(${hue}, 60%, 55%, 0.4)`;

  return {
    avatar: css({
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: bgGradient,
      border: 'none',
      outline: 'none',
      cursor: 'default',
      padding: 0,
      flexShrink: 0,
      boxShadow: `0 0 0 2px ${isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)'}, 0 0 0 3.5px ${ringColor}, 0 2px 8px ${isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: `${subtleEntrance} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',

      '&:hover': {
        boxShadow: `0 0 0 2px ${isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)'}, 0 0 0 4px ${hoverRingColor}, 0 4px 14px ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)'}`,
        transform: 'translateY(-1px) scale(1.04)',
      },

      '&:focus-visible': {
        boxShadow: `0 0 0 2px ${isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)'}, 0 0 0 4px ${theme.colors.primary.main}, 0 4px 14px ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)'}`,
      },

      '&:active': {
        transform: 'scale(0.97)',
        transition: 'transform 0.1s ease',
      },

      [theme.breakpoints.down('sm')]: {
        width: 32,
        height: 32,
      },
    }),

    initials: css({
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1,
      color: 'rgba(255, 255, 255, 0.95)',
      letterSpacing: '0.03em',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
      pointerEvents: 'none',

      [theme.breakpoints.down('sm')]: {
        fontSize: 11,
      },
    }),

    onlineRing: css({
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: isDark
        ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)'
        : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      border: `2px solid ${isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)'}`,
      boxShadow: `0 0 4px ${isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(34, 197, 94, 0.35)'}`,

      [theme.breakpoints.down('sm')]: {
        width: 8,
        height: 8,
        borderWidth: 1.5,
      },
    }),

    // --- Tooltip styles ---
    tooltipContent: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      padding: '2px 0',
    }),

    tooltipName: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.maxContrast,
      lineHeight: 1.4,
    }),

    tooltipEmail: css({
      fontSize: 11,
      color: theme.colors.text.secondary,
      lineHeight: 1.3,
      opacity: 0.85,
    }),
  };
};
