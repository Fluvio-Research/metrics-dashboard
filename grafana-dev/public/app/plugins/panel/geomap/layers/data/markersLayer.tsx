import OpenLayersMap from 'ol/Map';
import { Point } from 'ol/geom';
import { VectorImage } from 'ol/layer';
import LayerGroup from 'ol/layer/Group';
import WebGLPointsLayer from 'ol/layer/WebGLPoints.js';
import { ReactNode } from 'react';
import { ReplaySubject } from 'rxjs';
import tinycolor from 'tinycolor2';

import {
  MapLayerRegistryItem,
  MapLayerOptions,
  PanelData,
  GrafanaTheme2,
  FrameGeometrySourceMode,
  EventBus,
  PanelOptionsEditorBuilder,
} from '@grafana/data';
import { ResourceDimensionMode } from '@grafana/schema';
import { t } from '@grafana/i18n';
import { FrameVectorSource } from 'app/features/geo/utils/frameVectorSource';
import { getLocationMatchers } from 'app/features/geo/utils/location';

import { MarkersLegend, MarkersLegendProps } from '../../components/MarkersLegend';
import { ObservablePropsWrapper } from '../../components/ObservablePropsWrapper';
import { StyleEditor } from '../../editor/StyleEditor';
import { getWebGLStyle, textMarker } from '../../style/markers';
import { DEFAULT_SIZE, defaultStyleConfig, StyleConfig, StyleConfigValues } from '../../style/types';
import { getDisplacement, getRGBValues, getStyleConfigState, styleUsesText } from '../../style/utils';
import { getStyleDimension } from '../../utils/utils';

// Configuration options for Circle overlays
export interface MarkersConfig {
  style: StyleConfig;
  showLegend?: boolean;
  markerShape?: 'standard' | 'pin';
  pinTipColor?: string;
}

const defaultOptions: MarkersConfig = {
  style: defaultStyleConfig,
  showLegend: true,
  markerShape: 'standard',
  pinTipColor: '#202124',
};

export const MARKERS_LAYER_ID = 'markers';

// Used by default when nothing is configured
export const defaultMarkersConfig: MapLayerOptions<MarkersConfig> = {
  type: MARKERS_LAYER_ID,
  name: '', // will get replaced
  config: defaultOptions,
  location: {
    mode: FrameGeometrySourceMode.Auto,
  },
  tooltip: true,
};

/**
 * Map layer configuration for circle overlay
 */
