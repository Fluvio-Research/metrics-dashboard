import { css } from '@emotion/css';
import { FeatureLike } from 'ol/Feature';
import { CSSProperties } from 'react';

import {
  DataFrame,
  Field,
  FieldType,
  formattedValueToString,
  getFieldDisplayName,
  GrafanaTheme2,
} from '@grafana/data';
import { Icon, useTheme2, useStyles2, Tooltip } from '@grafana/ui';

import { renderValue } from '../utils/uiUtils';

export interface AdvancedToolPitImageOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain';
  borderRadius?: number;
}

export interface AdvancedToolPitResolvedDetail {
  type: 'field' | 'custom';
  label?: string;
  fieldIndex?: number;
  frameIndex?: number;
  value?: string;
  showLabel?: boolean;
  icon?: string;
  iconColor?: string;
  isLink?: boolean;
  labelColor?: string;
  linkDisplayText?: string;
}

export interface AdvancedToolPitTooltipRow {
  label: string;
  value: string;
  showLabel?: boolean;
  icon?: string;
  iconColor?: string;
  isLink?: boolean;
  labelColor?: string;
  linkDisplayText?: string;
}

export interface AdvancedToolPitTooltipConfig {
  imageUrl?: string;
  fieldIndexes?: number[];
  fieldTypes?: FieldType[];
  detailEntries?: AdvancedToolPitResolvedDetail[];
  rows?: AdvancedToolPitTooltipRow[];
  imageOptions?: AdvancedToolPitImageOptions;
  layerLabel?: string;
  headerText?: string;
  headerIcon?: string;
  headerIconColor?: string;
}

interface Props {
  feature: FeatureLike;
  config: AdvancedToolPitTooltipConfig;
}

