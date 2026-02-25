import { css } from '@emotion/css';
import { FeatureLike } from 'ol/Feature';
import { CSSProperties, useState, useEffect, useCallback } from 'react';

import {
  DataFrame,
  Field,
  FieldType,
  formattedValueToString,
  getFieldDisplayName,
  GrafanaTheme2,
} from '@grafana/data';
import { Icon, useTheme2, useStyles2, Button } from '@grafana/ui';
import { locationService } from '@grafana/runtime';

import { renderValue } from '../utils/uiUtils';
import { getColorForValue } from '../utils/customMarkers';

export interface AdvancedTooltipImageOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain';
  borderRadius?: number;
}

export interface AdvancedTooltipResolvedDetail {
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
  linkTemplate?: string;
}

export interface AdvancedTooltipRow {
  label: string;
  value: string;
  showLabel?: boolean;
  icon?: string;
  iconColor?: string;
  isLink?: boolean;
  labelColor?: string;
  linkDisplayText?: string;
  linkTemplate?: string;
}

export interface AdvancedTooltipButtonConfig {
  enabled: boolean;
  buttonText?: string;
  buttonIcon?: string;
  variableMappings?: Array<{
    id: string;
    fieldName?: string;
    variableName: string;
  }>;
}

export interface AdvancedTooltipConfig {
  imageUrl?: string;
  imageUrls?: string[]; // Support for multiple images (carousel)
  fallbackImageUrl?: string; // Image to show when main image fails to load
  fieldIndexes?: number[];
  fieldTypes?: FieldType[];
  detailEntries?: AdvancedTooltipResolvedDetail[];
  rows?: AdvancedTooltipRow[];
  imageOptions?: AdvancedTooltipImageOptions;
  layerLabel?: string;
  headerText?: string;
  headerIcon?: string;
  headerIconColor?: string;
  markerColor?: string; // Color for the circular marker indicator
  pinColorFieldName?: string;
  pinColorScheme?: 'status' | 'priority' | 'category' | 'default' | 'custom';
  customColorPalette?: string[];
  useCustomPinMarker?: boolean;
  enableHoverEffect?: boolean;
  enableRowHighlight?: boolean;
  enableColumnHighlight?: boolean;
  buttonConfig?: AdvancedTooltipButtonConfig;
}

interface ImageCarouselProps {
  images: string[];
  fallbackImageUrl?: string;
  imageStyle: CSSProperties;
  imageContainerStyle?: CSSProperties;
  styles: ReturnType<typeof getStyles>;
}

