import { css } from '@emotion/css';
import { Global } from '@emotion/react';
import OpenLayersMap from 'ol/Map';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import View, { ViewOptions } from 'ol/View';
import Attribution from 'ol/control/Attribution';
import ScaleLine from 'ol/control/ScaleLine';
import Zoom from 'ol/control/Zoom';
import { Coordinate } from 'ol/coordinate';
import { isEmpty } from 'ol/extent';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Component, ReactNode } from 'react';
import * as React from 'react';
import { Subscription } from 'rxjs';

import { DataHoverEvent, PanelData, PanelProps } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { PanelContext, PanelContextRoot } from '@grafana/ui';
import { appEvents } from 'app/core/app_events';
import { VariablesChanged } from 'app/features/variables/types';
import { PanelEditExitedEvent } from 'app/types/events';

import { GeomapOverlay, OverlayProps } from './GeomapOverlay';
import { GeomapTooltip } from './GeomapTooltip';
import { DebugOverlay } from './components/DebugOverlay';
import { MeasureOverlay } from './components/MeasureOverlay';
import { MeasureVectorLayer } from './components/MeasureVectorLayer';
import { GeomapHoverPayload } from './event';
import { getGlobalStyles } from './globalStyles';
import { defaultMarkersConfig } from './layers/data/markersLayer';
import { DEFAULT_BASEMAP_CONFIG } from './layers/registry';
import { ControlsOptions, Options, MapLayerState, MapViewConfig, TooltipMode } from './types';
import { getActions } from './utils/actions';
import { getLayersExtent } from './utils/getLayersExtent';
import { applyLayerFilter, initLayer } from './utils/layers';
import { 
  pointerClickListener, 
  setTooltipListeners, 
  cleanupTooltipListeners,
  resetTooltipState,
  forceRefreshTooltipListeners,
  updateHighlightedFeature
} from './utils/tooltip';
import {
  hasLayerData,
  updateMap,
  getNewOpenLayersMap,
  notifyPanelEditor,
  hasVariableDependencies,
} from './utils/utils';
import { centerPointRegistry, MapCenterID } from './view';

// Allows multiple panels to share the same view instance
let sharedView: View | undefined = undefined;

type Props = PanelProps<Options>;
interface State extends OverlayProps {
  ttip?: GeomapHoverPayload;
  ttipOpen: boolean;
  ttipPinned: boolean; // When true, tooltip stays open even when mouse leaves marker
  legends: ReactNode[];
  measureMenuActive?: boolean;
}

export class GeomapPanel extends Component<Props, State> {
  declare context: React.ContextType<typeof PanelContextRoot>;
  static contextType = PanelContextRoot;
  panelContext: PanelContext | undefined = undefined;
  private subs = new Subscription();

  globalCSS = getGlobalStyles(config.theme2);

  mouseWheelZoom?: MouseWheelZoom;
  hoverPayload: GeomapHoverPayload = { point: {}, pageX: -1, pageY: -1 };
  readonly hoverEvent = new DataHoverEvent(this.hoverPayload);

  map?: OpenLayersMap;
  mapDiv?: HTMLDivElement;
  layers: MapLayerState[] = [];
  readonly byName = new Map<string, MapLayerState>();

  constructor(props: Props) {
    super(props);
    this.state = { ttipOpen: false, ttipPinned: false, legends: [] };
    this.subs.add(
      this.props.eventBus.subscribe(PanelEditExitedEvent, (evt) => {
        if (this.mapDiv && this.props.id === evt.payload) {
          this.initMapRef(this.mapDiv);
        }
      })
    );
    // Subscribe to variable changes
    this.subs.add(
      appEvents.subscribe(VariablesChanged, () => {
        if (this.mapDiv) {
          // Check if any of the map's layers are dependent on variables
          const hasDependencies = this.layers.some((layer) => {
            const config = layer.options.config;
            if (!config || typeof config !== 'object') {
              return false;
            }
            return hasVariableDependencies(config);
          });

          if (hasDependencies) {
            this.initMapRef(this.mapDiv);
          }
        }
      })
    );
  }

