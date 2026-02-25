import Feature from 'ol/Feature';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { toLonLat } from 'ol/proj';
import { Style } from 'ol/style';

import { DataFrame, DataHoverClearEvent } from '@grafana/data';

import { GeomapPanel } from '../GeomapPanel';
import { GeomapLayerHover } from '../event';
import { MapLayerState } from '../types';

import { getMapLayerState } from './layers';

/**
 * TOOLTIP STATE MANAGEMENT - CLICK-ONLY BEHAVIOR
 * 
 * Simple and clean tooltip behavior:
 * - Click on marker → Opens tooltip + highlights marker (scales up)
 * - Click elsewhere → Closes tooltip + restores marker
 * - Click close button → Closes tooltip + restores marker
 * - NO hover tooltips (cleaner UX)
 * 
 * MARKER HIGHLIGHTING:
 * - Selected marker scales up 60% for visual identification
 * - Brought to front (z-index 9999) to stand out in clusters
 * - Only the selected site is highlighted, not all overlapping ones
 * - Updates when navigating between sites in cluster tooltip
 */

// Store highlighted feature info for restoration
interface HighlightedFeatureState {
  feature: Feature;
  originalStyle: Style | Style[] | undefined;
}

// Store event keys and handlers for cleanup
interface TooltipListenerState {
  clickKey?: EventsKey;
  moveKey?: EventsKey;
  recoveryTimer?: ReturnType<typeof setTimeout>;
  highlightedFeatures?: HighlightedFeatureState[];
}

const panelListeners = new WeakMap<GeomapPanel, TooltipListenerState>();

// Configuration constants
const TOOLTIP_CONFIG = {
  HIT_TOLERANCE: 5, // Pixels around feature for hit detection
  RECOVERY_CHECK_INTERVAL_MS: 10000, // Check for stuck states every 10 seconds
  HIGHLIGHT_SCALE: 1.6, // Scale factor for highlighted markers (60% larger)
  HIGHLIGHT_Z_INDEX: 9999, // Z-index for highlighted markers (above others)
};

/**
 * Creates a highlighted version of a marker style
 * Scales up the marker for visual emphasis
 */
const createHighlightedStyle = (originalStyle: Style | Style[] | undefined): Style | Style[] | undefined => {
  if (!originalStyle) {
    return undefined;
  }

  const scaleStyle = (style: Style): Style => {
    const clone = style.clone();
    const image = clone.getImage();
    
    if (image) {
      const currentScale = image.getScale();
      const baseScale = Array.isArray(currentScale) ? currentScale[0] : (currentScale || 1);
      image.setScale(baseScale * TOOLTIP_CONFIG.HIGHLIGHT_SCALE);
    }
    
    // Bring to front
    clone.setZIndex(TOOLTIP_CONFIG.HIGHLIGHT_Z_INDEX);
    
    return clone;
  };

  if (Array.isArray(originalStyle)) {
    return originalStyle.map(scaleStyle);
  }
  
  return scaleStyle(originalStyle);
};

/**
 * Highlights a single feature by scaling it up
 * Stores original style for later restoration
 */
const highlightFeature = (panel: GeomapPanel, feature: Feature): void => {
  const listeners = panelListeners.get(panel);
  if (!listeners) {
    return;
  }

  // Initialize array if needed
  if (!listeners.highlightedFeatures) {
    listeners.highlightedFeatures = [];
  }

  // Skip if already highlighted
  if (listeners.highlightedFeatures.some(h => h.feature === feature)) {
    return;
  }

  // Store original style
  const originalStyle = feature.getStyle() as Style | Style[] | undefined;

  listeners.highlightedFeatures.push({
    feature,
    originalStyle,
  });

  // Apply highlighted style
  const highlightedStyle = createHighlightedStyle(originalStyle);
  if (highlightedStyle) {
    feature.setStyle(highlightedStyle);
  }
};

/**
 * Restores all highlighted features to their original styles
 */
const restoreHighlightedFeatures = (panel: GeomapPanel): void => {
  const listeners = panelListeners.get(panel);
  if (!listeners?.highlightedFeatures) {
    return;
  }

  // Restore each feature
  listeners.highlightedFeatures.forEach(({ feature, originalStyle }) => {
    if (feature) {
      feature.setStyle(originalStyle);
    }
  });

  // Clear the array
  listeners.highlightedFeatures = [];
};

/**
 * Updates the highlighted feature when navigating between sites in a cluster
 * Called when user selects a different site from the compound tooltip
 */
