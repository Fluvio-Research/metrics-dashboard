import { css } from '@emotion/css';
import { FeatureLike } from 'ol/Feature';
import { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { GeomapLayerHover } from 'app/plugins/panel/geomap/event';

import { DataHoverRow } from './DataHoverRow';
import { generateLabel } from './DataHoverRows';
import { DataHoverTabs } from './DataHoverTabs';

export interface Props {
  layers?: GeomapLayerHover[];
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect?: (rowIndex: number) => void; // Called when a feature is selected in cluster
}

/**
 * ComplexDataHoverView - Handles tooltips for overlapping markers
 * 
 * Behavior:
 * - Single marker: Shows tooltip directly
 * - Multiple markers: Shows professional site selector
 * - On site selection: Shows only that site's tooltip + highlights marker on map
 * - Back button returns to site selector
 */
export const ComplexDataHoverView = ({ layers, onClose, isOpen, onFeatureSelect }: Props) => {
  const styles = useStyles2(getStyles);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  // null = show selector, number = show specific feature
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number | null>(null);

  /**
   * Handle feature selection with marker highlight callback
   * Updates both the tooltip view and the highlighted marker on the map
   */
  const handleFeatureSelect = (index: number) => {
    setSelectedFeatureIndex(index);
    
    // Notify parent to update marker highlight on the map
    if (onFeatureSelect && layers?.[activeTabIndex]?.features?.[index]) {
      const feature = layers[activeTabIndex].features[index];
      const rowIndex = feature.get('rowIndex');
      if (rowIndex !== undefined) {
        onFeatureSelect(rowIndex);
      }
    }
  };

  if (!layers) {
    return null;
  }

  // Get the active layer
  const activeLayer = layers[activeTabIndex];
  if (!activeLayer) {
    return null;
  }

  // Check if we have multiple features (overlapping markers)
  const features = activeLayer.features;
  const hasMultipleFeatures = features.length > 1;

  // Single feature - show tooltip directly
  if (!hasMultipleFeatures) {
    return (
      <>
        {layers.length > 1 && (
          <DataHoverTabs 
            layers={layers} 
            setActiveTabIndex={setActiveTabIndex} 
            activeTabIndex={activeTabIndex} 
          />
        )}
        <DataHoverRow feature={features[0]} onClose={onClose} />
      </>
    );
  }

  // Multiple features with one selected - show that feature's tooltip
  if (selectedFeatureIndex !== null && features[selectedFeatureIndex]) {
    const selectedFeature = features[selectedFeatureIndex];
    return (
      <div className={styles.selectedView}>
        {/* Back button to return to selector */}
        <button 
          className={styles.backButton}
          onClick={() => setSelectedFeatureIndex(null)}
          aria-label="Back to site list"
        >
          <Icon name="arrow-left" size="md" />
          <span>Back to sites ({features.length})</span>
        </button>
        <DataHoverRow feature={selectedFeature} onClose={onClose} />
      </div>
    );
  }

  // Multiple features - show professional site selector
  return (
    <div className={styles.selectorWrapper}>
      {/* Header */}
      <div className={styles.selectorHeader}>
        <div className={styles.headerContent}>
          <Icon name="map-marker" size="lg" className={styles.headerIcon} />
          <div className={styles.headerText}>
            <span className={styles.headerTitle}>{features.length} Sites at this location</span>
            <span className={styles.headerSubtitle}>Select a site to view details</span>
          </div>
        </div>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="times" size="lg" />
        </button>
      </div>

      {/* Site List */}
      <div className={styles.siteList}>
        {features.map((feature, idx) => (
          <SiteOption
            key={feature.getId() ?? idx}
            feature={feature}
            index={idx}
            onClick={() => handleFeatureSelect(idx)}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div className={styles.footer}>
        <Icon name="info-circle" size="sm" />
        <span>Click a site to view its full details</span>
      </div>
    </div>
  );
};

// Individual site option component
interface SiteOptionProps {
  feature: FeatureLike;
  index: number;
  onClick: () => void;
}

const SiteOption = ({ feature, index, onClick }: SiteOptionProps) => {
  const styles = useStyles2(getStyles);
  const label = generateLabel(feature, index);
  
  // Try to get additional info for subtitle
  const frame = feature.get('frame');
  const rowIndex = feature.get('rowIndex');
  let subtitle = '';
  
  if (frame && rowIndex !== undefined) {
    // Try to find a secondary field value for subtitle
    const secondaryFields = ['Type', 'type', 'Category', 'category', 'Status', 'status', 'Location', 'location'];
    for (const fieldName of secondaryFields) {
      const field = frame.fields.find((f: any) => f.name === fieldName || f.name.toLowerCase() === fieldName.toLowerCase());
      if (field && field.values[rowIndex]) {
        subtitle = String(field.values[rowIndex]);
        break;
      }
    }
  }

  return (
    <button
      className={styles.siteOption}
      onClick={onClick}
      aria-label={`View ${label}`}
    >
      <div className={styles.siteMarker}>
        <span className={styles.siteNumber}>{index + 1}</span>
      </div>
      <div className={styles.siteInfo}>
        <span className={styles.siteName}>{label}</span>
        {subtitle && <span className={styles.siteSubtitle}>{subtitle}</span>}
      </div>
      <Icon name="angle-right" size="lg" className={styles.siteArrow} />
    </button>
  );
};

/**
 * Modern Facebook/Meta-style site selector design
 * Clean, minimal, with smooth micro-interactions
 */
const getStyles = (theme: GrafanaTheme2) => {
  // Consistent color palette
  const colors = {
    cardBg: theme.isDark ? 'rgba(30, 32, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    accent: theme.isDark ? '#0084ff' : '#1877f2',
    accentLight: theme.isDark ? 'rgba(0, 132, 255, 0.12)' : 'rgba(24, 119, 242, 0.08)',
    textPrimary: theme.isDark ? '#e4e6eb' : '#050505',
    textSecondary: theme.isDark ? '#b0b3b8' : '#65676b',
    border: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    hoverBg: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    activeBg: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
  };

  return {
    selectorWrapper: css({
      background: colors.cardBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '16px',
      overflow: 'hidden',
      minWidth: '340px',
      maxWidth: '380px',
      boxShadow: theme.isDark 
        ? '0 12px 28px 0 rgba(0, 0, 0, 0.4), 0 2px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
        : '0 12px 28px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      animation: 'selectorFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '@keyframes selectorFadeIn': {
        '0%': { opacity: 0, transform: 'scale(0.95) translateY(8px)' },
        '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
      },
    }),

    selectorHeader: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      background: theme.isDark 
        ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%)',
      borderBottom: `1px solid ${colors.border}`,
    }),

    headerContent: css({
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }),

    headerIcon: css({
      color: colors.accent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: colors.accentLight,
    }),

    headerText: css({
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    }),

    headerTitle: css({
      fontSize: '17px',
      fontWeight: 700,
      color: colors.textPrimary,
      letterSpacing: '-0.02em',
      lineHeight: 1.3,
    }),

    headerSubtitle: css({
      fontSize: '13px',
      color: colors.textSecondary,
      fontWeight: 400,
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
      '&:hover': {
        background: colors.activeBg,
        color: colors.textPrimary,
      },
      '&:active': {
        transform: 'scale(0.92)',
      },
    }),

    siteList: css({
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '360px',
      overflowY: 'auto',
      padding: '8px',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        borderRadius: '100px',
        border: '2px solid transparent',
        backgroundClip: 'padding-box',
      },
    }),

    siteOption: css({
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      width: '100%',
      padding: '12px 14px',
      margin: '2px 0',
      background: 'transparent',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        background: colors.hoverBg,
        '& > svg:last-child': {
          opacity: 1,
          transform: 'translateX(4px)',
          color: colors.accent,
        },
      },
      '&:active': {
        background: colors.activeBg,
        transform: 'scale(0.98)',
      },
    }),

    siteMarker: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: colors.accentLight,
      flexShrink: 0,
      transition: 'all 0.15s ease',
    }),

    siteNumber: css({
      color: colors.accent,
      fontSize: '16px',
      fontWeight: 700,
    }),

    siteInfo: css({
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minWidth: 0,
      overflow: 'hidden',
    }),

    siteName: css({
      fontSize: '15px',
      fontWeight: 600,
      color: colors.textPrimary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      lineHeight: 1.4,
    }),

    siteSubtitle: css({
      fontSize: '13px',
      color: colors.textSecondary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),

    siteArrow: css({
      color: colors.textSecondary,
      flexShrink: 0,
      opacity: 0,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }),

    footer: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '14px 20px',
      borderTop: `1px solid ${colors.border}`,
      fontSize: '13px',
      color: colors.textSecondary,
      '& svg': {
        opacity: 0.7,
      },
    }),

    selectedView: css({
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '@keyframes slideIn': {
        '0%': { opacity: 0, transform: 'translateX(20px)' },
        '100%': { opacity: 1, transform: 'translateX(0)' },
      },
    }),

    backButton: css({
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '14px 20px',
      background: theme.isDark 
        ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%)',
      border: 'none',
      borderBottom: `1px solid ${colors.border}`,
      color: colors.accent,
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      '&:hover': {
        background: colors.hoverBg,
        '& svg': {
          transform: 'translateX(-4px)',
        },
      },
      '&:active': {
        background: colors.activeBg,
      },
      '& svg': {
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }),
  };
};