  componentDidMount() {
    this.panelContext = this.context;
  }

  componentWillUnmount() {
    this.subs.unsubscribe();
    // Clean up tooltip listeners to prevent memory leaks and listener accumulation
    cleanupTooltipListeners(this);
    for (const lyr of this.layers) {
      lyr.handler.dispose?.();
    }
    // Ensure map is disposed
    this.map?.dispose();
  }

  shouldComponentUpdate(nextProps: Props) {
    if (!this.map) {
      return true; // not yet initialized
    }

    // Check for resize
    if (this.props.height !== nextProps.height || this.props.width !== nextProps.width) {
      this.map.updateSize();
    }

    // External data changed
    if (this.props.data !== nextProps.data) {
      this.dataChanged(nextProps.data);
    }

    return true; // always?
  }

  componentDidUpdate(prevProps: Props) {
    if (this.map && (this.props.height !== prevProps.height || this.props.width !== prevProps.width)) {
      this.map.updateSize();
    }
    // Check for a difference between previous data and component data
    if (this.props.data !== prevProps.data) {
      if (this.map) {
        this.dataChanged(this.props.data);
      } else {
        // Map not initialized yet - force a re-render to re-evaluate shouldHidePanel()
        // This handles the case where panel was hidden (no data) and data just arrived
        this.forceUpdate();
      }
    }
    // Handle options changes
    if (this.props.options !== prevProps.options) {
      this.optionsChanged(prevProps.options, this.props.options);
    }
  }

  /** This function will actually update the JSON model */
  doOptionsUpdate(selected: number) {
    const { options, onOptionsChange } = this.props;
    const layers = this.layers;
    this.map?.getLayers().forEach((l) => {
      if (l instanceof MeasureVectorLayer) {
        this.map?.removeLayer(l);
        this.map?.addLayer(l);
      }
    });
    onOptionsChange({
      ...options,
      basemap: layers[0].options,
      layers: layers.slice(1).map((v) => v.options),
    });

    notifyPanelEditor(this, layers, selected);
    this.setState({ legends: this.getLegends() });
  }

  actions = getActions(this);

  /**
   * Called when the panel options change
   *
   * NOTE: changes to basemap and layers are handled independently
   */
  optionsChanged(oldOptions: Options, newOptions: Options) {
    // First check if noRepeat changed - requires full map reinitialization
    const noRepeatChanged = oldOptions.view?.noRepeat !== newOptions.view?.noRepeat;

    if (noRepeatChanged) {
      if (this.mapDiv) {
        this.initMapRef(this.mapDiv);
      }
      // Skip other options processing
      return;
    }

    // Handle incremental view changes
    if (oldOptions.view !== newOptions.view) {
      const view = this.initMapView(newOptions.view);
      if (this.map && view) {
        this.map.setView(view);
      }
    }

    // Handle controls changes
    if (newOptions.controls !== oldOptions.controls) {
      this.initControls(newOptions.controls ?? { showZoom: true, showAttribution: true });
    }
  }

  /**
   * Called when PanelData changes (query results etc)
   */
  dataChanged(data: PanelData) {
    // Only update if panel data matches component data
    if (data === this.props.data) {
      for (const state of this.layers) {
        applyLayerFilter(state.handler, state.options, this.props.data);
      }
    }

    // Because data changed, check map view and change if needed (data fit)
    const v = centerPointRegistry.getIfExists(this.props.options.view.id);
    if (v && v.id === MapCenterID.Fit) {
      const view = this.initMapView(this.props.options.view);

      if (this.map && view) {
        this.map.setView(view);
      }
    }

    // Update legends when data changes
    this.setState({ legends: this.getLegends() });
  }