export const updateHighlightedFeature = (panel: GeomapPanel, newRowIndex: number): void => {
  const listeners = panelListeners.get(panel);
  if (!listeners) {
    return;
  }

  // First restore any currently highlighted features
  restoreHighlightedFeatures(panel);

  // Find and highlight the feature with the new rowIndex
  const ttip = panel.state.ttip;
  if (ttip?.layers) {
    for (const layerHover of ttip.layers) {
      for (const feature of layerHover.features) {
        if (feature instanceof Feature && feature.get('rowIndex') === newRowIndex) {
          highlightFeature(panel, feature);
          return; // Only highlight one feature
        }
      }
    }
  }
};

/**
 * Resets the tooltip to a clean closed state
 * Also restores any highlighted markers to their original size
 */
export const resetTooltipState = (panel: GeomapPanel): void => {
  // Restore highlighted features first
  restoreHighlightedFeatures(panel);
  
  // Reset panel state
  panel.setState({
    ttipOpen: false,
    ttipPinned: false,
    ttip: undefined,
  });
  
  // Clear any mouse events on layers
  panel.layers.forEach((layer) => {
    layer.mouseEvents.next(undefined);
  });
  
  // Reset cursor
  if (panel.mapDiv) {
    panel.mapDiv.style.cursor = 'auto';
  }
  
  // Publish clear event
  panel.props.eventBus.publish(new DataHoverClearEvent());
};

/**
 * Forces a complete refresh of tooltip listeners
 */
export const forceRefreshTooltipListeners = (panel: GeomapPanel): void => {
  cleanupTooltipListeners(panel);
  resetTooltipState(panel);
  setTooltipListeners(panel);
};

/**
 * Checks for stuck tooltip states and recovers
 */
const checkAndRecoverStuckState = (panel: GeomapPanel): void => {
  // Recovery: Tooltip open but no data (inconsistent state)
  if (panel.state.ttipOpen && !panel.state.ttip) {
    resetTooltipState(panel);
  }
};

export const cleanupTooltipListeners = (panel: GeomapPanel): void => {
  const listeners = panelListeners.get(panel);
  if (listeners) {
    // Restore any highlighted features before cleanup
    restoreHighlightedFeatures(panel);
    
    if (listeners.recoveryTimer) {
      clearInterval(listeners.recoveryTimer);
    }
    if (listeners.clickKey) {
      unByKey(listeners.clickKey);
    }
    if (listeners.moveKey) {
      unByKey(listeners.moveKey);
    }
    panelListeners.delete(panel);
  }
};

/**
 * Sets up CLICK-ONLY tooltip behavior
 * - Click on marker = open tooltip
 * - Click elsewhere = close tooltip
 * - Hover just changes cursor (no tooltip)
 */
export const setTooltipListeners = (panel: GeomapPanel): void => {
  cleanupTooltipListeners(panel);
  
  if (!panel.map) {
    return;
  }

  const listenerState: TooltipListenerState = {};

  // CLICK handler - opens/closes tooltip
  const clickKey = panel.map.on('singleclick', (evt) => {
    pointerClickListener(evt as MapBrowserEvent<PointerEvent>, panel);
  });
  
  // MOVE handler - just changes cursor, no tooltip on hover
  const moveKey = panel.map.on('pointermove', (evt) => {
    if (!panel.map || !panel.mapDiv) return;
    
    const pixel = panel.map.getEventPixel((evt as MapBrowserEvent<PointerEvent>).originalEvent);
    const hasFeature = panel.map.hasFeatureAtPixel(pixel, {
      hitTolerance: TOOLTIP_CONFIG.HIT_TOLERANCE,
      layerFilter: (l) => {
        const layerState = getMapLayerState(l);
        const layerOptions = layerState?.options as any;
        return (layerOptions?.tooltip ?? layerOptions?.['layer-tooltip']) !== false;
      },
    });
    
    // Just update cursor - no tooltip on hover
    panel.mapDiv.style.cursor = hasFeature ? 'pointer' : 'auto';
  });
  
  // Periodic recovery check
  const recoveryTimer = setInterval(() => {
    checkAndRecoverStuckState(panel);
  }, TOOLTIP_CONFIG.RECOVERY_CHECK_INTERVAL_MS);
  
  listenerState.clickKey = clickKey;
  listenerState.moveKey = moveKey;
  listenerState.recoveryTimer = recoveryTimer;
  
  panelListeners.set(panel, listenerState);
};