export const AdvancedToolPitTooltip = ({ feature, config }: Props) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const frame = feature.get('frame') as DataFrame | undefined;
  const rowIndex = feature.get('rowIndex') as number | undefined;

  if (!frame || rowIndex === undefined) {
    return null;
  }

  const allowedTypes = config.fieldTypes && config.fieldTypes.length ? config.fieldTypes : undefined;
  const rowsFromConfig = config.rows && config.rows.length ? config.rows : undefined;
  const computedRows =
    rowsFromConfig ??
    getRows(frame, rowIndex, config.detailEntries, config.fieldIndexes, allowedTypes);
  const limitedRows = computedRows.slice(0, 6);
  // Only show header if explicitly configured, don't fallback to layer name
  const headingText = config.headerText;

  if (!limitedRows.length && !config.imageUrl && !headingText) {
    return null;
  }

  const imageWidth = config.imageOptions?.width;
  const imageHeight = config.imageOptions?.height;
  const imageFit = config.imageOptions?.fit ?? 'cover';
  const imageRadius = config.imageOptions?.borderRadius ?? 12;

  const cardStyle =
    imageWidth != null
      ? {
          minWidth: imageWidth + 32,
          maxWidth: imageWidth + 32,
        }
      : undefined;

  const imageContainerStyle =
    imageWidth != null || imageHeight != null
      ? {
          width: imageWidth != null ? `${imageWidth}px` : undefined,
          height: imageHeight != null ? `${imageHeight}px` : undefined,
        }
      : undefined;

  const imageStyle: CSSProperties = {
    width: '100%',
    borderRadius: imageRadius,
    objectFit: imageFit,
    height: imageHeight != null ? '100%' : 'auto',
  };

  const headingIcon = config.headerIcon;
  const headingIconColor = config.headerIconColor;

  return (
    <div className={styles.wrapper} style={cardStyle}>
      {headingText && (
        <div className={styles.header}>
          {renderIcon(theme, headingIcon, headingIconColor, styles)}
          <span className={styles.title}>{headingText}</span>
        </div>
      )}
      {config.imageUrl && (
        <div className={styles.imageWrapper} style={imageContainerStyle}>
          <img src={config.imageUrl} alt="" className={styles.image} style={imageStyle} />
        </div>
      )}
      {limitedRows.length > 0 && (
        <div className={styles.content}>
          {limitedRows.map((row, idx) => {
            const isUrl = row.isLink || /^https?:\/\//i.test(row.value);
            const displayValue = row.linkDisplayText ? row.linkDisplayText : renderValue(row.value);
            const tooltipText = row.value || '';
            
            return (
              <div className={styles.row} key={`${row.label}-${idx}`}>
                {renderIcon(theme, row.icon, row.iconColor, styles)}
                <div className={styles.rowContent}>
                  {row.showLabel !== false && row.label && (
                    <span
                      className={styles.label}
                      style={row.labelColor ? { color: row.labelColor } : undefined}
                    >
                      {row.label}
                      <span className={styles.labelSeparator}>:</span>
                    </span>
                  )}
                  <Tooltip content={tooltipText} placement="top">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      {isUrl ? (
                        <a 
                          href={row.value} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.valueLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {displayValue}
                        </a>
                      ) : (
                        <span className={styles.value}>{displayValue}</span>
                      )}
                    </div>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function renderIcon(
  theme: GrafanaTheme2,
  icon: string | undefined,
  color: string | undefined,
  styles: ReturnType<typeof getStyles>
) {
  if (!icon || !icon.trim().length) {
    return null;
  }

  const trimmed = icon.trim();
  const finalColor = color || (theme.isDark ? 'rgba(255,255,255,0.75)' : theme.colors.text.primary);

  if (/^https?:\/\//i.test(trimmed)) {
    return (
      <span className={styles.iconWrapper}>
        <img src={trimmed} className={styles.iconImage} style={{ borderColor: finalColor }} alt="icon" />
      </span>
    );
  }

  if (/^[a-z0-9_-]+$/i.test(trimmed)) {
    return (
      <span className={styles.iconWrapper}>
        <Icon name={trimmed as any} size="lg" style={{ color: finalColor }} />
      </span>
    );
  }

  return (
    <span className={styles.iconWrapper}>
      <span className={styles.iconText} style={{ color: finalColor }}>
        {trimmed}
      </span>
    </span>
  );
}

function getRows(
  frame: DataFrame,
  rowIndex: number,
  detailEntries: AdvancedToolPitResolvedDetail[] | undefined,
  fallbackIndexes: number[] | undefined,
  allowedTypes?: FieldType[]
): AdvancedToolPitTooltipRow[] {
  const rows: AdvancedToolPitTooltipRow[] = [];

  if (detailEntries?.length) {
    for (const entry of detailEntries) {
      if (entry.type === 'custom') {
        if (entry.value && entry.value.trim().length) {
          rows.push({
            label: entry.label ?? '',
            value: entry.value,
            showLabel: entry.showLabel !== false,
            icon: entry.icon,
            iconColor: entry.iconColor,
            isLink: entry.isLink,
            labelColor: entry.labelColor,
            linkDisplayText: entry.linkDisplayText,
          });
        }
        continue;
      }

      if (entry.fieldIndex === undefined) {
        continue;
      }

      const field: Field | undefined = frame.fields[entry.fieldIndex];
      if (!field) {
        continue;
      }
      if (field.config?.custom?.hideFrom?.tooltip) {
        continue;
      }
      if (allowedTypes && allowedTypes.length && !allowedTypes.includes(field.type)) {
        continue;
      }

      const value = field.values[rowIndex];
      const display = field.display ? field.display(value) : { text: value != null ? `${value}` : '' };
      rows.push({
        label: entry.label || getFieldDisplayName(field, frame),
        value: formattedValueToString(display),
        showLabel: entry.showLabel !== false,
        icon: entry.icon,
        iconColor: entry.iconColor,
        isLink: entry.isLink,
        labelColor: entry.labelColor,
        linkDisplayText: entry.linkDisplayText,
      });
    }
    return rows;
  }

  const indexes =
    fallbackIndexes && fallbackIndexes.length > 0 ? fallbackIndexes : frame.fields.map((_, idx) => idx);

  for (const idx of indexes) {
    const field: Field | undefined = frame.fields[idx];
    if (!field) {
      continue;
    }

    if (field.config?.custom?.hideFrom?.tooltip) {
      continue;
    }

    if (allowedTypes && allowedTypes.length && !allowedTypes.includes(field.type)) {
      continue;
    }

    const value = field.values[rowIndex];
    const display = field.display ? field.display(value) : { text: value != null ? `${value}` : '' };
    rows.push({
      label: getFieldDisplayName(field, frame),
      value: formattedValueToString(display),
      showLabel: true,
    });
  }

  return rows;
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    background: theme.isDark ? '#2b3137' : '#ffffff',
    borderRadius: '12px',
    boxShadow: theme.isDark 
      ? '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)' 
      : '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    minWidth: 320,
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    '@media (max-width: 768px)': {
      minWidth: 280,
      maxWidth: '90vw',
      borderRadius: '10px',
    },
  }),
  header: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    background: theme.isDark 
      ? 'linear-gradient(135deg, #3d4956 0%, #2b3542 100%)'
      : 'linear-gradient(135deg, #7c9cbf 0%, #5b7fa8 100%)',
    borderBottom: 'none',
  }),
  title: css({
    fontSize: theme.typography.size.md,
    fontWeight: 700,
    color: '#ffffff',
    flex: 1,
    letterSpacing: '0.02em',
    textShadow: theme.isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.2)',
  }),
  imageWrapper: css({
    display: 'flex',
    justifyContent: 'center',
    background: theme.isDark ? '#1a1d21' : '#f0f4f8',
    padding: 0,
    position: 'relative',
  }),
  image: css({
    width: '100%',
    height: 'auto',
    display: 'block',
  }),
  content: css({
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    background: theme.isDark ? '#2b3137' : '#ffffff',
  }),
  row: css({
    display: 'grid',
    gridTemplateColumns: '28px 1fr',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1, 1.5),
    background: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafb',
    borderRadius: '8px',
    border: 'none',
    minHeight: '44px',
    transition: 'all 0.2s ease',
    boxShadow: theme.isDark 
      ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)' 
      : 'inset 0 0 0 1px rgba(0, 0, 0, 0.06)',
    '&:hover': {
      background: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#eef2f6',
      transform: 'translateX(2px)',
      boxShadow: theme.isDark 
        ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.12)' 
        : 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
    },
    '@media (max-width: 768px)': {
      minHeight: '40px',
      padding: theme.spacing(0.75, 1),
      gap: theme.spacing(1),
    },
  }),
  rowContent: css({
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    alignItems: 'center',
    gap: theme.spacing(1),
    minWidth: 0,
    '@media (max-width: 768px)': {
      gap: theme.spacing(0.75),
    },
  }),
  iconWrapper: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    flexShrink: 0,
    borderRadius: '6px',
    background: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    color: theme.isDark ? '#8ab4f8' : '#5b7fa8',
  }),
  label: css({
    fontSize: theme.typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: theme.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.55)',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    '@media (max-width: 768px)': {
      fontSize: '9px',
      letterSpacing: '0.06em',
    },
  }),
  labelSeparator: css({
    display: 'inline-block',
    marginLeft: theme.spacing(0.25),
  }),
  value: css({
    color: theme.isDark ? '#f1f5f9' : '#1f2937',
    fontSize: theme.typography.size.sm,
    lineHeight: 1.4,
    fontWeight: 500,
    textAlign: 'left',
    padding: 0,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    display: 'block',
    cursor: 'default',
  }),
  valueLink: css({
    color: theme.isDark ? '#8ab4f8' : '#5b7fa8',
    fontSize: theme.typography.size.md,
    lineHeight: 1.3,
    fontWeight: 600,
    textAlign: 'right',
    padding: theme.spacing(0.5, 1),
    borderRadius: '6px',
    background: theme.isDark ? 'rgba(138, 180, 248, 0.2)' : 'rgba(91, 127, 168, 0.15)',
    border: theme.isDark 
      ? '1px solid rgba(138, 180, 248, 0.35)' 
      : '1px solid rgba(91, 127, 168, 0.3)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    display: 'block',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: theme.isDark ? 'rgba(138, 180, 248, 0.3)' : 'rgba(91, 127, 168, 0.25)',
      textDecoration: 'underline',
      transform: 'scale(1.02)',
    },
    '@media (max-width: 768px)': {
      fontSize: theme.typography.size.sm,
      padding: theme.spacing(0.375, 0.75),
    },
  }),
  iconImage: css({
    width: '28px',
    height: '28px',
    objectFit: 'cover',
    borderRadius: '6px',
  }),
  iconText: css({
    fontSize: '20px',
    lineHeight: 1,
  }),
});