export const markersLayer: MapLayerRegistryItem<MarkersConfig> = {
  id: MARKERS_LAYER_ID,
  name: 'Markers',
  description: 'Use markers to render each data point',
  isBaseMap: false,
  showLocation: true,
  hideOpacity: true,

  /**
   * Function that configures transformation and returns a transformer
   * @param map
   * @param options
   * @param theme
   */
  create: async (map: OpenLayersMap, options: MapLayerOptions<MarkersConfig>, eventBus: EventBus, theme: GrafanaTheme2) => {
    // Assert default values
    const config = {
      ...defaultOptions,
      ...options?.config,
    };

    const usePin = config.markerShape === 'pin';
    if (usePin) {
      config.style = {
        ...config.style,
        symbol: {
          ...(config.style.symbol ?? { mode: ResourceDimensionMode.Fixed }),
          fixed: 'google-pin',
        },
        pinTipColor: config.pinTipColor ?? config.style.pinTipColor,
      };
    } else if (config.pinTipColor) {
      config.style = {
        ...config.style,
        pinTipColor: config.pinTipColor,
      };
    }

    const style = await getStyleConfigState(config.style);
    if (usePin) {
      style.base.pinTipColor = config.pinTipColor ?? style.base.pinTipColor ?? '#202124';
    }
    const symbol = config.style.symbol?.fixed;
    console.log('🔍 Markers Layer - Symbol selected:', symbol);
    console.log('🔍 Markers Layer - usePin:', usePin);
    
    const webGLStyle = await getWebGLStyle(symbol, config.style.opacity);
    const hasText = styleUsesText(config.style);
    const location = await getLocationMatchers(options.location);
    const source = new FrameVectorSource<Point>(location);
    const symbolLayer = new WebGLPointsLayer({ source, style: webGLStyle });
    const vectorLayer = new VectorImage({ source, declutter: true });
    
    // Check if symbol needs vector layer (complex shapes that WebGL can't render)
    const needsVectorForSymbol = symbol && (
      symbol.includes('pin') || 
      symbol.includes('star') || 
      symbol.includes('cross') ||
      symbol.includes('x-mark')
    );
    
    console.log('🔍 Markers Layer - needsVectorForSymbol:', needsVectorForSymbol);
    console.log('🔍 Markers Layer - hasText:', hasText);
    
    // Initialize hasVector with text check, pin shapes, or complex symbols
    let hasVector = hasText || usePin || needsVectorForSymbol;
    
    console.log('🔍 Markers Layer - hasVector (will use vector layer):', hasVector);

    const layers = new LayerGroup({
      layers: hasVector ? (symbol ? [symbolLayer, vectorLayer] : [vectorLayer]) : [symbolLayer],
    });

    const legendProps = new ReplaySubject<MarkersLegendProps>(1);
    let legend: ReactNode = null;
    if (config.showLegend) {
      legend = <ObservablePropsWrapper watch={legendProps} initialSubProps={{}} child={MarkersLegend} />;
    }

    return {
      init: () => layers,
      legend: legend,
      update: (data: PanelData) => {
        if (!data.series?.length) {
          source.clear();
          return; // ignore empty
        }

        for (const frame of data.series) {
          style.dims = getStyleDimension(frame, style, theme);

          // Post updates to the legend component
          if (legend) {
            legendProps.next({
              styleConfig: style,
              size: style.dims?.size,
              layerName: options.name,
              layer: symbolLayer,
            });
          }

          source.update(frame);

          // Track if we find any line strings during feature processing
          let hasLineString = false;
          // Track coordinates to avoid rendering duplicate markers at the same location
          const processedMarkers = new Set<string>();

          // Helper function to create a robust uniqueness key
          const createMarkerKey = (coordinates: number[], markerValues: StyleConfigValues): string => {
            const coord = `${coordinates[0]},${coordinates[1]}`;
            const { color, size, text, rotation } = markerValues;
            return `markerAddressKey|${coord}|${color}|${size}|${text}|${rotation}`;
          };

          source.forEachFeature((feature) => {
            const geometry = feature.getGeometry();
            const isLineString = geometry?.getType() === 'LineString';

            if (isLineString) {
              hasLineString = true;
            }

            const idx: number = feature.get('rowIndex');
            const dims = style.dims;
            const values = { ...style.base };
            values.pinTipColor = config.pinTipColor ?? style.base.pinTipColor;

            if (dims?.color) {
              values.color = dims.color.get(idx);
            }
            if (dims?.size) {
              values.size = dims.size.get(idx);
            }
            if (dims?.text) {
              values.text = dims.text.get(idx);
            }
            if (dims?.rotation) {
              values.rotation = dims.rotation.get(idx);
            }

            // For point geometries, check if we've already processed this marker
            if (geometry?.getType() === 'Point') {
              const coordinates = geometry.getCoordinates();

              // Skip this feature if coordinates are invalid
              if (!coordinates || coordinates.length < 2) {
                return;
              }

              const markerKey = createMarkerKey(coordinates, values);

              // Skip this feature if we've already processed a marker with identical properties
              if (processedMarkers.has(markerKey)) {
                return;
              }
              processedMarkers.add(markerKey);
            }

            // Set style to be used by LineString
            if (isLineString) {
              const lineStringStyle = style.maker(values);
              feature.setStyle(lineStringStyle);
            } else {
              const colorString = tinycolor(theme.visualization.getColorByName(values.color)).toString();
              const colorValues = getRGBValues(colorString);

              const radius = values.size ?? DEFAULT_SIZE;
              const displacement = getDisplacement(values.symbolAlign ?? defaultStyleConfig.symbolAlign, radius);

              // WebGLPointsLayer uses style expressions instead of style functions
              feature.setProperties({ red: colorValues?.r ?? 255 });
              feature.setProperties({ green: colorValues?.g ?? 255 });
              feature.setProperties({ blue: colorValues?.b ?? 255 });
              feature.setProperties({ size: (values.size ?? 1) * 2 }); // TODO unify sizing across all source types
              feature.setProperties({ rotation: ((values.rotation ?? 0) * Math.PI) / 180 });
              feature.setProperties({ opacity: (values.opacity ?? 1) * (colorValues?.a ?? 1) });
              feature.setProperties({ offsetX: displacement[0] });
              feature.setProperties({ offsetY: displacement[1] });
            }

            // Set style to be used by VectorLayer (text, pins, or complex symbols)
            if (usePin || needsVectorForSymbol) {
              console.log('📍 Applying vector style for pin/complex symbol');
              const markerStyle = style.maker(values);
              feature.setStyle(markerStyle);
            } else if (hasText) {
              const textStyle = textMarker(values);
              feature.setStyle(textStyle);
            }
          });

          // Update hasVector state after processing all features
          hasVector = hasText || hasLineString || usePin || needsVectorForSymbol;

          // Update layer visibility based on current hasVector state
          const layersArray = layers.getLayers();
          layersArray.clear();
          if (hasVector) {
            layersArray.extend(symbol ? [symbolLayer, vectorLayer] : [vectorLayer]);
          } else {
            layersArray.extend([symbolLayer]);
          }

          break; // Only the first frame for now!
        }
      },

      // Marker overlay options
      registerOptionsUI: (builder: PanelOptionsEditorBuilder<MapLayerOptions<MarkersConfig>>) => {
        builder
          .addCustomEditor({
            id: 'config.style',
            path: 'config.style',
            name: t('geomap.markers-layer.name-styles', 'Styles'),
            editor: StyleEditor,
            settings: {
              displayRotation: true,
            },
            defaultValue: defaultOptions.style,
          })
          .addRadio({
            path: 'config.markerShape',
            name: t('geomap.markers-layer.marker-shape', 'Marker style'),
            defaultValue: defaultOptions.markerShape,
            settings: {
              options: [
                { label: t('geomap.markers-layer.marker-shape.standard', 'Standard'), value: 'standard' },
                { label: t('geomap.markers-layer.marker-shape.pin', 'Google pin'), value: 'pin' },
              ],
            },
          })
          .addColorPicker({
            path: 'config.pinTipColor',
            name: t('geomap.markers-layer.pin-tip-color', 'Pin tip color'),
            description: t('geomap.markers-layer.pin-tip-color-desc', 'Tip color when using the Google-style marker'),
            defaultValue: defaultOptions.pinTipColor,
            showIf: (cfg) => cfg.config?.markerShape === 'pin',
            settings: [{ enableNamedColors: true }],
          })
          .addBooleanSwitch({
            path: 'config.showLegend',
            name: t('geomap.markers-layer.name-show-legend', 'Show legend'),
            description: t('geomap.markers-layer.description-show-legend', 'Show map legend'),
            defaultValue: defaultOptions.showLegend,
          });
      },
    };
  },

  // fill in the default values
  defaultOptions,
};