/**
 * CLICK handler - Simple open/close tooltip behavior
 * 
 * - Click on marker: Open tooltip (or switch to different marker)
 * - Click on same marker again: Close tooltip
 * - Click on empty area: Close tooltip
 */
export const pointerClickListener = (
  evt: MapBrowserEvent<PointerEvent>,
  panel: GeomapPanel
): void => {
  if (!panel.map) {
    return;
  }

  const pixel = panel.map.getEventPixel(evt.originalEvent);
  
  // Check if clicked on a marker
  const hasFeatureAtClick = panel.map.hasFeatureAtPixel(pixel, {
    hitTolerance: TOOLTIP_CONFIG.HIT_TOLERANCE,
    layerFilter: (l) => {
      const layerState = getMapLayerState(l);
      const layerOptions = layerState?.options as any;
      return (layerOptions?.tooltip ?? layerOptions?.['layer-tooltip']) !== false;
    },
  });

  // Clicked on empty area - close tooltip
  if (!hasFeatureAtClick) {
    if (panel.state.ttipOpen) {
      resetTooltipState(panel);
    }
    return;
  }

  // Get clicked feature's row index
  let clickedRowIndex: number | undefined;
  panel.map.forEachFeatureAtPixel(
    pixel,
    (feature) => {
      if (clickedRowIndex === undefined) {
        clickedRowIndex = feature.get('rowIndex');
      }
    },
    {
      hitTolerance: TOOLTIP_CONFIG.HIT_TOLERANCE,
      layerFilter: (l) => {
        const layerState = getMapLayerState(l);
        const layerOptions = layerState?.options as any;
        return (layerOptions?.tooltip ?? layerOptions?.['layer-tooltip']) !== false;
      },
    }
  );

  // If clicking the same marker that's already open - close it
  if (panel.state.ttipOpen && clickedRowIndex === panel.state.ttip?.rowIndex) {
    resetTooltipState(panel);
    return;
  }

  // Open tooltip for clicked marker
  evt.preventDefault();
  evt.stopPropagation();

  const mouse = evt.originalEvent;
  const { hoverPayload } = panel;
  const hover = toLonLat(panel.map.getCoordinateFromPixel(pixel));
  
  hoverPayload.pageX = mouse.pageX;
  hoverPayload.pageY = mouse.pageY - window.scrollY;
  hoverPayload.point = { lat: hover[1], lon: hover[0] };
  hoverPayload.data = undefined;
  hoverPayload.rowIndex = undefined;
  hoverPayload.layers = undefined;

  const layers: GeomapLayerHover[] = [];
  const layerLookup = new Map<MapLayerState, GeomapLayerHover>();

  // Collect all features at click location
  panel.map.forEachFeatureAtPixel(
    pixel,
    (feature, layer) => {
      const s = getMapLayerState(layer);
      
      if (!hoverPayload.data) {
        const props = feature.getProperties();
        const frame: DataFrame = props['frame'];
        if (frame) {
          hoverPayload.data = frame;
          hoverPayload.rowIndex = props['rowIndex'];
        }
      }

      if (s) {
        let h = layerLookup.get(s);
        if (!h) {
          h = { layer: s, features: [] };
          layerLookup.set(s, h);
          layers.push(h);
        }
        if (!h.features.some((f) => f === feature)) {
          h.features.push(feature);
        }
      }
    },
    {
      hitTolerance: TOOLTIP_CONFIG.HIT_TOLERANCE,
      layerFilter: (l) => {
        const hoverLayerState = getMapLayerState(l);
        const layerOptions = hoverLayerState?.options as any;
        return (layerOptions?.tooltip ?? layerOptions?.['layer-tooltip']) !== false;
      },
    }
  );

  if (layers.length > 0) {
    hoverPayload.layers = layers;
    
    // Highlight only the selected feature (the one shown in tooltip)
    // This helps identify which exact marker is selected in a cluster
    const selectedRowIndex = hoverPayload.rowIndex;
    if (selectedRowIndex !== undefined) {
      for (const layerHover of layers) {
        for (const feature of layerHover.features) {
          if (feature instanceof Feature && feature.get('rowIndex') === selectedRowIndex) {
            highlightFeature(panel, feature);
            break;
          }
        }
      }
    }
    
    // Open the tooltip
    panel.setState({
      ttip: { ...hoverPayload },
      ttipOpen: true,
      ttipPinned: true,
    });
  }
};

// pointerMoveListener removed - using click-only behavior
