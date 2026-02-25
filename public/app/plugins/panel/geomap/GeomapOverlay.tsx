import { css } from '@emotion/css';
import { CSSProperties } from 'react';
import * as React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

export interface OverlayProps {
  topRight1?: React.ReactNode[];
  topRight2?: React.ReactNode[];
  bottomLeft?: React.ReactNode[];
  blStyle?: CSSProperties;
  top?: React.ReactNode[];
  right?: React.ReactNode[];
  bottom?: React.ReactNode[];
  left?: React.ReactNode[];
  topLeft?: React.ReactNode[];
  topRight?: React.ReactNode[];
  bottomLeftCorner?: React.ReactNode[];
  bottomRight?: React.ReactNode[];
}

export const GeomapOverlay = ({
  topRight1,
  topRight2,
  bottomLeft,
  blStyle,
  top,
  right,
  bottom,
  left,
  topLeft,
  topRight,
  bottomLeftCorner,
  bottomRight,
}: OverlayProps) => {
  const topRight1Exists = (topRight1 && topRight1.length > 0) ?? false;
  const styles = useStyles2(getStyles(topRight1Exists));
  return (
    <div className={styles.overlay}>
      {Boolean(topRight1?.length) && <div className={styles.TR1}>{topRight1}</div>}
      {Boolean(topRight2?.length) && <div className={styles.TR2}>{topRight2}</div>}
      {Boolean(bottomLeft?.length) && (
        <div className={styles.BL} style={blStyle}>
          {bottomLeft}
        </div>
      )}
      {Boolean(top?.length) && <div className={styles.TOP}>{top}</div>}
      {Boolean(right?.length) && <div className={styles.RIGHT}>{right}</div>}
      {Boolean(bottom?.length) && <div className={styles.BOTTOM}>{bottom}</div>}
      {Boolean(left?.length) && <div className={styles.LEFT}>{left}</div>}
      {Boolean(topLeft?.length) && <div className={styles.TOP_LEFT}>{topLeft}</div>}
      {Boolean(topRight?.length) && <div className={styles.TOP_RIGHT}>{topRight}</div>}
      {Boolean(bottomLeftCorner?.length) && <div className={styles.BOTTOM_LEFT}>{bottomLeftCorner}</div>}
      {Boolean(bottomRight?.length) && <div className={styles.BOTTOM_RIGHT}>{bottomRight}</div>}
    </div>
  );
};

const getStyles = (topRight1Exists: boolean) => (theme: GrafanaTheme2) => ({
  overlay: css({
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 500,
    pointerEvents: 'none',
  }),
  TR1: css({
    right: '0.5em',
    pointerEvents: 'auto',
    position: 'absolute',
    top: '0.5em',
  }),
  TR2: css({
    position: 'absolute',
    top: topRight1Exists ? '80px' : '8px',
    right: '8px',
    pointerEvents: 'auto',
  }),
  BL: css({
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    pointerEvents: 'auto',
  }),
  TOP: css({
    position: 'absolute',
    top: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
  RIGHT: css({
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'flex-end',
  }),
  BOTTOM: css({
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
  LEFT: css({
    position: 'absolute',
    left: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'flex-start',
  }),
  TOP_LEFT: css({
    position: 'absolute',
    top: '8px',
    left: '8px',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'flex-start',
  }),
  TOP_RIGHT: css({
    position: 'absolute',
    top: '8px',
    right: '8px',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'flex-end',
  }),
  BOTTOM_LEFT: css({
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'flex-start',
  }),
  BOTTOM_RIGHT: css({
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'flex-end',
  }),
});