  initMapRef = async (div: HTMLDivElement) => {
    if (!div) {
      // Div is being removed (e.g., panel hidden due to no markers)
      // Clean up the existing map to prevent memory leaks
      if (this.map) {
        cleanupTooltipListeners(this);
        this.map.dispose();
        this.map = undefined;
        this.layers = [];
        this.byName.clear();
      }
      this.mapDiv = undefined;
      return;
    }
    this.mapDiv = div;
    if (this.map) {
      // Clean up tooltip listeners before disposing the map
      cleanupTooltipListeners(this);
      this.map.dispose();
    }

    const { options } = this.props;

    const map = getNewOpenLayersMap(this, options, div);

    this.byName.clear();
    const layers: MapLayerState[] = [];
    try {
      // Pass noRepeat setting to basemap layer
      const basemapOptions = {
        ...(options.basemap ?? DEFAULT_BASEMAP_CONFIG),
        noRepeat: options.view?.noRepeat ?? false,
      };
      layers.push(await initLayer(this, map, basemapOptions, true));

      // Default layer values
      if (!options.layers) {
        options.layers = [defaultMarkersConfig];
      }

      for (const lyr of options.layers) {
        layers.push(await initLayer(this, map, lyr, false));
      }
    } catch (ex) {
      console.error('error loading layers', ex);
    }

    for (const lyr of layers) {
      map.addLayer(lyr.layer);
    }
    this.layers = layers;
    this.map = map; // redundant
    this.initViewExtent(map.getView(), options.view);

    this.mouseWheelZoom = new MouseWheelZoom();
    this.map?.addInteraction(this.mouseWheelZoom);

    updateMap(this, options);
    setTooltipListeners(this);
    notifyPanelEditor(this, layers, layers.length - 1);

    this.setState({ legends: this.getLegends() });
  };

  clearTooltip = () => {
    if (this.state.ttip && !this.state.ttipOpen) {
      this.tooltipPopupClosed();
    }
  };

  /**
   * Called when the tooltip is closed (either by clicking close button or clicking away)
   * Uses resetTooltipState for consistent state cleanup
   */
  tooltipPopupClosed = () => {
    // Use the centralized reset function for consistent cleanup
    resetTooltipState(this);
  };

  /**
   * Called when a different feature is selected in a cluster tooltip
   * Updates the highlighted marker on the map to match the selected site
   */
  handleFeatureSelect = (rowIndex: number) => {
    updateHighlightedFeature(this, rowIndex);
  };

  /**
   * Force refresh the tooltip system
   * Can be called externally to recover from stuck states
   * Also available as a keyboard shortcut: Escape key while hovering over the map
   */
  forceRefreshTooltip = () => {
    forceRefreshTooltipListeners(this);
  };

  pointerClickListener = (evt: MapBrowserEvent<PointerEvent>) => {
    pointerClickListener(evt, this);
  };