const ImageCarousel = ({ images, fallbackImageUrl, imageStyle, imageContainerStyle, styles }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Handle keyboard navigation
  useEffect(() => {
    // Only add listener if carousel has multiple images to prevent
    // unnecessary event processing when carousel isn't being used
    if (images.length <= 1) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if target is not an input/textarea to avoid interfering with typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const currentImage = images[currentIndex];
  const hasError = imageErrors.has(currentIndex);

  return (
    <div className={styles.carouselWrapper} style={imageContainerStyle}>
      <img
        src={hasError && fallbackImageUrl ? fallbackImageUrl : currentImage}
        alt=""
        className={styles.image}
        style={imageStyle}
        onError={() => {
          if (!hasError) {
            handleImageError(currentIndex);
          } else if (fallbackImageUrl) {
            // Both main and fallback failed, hide image
            const target = document.querySelector(`.${styles.image}`) as HTMLImageElement;
            if (target) {
              target.style.display = 'none';
            }
          }
        }}
      />
      
      {images.length > 1 && (
        <>
          {/* Previous button */}
          <button
            className={`${styles.carouselButton} ${styles.carouselButtonPrev}`}
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            aria-label="Previous image"
          >
            <Icon name="angle-left" size="lg" />
          </button>

          {/* Next button */}
          <button
            className={`${styles.carouselButton} ${styles.carouselButtonNext}`}
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next image"
          >
            <Icon name="angle-right" size="lg" />
          </button>

          {/* Image counter */}
          <div className={styles.carouselCounter}>
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

interface Props {
  feature: FeatureLike;
  config: AdvancedTooltipConfig;
  onClose?: () => void;
}

export const AdvancedTooltip = ({ feature, config, onClose }: Props) => {
  const styles = useStyles2((theme) => getStyles(theme, config));
  const theme = useTheme2();
  const frame = feature.get('frame') as DataFrame | undefined;
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // Reset error states when image URL changes
  useEffect(() => {
    setImageError(false);
    setFallbackError(false);
  }, [config.imageUrl]);
  const allFrames = (feature.get('allFrames') as DataFrame[] | undefined) ?? (frame ? [frame] : []);
  const rowIndex = feature.get('rowIndex') as number | undefined;

  // Handle variable update button click
  const handleUpdateVariables = useCallback(() => {
    if (!config.buttonConfig?.enabled || !config.buttonConfig.variableMappings || rowIndex === undefined) {
      return;
    }

    const updates: Record<string, string> = {};
    
    // Process each variable mapping
    for (const mapping of config.buttonConfig.variableMappings) {
      if (!mapping.variableName || !mapping.fieldName) {
        continue;
      }

      // Find the field in any of the frames
      let fieldValue: any = undefined;
      for (const checkFrame of allFrames) {
        const field = checkFrame.fields.find((f) => f.name === mapping.fieldName);
        if (field && rowIndex < field.values.length) {
          fieldValue = field.values[rowIndex];
          break;
        }
      }

      // Only update if we found a value
      if (fieldValue != null) {
        updates[`var-${mapping.variableName}`] = String(fieldValue);
      }
    }

    // Update all variables at once
    if (Object.keys(updates).length > 0) {
      locationService.partial(updates, true); // true = replace history instead of push
      
      // Optionally close the tooltip after updating
      if (onClose) {
        onClose();
      }
    }
  }, [config.buttonConfig, allFrames, rowIndex, onClose]);

  if (!frame || rowIndex === undefined) {
    return null;
  }

  const allowedTypes = config.fieldTypes && config.fieldTypes.length ? config.fieldTypes : undefined;
  const rowsFromConfig = config.rows && config.rows.length ? config.rows : undefined;
  
  let computedRows =
    rowsFromConfig ??
    getRows(
      frame,
      allFrames,
      rowIndex,
      config.detailEntries,
      config.fieldIndexes,
      allowedTypes,
      config.pinColorFieldName,
      config.pinColorScheme,
      config.useCustomPinMarker,
      config.customColorPalette
    );
  
  // If using pre-computed rows, we still need to apply dynamic colors for pin color field
  if (rowsFromConfig && config.useCustomPinMarker && config.pinColorFieldName) {
    computedRows = computedRows.map((row) => {
      // Check if this row corresponds to the pin color field by checking all frames
      for (const checkFrame of allFrames) {
        const field = checkFrame.fields.find((f) => f.name === config.pinColorFieldName);
        if (field && (row.label === field.name || row.label === getFieldDisplayName(field, checkFrame, allFrames))) {
          const value = field.values[rowIndex];
          if (value != null) {
            return {
              ...row,
              iconColor: getColorForValue(value, config.pinColorScheme || 'default', config.customColorPalette),
            };
          }
        }
      }
      return row;
    });
  }
  
  const limitedRows = computedRows.slice(0, 50); // Increased from 6 to support more tooltip content
  // Only show header if explicitly configured, don't fallback to layer name
  const headingText = config.headerText;

  // Check if there's any content to display
  const hasImages = config.imageUrl || (config.imageUrls && config.imageUrls.length > 0) || config.fallbackImageUrl;
  if (!limitedRows.length && !hasImages && !headingText) {
    return null;
  }

  const imageHeight = config.imageOptions?.height;
  const imageRadius = config.imageOptions?.borderRadius ?? 12;

  // Don't constrain card width based on image width - let it be responsive
  const cardStyle: CSSProperties | undefined = undefined;

  const imageContainerStyle: CSSProperties = {
    width: '100%',
    height: imageHeight != null ? `${imageHeight}px` : '180px',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  };

  const imageStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: imageRadius,
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
  };

  const headingIcon = config.headerIcon;
  const headingIconColor = config.headerIconColor;

  // Determine which image display to use
  const hasMultipleImages = config.imageUrls && config.imageUrls.length > 0;
  const hasSingleImage = config.imageUrl && !hasMultipleImages;
  // Show fallback if no image URL is provided but fallback is configured
  const showFallbackOnly = !config.imageUrl && !hasMultipleImages && config.fallbackImageUrl;

  // Check if the URL is a map URL that should be rendered as an iframe
  const isMapUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return /^(wrd-form\/|localhost:3300\/|.*\/wrd-form\/)/i.test(url) || url.includes('wrd-form/map');
  };

  const currentImageUrl = hasSingleImage 
    ? (imageError && config.fallbackImageUrl ? config.fallbackImageUrl : config.imageUrl)
    : (showFallbackOnly ? config.fallbackImageUrl : undefined);
  
  const shouldRenderIframe = currentImageUrl && isMapUrl(currentImageUrl);

  // Get marker color from config - use primary color as default to always show the marker
  const markerColor = config.markerColor || theme.colors.primary.main;

  return (
    <div className={styles.wrapper} style={cardStyle}>
      {headingText && (
        <div className={styles.header}>
          <MarkerIndicator color={markerColor} styles={styles} />
          {renderIcon(theme, headingIcon, headingIconColor, styles)}
          <span className={styles.title}>{headingText}</span>
          {onClose && (
            <button
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close tooltip"
            >
              <Icon name="times" size="lg" />
            </button>
          )}
        </div>
      )}
      {hasMultipleImages && (
        <ImageCarousel
          images={config.imageUrls!}
          fallbackImageUrl={config.fallbackImageUrl}
          imageStyle={imageStyle}
          imageContainerStyle={imageContainerStyle}
          styles={styles}
        />
      )}
      {hasSingleImage && (
        <div className={styles.imageWrapper} style={imageContainerStyle}>
          {shouldRenderIframe ? (
            <iframe
              src={currentImageUrl.startsWith('/') ? currentImageUrl : `/${currentImageUrl}`}
              className={styles.image}
              style={{
                ...imageStyle,
                border: 'none',
                width: '100%',
                minHeight: imageHeight != null ? `${imageHeight}px` : '400px',
                display: 'block',
              }}
              title="Map view"
              allow="geolocation"
            />
          ) : (
            <img 
              src={currentImageUrl} 
              alt="" 
              className={styles.image} 
              style={{
                ...imageStyle,
                display: (imageError && fallbackError) || (imageError && !config.fallbackImageUrl) ? 'none' : 'block'
              }}
              onError={() => {
                if (!imageError) {
                  // Main image failed, try fallback
                  setImageError(true);
                } else if (config.fallbackImageUrl && !fallbackError) {
                  // Fallback image also failed
                  setFallbackError(true);
                }
              }}
            />
          )}
        </div>
      )}
      {showFallbackOnly && (
        <div className={styles.imageWrapper} style={imageContainerStyle}>
          {shouldRenderIframe ? (
            <iframe
              src={config.fallbackImageUrl!.startsWith('/') ? config.fallbackImageUrl! : `/${config.fallbackImageUrl!}`}
              className={styles.image}
              style={{
                ...imageStyle,
                border: 'none',
                width: '100%',
                minHeight: imageHeight != null ? `${imageHeight}px` : '400px',
                display: 'block',
              }}
              title="Map view"
              allow="geolocation"
            />
          ) : (
            <img 
              src={config.fallbackImageUrl} 
              alt="" 
              className={styles.image} 
              style={{
                ...imageStyle,
                display: fallbackError ? 'none' : 'block'
              }}
              onError={() => {
                // Fallback image failed to load
                setFallbackError(true);
              }}
            />
          )}
        </div>
      )}
      {limitedRows.length > 0 && (
        <div className={styles.content}>
          {limitedRows.map((row, idx) => {
            const isUrl = row.isLink || /^https?:\/\//i.test(row.value);
            const displayValue = row.linkDisplayText ? row.linkDisplayText : renderValue(row.value);
            
            return (
              <div className={styles.row} key={`${row.label}-${idx}`}>
                {renderIcon(theme, row.icon, row.iconColor, styles)}
                <div className={styles.rowContent}>
                  {row.showLabel !== false && row.label && (
                    <span
                      className={styles.label}
                      style={row.labelColor ? { color: row.labelColor } : undefined}
                    >
                      {row.label}:
                    </span>
                  )}
                  {isUrl ? (
                    <a 
                      href={row.value} 
                      className={styles.valueLink}
                      data-advanced-tooltip-value="true"
                      onClick={(e) => e.stopPropagation()}
                      title={row.value}
                    >
                      {displayValue}
                    </a>
                  ) : (
                    <span className={styles.value} data-advanced-tooltip-value="true" title={row.value}>
                      {displayValue}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {config.buttonConfig?.enabled && config.buttonConfig.variableMappings && config.buttonConfig.variableMappings.length > 0 && (
        <div className={styles.buttonContainer}>
          <Button
            variant="primary"
            icon={(config.buttonConfig.buttonIcon as any) || 'sync'}
            onClick={handleUpdateVariables}
            fullWidth
          >
            {config.buttonConfig.buttonText || 'Update Variables'}
          </Button>
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

  // Handle HTTP/HTTPS URLs
  if (/^https?:\/\//i.test(trimmed)) {
    return (
      <span className={styles.iconWrapper}>
        <img src={trimmed} className={styles.iconImage} style={{ borderColor: finalColor }} alt="icon" />
      </span>
    );
  }

  // Handle local file paths (starting with / or ./ or containing image file extensions)
  // This includes paths like /img/logo.svg, ./logo.svg, or any path ending with image extensions
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)(\?.*)?$/i.test(trimmed)
  ) {
    // For paths starting with /img/, ensure they work in both dev and production
    // In Grafana, /img/ paths are served from public/img/ in dev and public/build/img/ in production
    let imageSrc = trimmed;
    if (trimmed.startsWith('/img/')) {
      // Use the path as-is; Grafana's routing will handle it
      imageSrc = trimmed;
    }
    return (
      <span className={styles.iconWrapper}>
        <img src={imageSrc} className={styles.iconImage} style={{ borderColor: finalColor }} alt="icon" />
      </span>
    );
  }

  // Handle Grafana icon names (simple alphanumeric with underscores/hyphens)
  if (/^[a-z0-9_-]+$/i.test(trimmed)) {
    return (
      <span className={styles.iconWrapper}>
        <Icon name={trimmed as any} size="lg" style={{ color: finalColor }} />
      </span>
    );
  }

  // Fallback: treat as text/emoji
  return (
    <span className={styles.iconWrapper}>
      <span className={styles.iconText} style={{ color: finalColor }}>
        {trimmed}
      </span>
    </span>
  );
}

/**
 * Modern circular marker indicator component
 * Renders a professional-looking circle marker with gradient, glow, and pulse effects
 */
interface MarkerIndicatorProps {
  color?: string;
  size?: number;
  styles: ReturnType<typeof getStyles>;
}

const MarkerIndicator = ({ color = '#00D4AA', size = 14, styles }: MarkerIndicatorProps) => {
  // Create a lighter version of the color for gradient
  const lighterColor = color.startsWith('#') 
    ? `${color}99` // Add alpha for lighter shade
    : color.replace('rgb', 'rgba').replace(')', ', 0.6)');
  
  return (
    <span 
      className={styles.markerIndicator}
      style={{
        '--marker-color': color,
        '--marker-color-light': lighterColor,
        '--marker-size': `${size}px`,
      } as React.CSSProperties}
    >
      <span className={styles.markerInner} />
      <span className={styles.markerGlow} />
    </span>
  );
};

function getRows(
  frame: DataFrame,
  allFrames: DataFrame[],
  rowIndex: number,
  detailEntries: AdvancedTooltipResolvedDetail[] | undefined,
  fallbackIndexes: number[] | undefined,
  allowedTypes?: FieldType[],
  pinColorFieldName?: string,
  pinColorScheme?: 'status' | 'priority' | 'category' | 'default' | 'custom',
  useCustomPinMarker?: boolean,
  customColorPalette?: string[]
): AdvancedTooltipRow[] {
  const rows: AdvancedTooltipRow[] = [];

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

      // Resolve the correct frame based on frameIndex
      const sourceFrame = 
        entry.frameIndex !== undefined && allFrames[entry.frameIndex]
          ? allFrames[entry.frameIndex]
          : frame;

      const field: Field | undefined = sourceFrame.fields[entry.fieldIndex];
      
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
      const formattedValue = formattedValueToString(display);
      
      // Dynamically compute icon color if this is the pin color field
      let iconColor = entry.iconColor;
      if (useCustomPinMarker && pinColorFieldName && field.name === pinColorFieldName && value != null) {
        iconColor = getColorForValue(value, pinColorScheme || 'default', customColorPalette);
      }
      
      rows.push({
        label: entry.label || getFieldDisplayName(field, sourceFrame, allFrames),
        value: formattedValue,
        showLabel: entry.showLabel !== false,
        icon: entry.icon,
        iconColor,
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
    
    // Dynamically compute icon color if this is the pin color field
    let iconColor: string | undefined = undefined;
    if (useCustomPinMarker && pinColorFieldName && field.name === pinColorFieldName && value != null) {
      iconColor = getColorForValue(value, pinColorScheme || 'default', customColorPalette);
    }
    
    rows.push({
      label: getFieldDisplayName(field, frame),
      value: formattedValueToString(display),
      showLabel: true,
      iconColor,
    });
  }

  return rows;
}

/**
 * Modern Facebook/Meta-style tooltip design
 * Features: Glassmorphism, smooth animations, clean typography, micro-interactions
 */
const getStyles = (theme: GrafanaTheme2, config: AdvancedTooltipConfig) => {
  const hoverEnabled = config.enableHoverEffect !== false;
  const rowHighlight = config.enableRowHighlight !== false;
  // columnHighlight available if needed: config.enableColumnHighlight === true && hoverEnabled
  void hoverEnabled; // Used in style calculations below
  void rowHighlight; // Used in style calculations below

  // Modern color palette
  const colors = {
    // Card backgrounds with subtle transparency for depth
    cardBg: theme.isDark 
      ? 'rgba(30, 32, 40, 0.98)'
      : 'rgba(255, 255, 255, 0.98)',
    cardBgSolid: theme.isDark ? '#1e2028' : '#ffffff',
    
    // Accent colors (Facebook blue-inspired)
    accent: theme.isDark ? '#0084ff' : '#1877f2',
    accentLight: theme.isDark ? 'rgba(0, 132, 255, 0.15)' : 'rgba(24, 119, 242, 0.1)',
    accentHover: theme.isDark ? '#0099ff' : '#166fe5',
    
    // Text colors
    textPrimary: theme.isDark ? '#e4e6eb' : '#050505',
    textSecondary: theme.isDark ? '#b0b3b8' : '#65676b',
    textTertiary: theme.isDark ? '#8a8d91' : '#8a8d91',
    
    // Border & dividers
    border: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: theme.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
    
    // Hover states
    hoverBg: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    activeBg: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
  };

  return {
    wrapper: css({
      background: colors.cardBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '16px',
      boxShadow: theme.isDark 
        ? '0 12px 28px 0 rgba(0, 0, 0, 0.4), 0 2px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
        : '0 12px 28px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      overflowY: 'auto',
      minWidth: 340,
      maxWidth: 380,
      maxHeight: 'calc(100vh - 100px)',
      display: 'flex',
      flexDirection: 'column',
      scrollBehavior: 'smooth',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      animation: 'tooltipFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '@keyframes tooltipFadeIn': {
        '0%': { opacity: 0, transform: 'scale(0.95) translateY(8px)' },
        '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
      },
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
        margin: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        borderRadius: '100px',
        border: '2px solid transparent',
        backgroundClip: 'padding-box',
        '&:hover': {
          background: theme.isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
        },
      },
      '@media (max-width: 768px)': {
        minWidth: 300,
        maxWidth: '94vw',
        borderRadius: '12px',
      },
    }),

    header: css({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      background: theme.isDark 
        ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%)',
      borderBottom: `1px solid ${colors.border}`,
      position: 'relative',
    }),

    title: css({
      fontSize: '17px',
      fontWeight: 700,
      color: colors.textPrimary,
      flex: 1,
      letterSpacing: '-0.02em',
      lineHeight: 1.3,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),

    closeButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      border: 'none',
      background: colors.hoverBg,
      color: colors.textSecondary,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      flexShrink: 0,
      '&:hover': {
        background: colors.activeBg,
        color: colors.textPrimary,
      },
      '&:active': {
        transform: 'scale(0.92)',
        background: colors.activeBg,
      },
    }),

    // Modern circular marker indicator with gradient and glow
    markerIndicator: css({
      position: 'relative',
      width: 'var(--marker-size, 14px)',
      height: 'var(--marker-size, 14px)',
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),

    markerInner: css({
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: `
        radial-gradient(
          ellipse at 30% 30%,
          var(--marker-color-light, rgba(255,255,255,0.6)) 0%,
          var(--marker-color, #00D4AA) 50%,
          color-mix(in srgb, var(--marker-color, #00D4AA) 70%, #000) 100%
        )
      `,
      boxShadow: `
        0 2px 8px color-mix(in srgb, var(--marker-color, #00D4AA) 50%, transparent),
        inset 0 1px 2px rgba(255,255,255,0.4),
        inset 0 -1px 2px rgba(0,0,0,0.2)
      `,
      border: '1px solid color-mix(in srgb, var(--marker-color, #00D4AA) 80%, #fff)',
      animation: 'markerPulse 2s ease-in-out infinite',
      '@keyframes markerPulse': {
        '0%, 100%': { 
          transform: 'scale(1)',
          boxShadow: `
            0 2px 8px color-mix(in srgb, var(--marker-color, #00D4AA) 50%, transparent),
            inset 0 1px 2px rgba(255,255,255,0.4),
            inset 0 -1px 2px rgba(0,0,0,0.2)
          `,
        },
        '50%': { 
          transform: 'scale(1.05)',
          boxShadow: `
            0 3px 12px color-mix(in srgb, var(--marker-color, #00D4AA) 60%, transparent),
            inset 0 1px 2px rgba(255,255,255,0.4),
            inset 0 -1px 2px rgba(0,0,0,0.2)
          `,
        },
      },
    }),

    markerGlow: css({
      position: 'absolute',
      width: '180%',
      height: '180%',
      borderRadius: '50%',
      background: 'radial-gradient(circle, var(--marker-color, #00D4AA) 0%, transparent 70%)',
      opacity: 0.15,
      filter: 'blur(4px)',
      pointerEvents: 'none',
    }),

    imageWrapper: css({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: theme.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.03)',
      padding: '12px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '180px',
      width: '100%',
      boxSizing: 'border-box',
      borderRadius: '12px',
      '& img, & iframe': {
        margin: '0 auto',
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        borderRadius: '8px',
        transition: 'transform 0.3s ease',
      },
      '&:hover img': {
        transform: 'scale(1.02)',
      },
    }),

    image: css({
      width: '100%',
      height: '100%',
      display: 'block',
      margin: '0 auto',
      borderRadius: '8px',
      objectFit: 'cover',
      objectPosition: 'center',
    }),

    content: css({
      padding: '12px 16px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }),

    row: css({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      background: 'transparent',
      borderRadius: '10px',
      border: 'none',
      transition: 'all 0.15s ease',
      cursor: hoverEnabled ? 'default' : undefined,
      ...(hoverEnabled && rowHighlight && {
        '&:hover': {
          background: colors.hoverBg,
        },
      }),
    }),

    rowContent: css({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
    }),

    iconWrapper: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      flexShrink: 0,
      borderRadius: '50%',
      background: colors.accentLight,
      color: colors.accent,
      transition: 'all 0.15s ease',
    }),

    label: css({
      fontSize: '13px',
      color: colors.textSecondary,
      fontWeight: 400,
      lineHeight: 1.4,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexShrink: 0,
    }),

    labelSeparator: css({
      display: 'none',
    }),

    valueWrapper: css({
      display: 'flex',
      alignItems: 'center',
      minWidth: 0,
      flex: 1,
      justifyContent: 'flex-end',
    }),

    value: css({
      color: colors.textPrimary,
      fontSize: '15px',
      lineHeight: 1.4,
      fontWeight: 600,
      textAlign: 'right',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),

    valueLink: css({
      color: colors.accent,
      fontSize: '15px',
      lineHeight: 1.4,
      fontWeight: 600,
      textDecoration: 'none',
      cursor: 'pointer',
      textAlign: 'right',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      transition: 'all 0.15s ease',
      '&:hover': {
        color: colors.accentHover,
        textDecoration: 'underline',
      },
    }),

    iconImage: css({
      width: '40px',
      height: '40px',
      objectFit: 'cover',
      borderRadius: '50%',
      border: `2px solid ${colors.border}`,
    }),

    iconText: css({
      fontSize: '16px',
      lineHeight: 1,
      fontWeight: 600,
    }),

    carouselWrapper: css({
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: theme.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.03)',
      padding: '12px',
      overflow: 'hidden',
      minHeight: '180px',
      width: '100%',
      boxSizing: 'border-box',
      borderRadius: '12px',
      '& img': {
        margin: '0 auto',
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        borderRadius: '8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }),

    carouselButton: css({
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      background: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: 'none',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#fff',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 2,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      '&:hover': {
        background: theme.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.8)',
        transform: 'translateY(-50%) scale(1.1)',
      },
      '&:active': {
        transform: 'translateY(-50%) scale(0.95)',
      },
    }),

    carouselButtonPrev: css({
      left: '12px',
    }),

    carouselButtonNext: css({
      right: '12px',
    }),

    carouselCounter: css({
      position: 'absolute',
      bottom: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      color: '#ffffff',
      padding: '6px 14px',
      borderRadius: '100px',
      fontSize: '12px',
      fontWeight: 600,
      zIndex: 2,
      letterSpacing: '0.5px',
    }),

    buttonContainer: css({
      padding: '12px 16px 16px',
      borderTop: `1px solid ${colors.border}`,
      '& button': {
        borderRadius: '10px',
        fontWeight: 600,
        fontSize: '15px',
        padding: '10px 16px',
        transition: 'all 0.15s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      },
    }),
  };
};