  /**
   * Keyboard handler for accessibility and recovery
   * - Escape: Close tooltip / reset tooltip state
   */
  handleKeyDown = (evt: React.KeyboardEvent<HTMLDivElement>) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      // If tooltip is open/pinned, just close it
      if (this.state.ttipOpen || this.state.ttipPinned) {
        resetTooltipState(this);
      }
    }
  };

  initMapView = (config: MapViewConfig): View | undefined => {
    const noRepeat = config.noRepeat ?? false;

    let viewOptions: ViewOptions = {
      center: [0, 0],
      zoom: 1,
    };

    // Only apply constraints when no-repeat is enabled
    if (noRepeat) {
      // Define the world extent in EPSG:3857 (Web Mercator)
      const worldExtent = [-180, -85.05112878, 180, 85.05112878]; // [minx, miny, maxx, maxy] in EPSG:4326
      const projectedExtent = transformExtent(worldExtent, 'EPSG:4326', 'EPSG:3857');
      viewOptions.extent = projectedExtent;
      viewOptions.showFullExtent = false;
      viewOptions.constrainOnlyCenter = false;
    }

    let view = new View(viewOptions);

    // With shared views, all panels use the same view instance
    if (config.shared) {
      if (!sharedView) {
        sharedView = view;
      } else {
        view = sharedView;
      }
    }

    this.initViewExtent(view, config);
    return view;
  };

  initViewExtent(view: View, config: MapViewConfig) {
    const v = centerPointRegistry.getIfExists(config.id);
    if (v) {
      let coord: Coordinate | undefined = undefined;
      if (v.lat == null) {
        if (v.id === MapCenterID.Coordinates) {
          coord = [config.lon ?? 0, config.lat ?? 0];
        } else if (v.id === MapCenterID.Fit) {
          const extent = getLayersExtent(this.layers, config.allLayers, config.lastOnly, config.layer);
          if (!isEmpty(extent)) {
            const padding = config.padding ?? 5;
            const res = view.getResolutionForExtent(extent, this.map?.getSize());
            const maxZoom = config.zoom ?? config.maxZoom;
            view.fit(extent, {
              maxZoom: maxZoom,
            });
            view.setResolution(res * (padding / 100 + 1));
            const adjustedZoom = view.getZoom();
            if (adjustedZoom && maxZoom && adjustedZoom > maxZoom) {
              view.setZoom(maxZoom);
            }
          }
        } else {
          // TODO: view requires special handling
        }
      } else {
        coord = [v.lon ?? 0, v.lat ?? 0];
      }
      if (coord) {
        view.setCenter(fromLonLat(coord));
      }
    }

    if (config.maxZoom) {
      view.setMaxZoom(config.maxZoom);
    }
    if (config.minZoom) {
      view.setMaxZoom(config.minZoom);
    }
    if (config.zoom && v?.id !== MapCenterID.Fit) {
      view.setZoom(config.zoom);
    }
  }

  initControls(options: ControlsOptions) {
    if (!this.map) {
      return;
    }
    this.map.getControls().clear();

    if (options.showZoom) {
      this.map.addControl(new Zoom());
    }

    if (options.showScale) {
      this.map.addControl(
        new ScaleLine({
          units: options.scaleUnits,
          minWidth: 100,
        })
      );
    }

    this.mouseWheelZoom!.setActive(Boolean(options.mouseWheelZoom));

    if (options.showAttribution) {
      this.map.addControl(new Attribution({ collapsed: true, collapsible: true }));
    }

    // Update the react overlays
    let topRight1: ReactNode[] = [];
    if (options.showMeasure) {
      topRight1 = [
        <MeasureOverlay
          key="measure"
          map={this.map}
          // Lifts menuActive state and resets tooltip state upon close
          menuActiveState={(value: boolean) => {
            this.setState({ ttipOpen: value, measureMenuActive: value });
          }}
        />,
      ];
    }

    let topRight2: ReactNode[] = [];
    if (options.showDebug) {
      topRight2 = [<DebugOverlay key="debug" map={this.map} />];
    }

    this.setState({ topRight1, topRight2 });
  }

  getLegends() {
    const legends: ReactNode[] = [];
    for (const state of this.layers) {
      if (state.handler.legend) {
        const hasData = hasLayerData(state.layer);
        if (hasData) {
          legends.push(<div key={state.options.name}>{state.handler.legend}</div>);
        }
      }
    }

    return legends;
  }

  /**
   * Checks if any data layers have markers/features to display
   */
  hasMarkers(): boolean {
    // Skip the first layer (basemap) and check if any data layers have features
    for (let i = 1; i < this.layers.length; i++) {
      const layer = this.layers[i];
      if (hasLayerData(layer.layer)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if panel data contains any data that could produce markers.
   * This is used when layers haven't been initialized yet to avoid
   * the chicken-and-egg problem where we can't check markers without
   * initializing the map first.
   */
  hasDataForMarkers(): boolean {
    const { data } = this.props;
    
    if (!data || !data.series || data.series.length === 0) {
      return false;
    }
    
    // Check if any data frame has rows (potential marker data)
    return data.series.some(frame => frame.length > 0);
  }

  /**
   * Determines if the panel should be visually hidden based on the "hide when no markers" option.
   * 
   * IMPORTANT: This returns whether to VISUALLY hide (CSS), not whether to unmount.
   * We always render the map container to allow initialization, but hide it visually
   * when there are no markers. This is more performant than destroying/recreating the map.
   * 
   * This handles two scenarios:
   * 1. Map not initialized yet: Check if incoming data could produce markers
   *    - Always render the map container to allow initialization
   *    - Hide visually if no data
   * 2. Map initialized: Check actual OpenLayers layer features
   *    - If markers exist, show the panel
   *    - If no markers, hide visually (but keep map alive for quick recovery)
   */
  shouldHidePanel(): boolean {
    const { options } = this.props;
    
    // If option is not enabled, never hide
    if (!options.controls?.hideWhenNoMarkers) {
      return false;
    }
    
    // If map is initialized and we have data layers, check actual markers
    if (this.map && this.layers.length > 1) {
      return !this.hasMarkers();
    }
    
    // Map not initialized yet - check if data could produce markers
    // Even if no data, we still render the map (hidden) to allow initialization
    // This prevents the chicken-and-egg problem
    return !this.hasDataForMarkers();
  }

  /**
   * Determines if we should completely unmount the panel (return null from render).
   * This is more aggressive than shouldHidePanel() and is used sparingly.
   * 
   * We only completely unmount when:
   * - hideWhenNoMarkers is enabled AND
   * - There's no data AND
   * - The map has already been initialized (so we're not blocking initial setup)
   * 
   * This prevents unnecessary DOM/map recreation when data temporarily becomes empty.
   */
  shouldUnmountPanel(): boolean {
    const { options } = this.props;
    
    // If option is not enabled, never unmount
    if (!options.controls?.hideWhenNoMarkers) {
      return false;
    }
    
    // Only unmount if there's truly no data AND map was already initialized
    // This allows the map to initialize even with no initial data
    if (!this.hasDataForMarkers()) {
      // If map exists and has processed data before, it's safe to unmount
      // If map doesn't exist, we need to render to allow initialization
      return this.map !== undefined && this.layers.length > 1 && !this.hasMarkers();
    }
    
    return false;
  }

  render() {
    let { ttip, ttipOpen, topRight1, legends, topRight2 } = this.state;
    const { options } = this.props;
    const showScale = options.controls.showScale;

    // Determine visibility state
    // shouldUnmountPanel: completely remove from DOM (aggressive, used sparingly)
    // shouldHidePanel: keep in DOM but hide with CSS (preferred for performance)
    const shouldUnmount = this.shouldUnmountPanel();
    const shouldHide = this.shouldHidePanel();

    // Only completely unmount in specific cases to preserve map state
    // This prevents expensive map recreation when data temporarily becomes empty
    if (shouldUnmount) {
      return null;
    }

    if (!ttipOpen && options.tooltip?.mode === TooltipMode.None) {
      ttip = undefined;
    }

    // Use CSS visibility to hide the panel while keeping the map alive
    // This is more performant than destroying/recreating the map on every data change
    const wrapperStyle = shouldHide ? { visibility: 'hidden' as const, height: 0, overflow: 'hidden' as const } : undefined;

    return (
      <>
        <Global styles={this.globalCSS} />
        <div className={styles.wrap} onMouseLeave={this.clearTooltip} style={wrapperStyle}>
          <div
            role="application"
            className={styles.map}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0} // Interactivity is added through the ref
            aria-label={t('geomap.geomap-panel.aria-label-map', 'Navigable map')}
            ref={this.initMapRef}
            onKeyDown={this.handleKeyDown}
          ></div>
          <GeomapOverlay
            bottomLeft={legends}
            topRight1={topRight1}
            topRight2={topRight2}
            blStyle={{ bottom: showScale ? '35px' : '8px' }}
          />
        </div>
        {/* Only show tooltip when panel is visible */}
        {!shouldHide && (
          <GeomapTooltip 
            ttip={ttip} 
            isOpen={ttipOpen} 
            onClose={this.tooltipPopupClosed}
            onFeatureSelect={this.handleFeatureSelect}
          />
        )}
      </>
    );
  }
}

const styles = {
  wrap: css({
    position: 'relative',
    width: '100%',
    height: '100%',
  }),
  map: css({
    position: 'absolute',
    zIndex: 0,
    width: '100%',
    height: '100%',
  }),
};
