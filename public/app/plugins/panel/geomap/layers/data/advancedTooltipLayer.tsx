import OpenLayersMap from 'ol/Map';
import { Point } from 'ol/geom';
import { VectorImage } from 'ol/layer';
import Vector from 'ol/layer/Vector';
import LayerGroup from 'ol/layer/Group';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import Collection from 'ol/Collection';
import { default as BaseLayer } from 'ol/layer/Base';
import Feature from 'ol/Feature';
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
  FieldType,
  PluginState,
  Field,
  DataFrame,
  getFieldDisplayName,
  formattedValueToString,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import { Select, Button, IconButton, Input } from '@grafana/ui';
import { FrameVectorSource } from 'app/features/geo/utils/frameVectorSource';
import { getLocationMatchers } from 'app/features/geo/utils/location';
import { findField, findFieldIndex } from 'app/features/dimensions/utils';

import {
  AdvancedTooltipConfig as AdvancedTooltipFeatureConfig,
  AdvancedTooltipResolvedDetail,
  AdvancedTooltipImageOptions,
  AdvancedTooltipRow,
} from '../../components/AdvancedTooltip';
import {
  AdvancedTooltipFieldsEditor,
  AdvancedTooltipDetailConfig,
} from '../../editor/AdvancedTooltipFieldsEditor';
import {
  AdvancedTooltipHeaderEditor,
  AdvancedTooltipHeaderConfig,
} from '../../editor/AdvancedTooltipHeaderEditor';
import {
  AdvancedTooltipButtonEditor,
  AdvancedTooltipButtonConfig,
} from '../../editor/AdvancedTooltipButtonEditor';
import {
  ImageConfigEditor,
  ImageConfig as ImageConfigType,
} from '../../editor/ImageConfigEditor';
import { MarkersLegend, MarkersLegendProps } from '../../components/MarkersLegend';
import { ObservablePropsWrapper } from '../../components/ObservablePropsWrapper';
import { StyleEditor } from '../../editor/StyleEditor';
import { getWebGLStyle, textMarker } from '../../style/markers';
import { DEFAULT_SIZE, defaultStyleConfig, StyleConfigValues } from '../../style/types';
import { getDisplacement, getRGBValues, getStyleConfigState, styleUsesText } from '../../style/utils';
import { getStyleDimension } from '../../utils/utils';
import { MarkersConfig } from './markersLayer';
import {
  generateSimplePinSVG,
  generateModernPinSVG,
  generateCircleMarkerSVG,
  generateDefaultCircleMarkerSVG,
  generateSquareMarkerSVG,
  generateDiamondMarkerSVG,
  generateStarMarkerSVG,
  generateTriangleMarkerSVG,
  generateHexagonMarkerSVG,
  generateOctagonMarkerSVG,
  generateHeartMarkerSVG,
  generateCrossMarkerSVG,
  generatePentagonMarkerSVG,
  getColorForValue
} from '../../utils/customMarkers';
import { Icon as OLIcon, Style as OLStyle } from 'ol/style';
import { toLonLat } from 'ol/proj';

export interface AdvancedTooltipConfig extends MarkersConfig {
  imageField?: string; // legacy support
  imageConfig?: ImageConfigType;
  fields?: string[]; // legacy support
  fieldTypes?: FieldType[];
  details?: AdvancedTooltipDetailConfig[];
  imageWidth?: number;
  imageHeight?: number;
  imageFit?: 'cover' | 'contain';
  imageBorderRadius?: number;
  header?: AdvancedTooltipHeaderConfig;
  useCustomPinMarker?: boolean;
  pinMarkerStyle?: 'circle' | 'default_circle' | 'square' | 'diamond' | 'star' | 'triangle' | 'hexagon' | 'octagon' | 'pentagon' | 'heart' | 'cross' | 'pin' | 'modern-pin';
  pinOutlineColor?: string;
  pinColorField?: string;
  pinColorScheme?: 'status' | 'priority' | 'category' | 'default' | 'custom';
  customColorPalette?: string[]; // Custom color palette
  pinSize?: number;
  // Map URL configuration for fallback image
  mapLatField?: string; // Latitude field name for map URL generation
  mapLonField?: string; // Longitude field name for map URL generation
  mapUrlTemplate?: string; // Template for generating map URLs (e.g., "localhost:3300/wrd-form/map?lat={{lat}}&lon={{lon}}")
  enableHoverEffect?: boolean;
  enableRowHighlight?: boolean;
  enableColumnHighlight?: boolean;
  buttonConfig?: AdvancedTooltipButtonConfig;
}

const DEFAULT_IMAGE_WIDTH = 280;
const DEFAULT_IMAGE_HEIGHT = 180;
const DEFAULT_IMAGE_BORDER_RADIUS = 12;
const MAX_DETAIL_ITEMS = 50; // Increased from 6 to support more tooltip content

const defaultOptions: AdvancedTooltipConfig = {
  style: defaultStyleConfig,
  showLegend: true,
  imageField: undefined,
  imageConfig: { mode: 'field' },
  fields: [],
  fieldTypes: undefined,
  details: [],
  imageWidth: DEFAULT_IMAGE_WIDTH,
  imageHeight: DEFAULT_IMAGE_HEIGHT,
  imageFit: 'cover',
  imageBorderRadius: DEFAULT_IMAGE_BORDER_RADIUS,
  header: {
    hideDuplicate: true,
  },
  useCustomPinMarker: false,
  pinMarkerStyle: 'circle',
  pinOutlineColor: '#ffffff',
  pinColorField: undefined,
  pinColorScheme: 'default',
  customColorPalette: undefined,
  pinSize: 24, // Match standard marker size
  mapLatField: '', // Use auto-detection by default
  mapLonField: '', // Use auto-detection by default
  mapUrlTemplate: 'localhost:3300/wrd-form/map?lat={{lat}}&lon={{lon}}',
  enableHoverEffect: true,
  enableRowHighlight: true,
  enableColumnHighlight: false,
};

export const ADVANCED_TOOLTIP_LAYER_ID = 'advanced-tooltip';

export const defaultAdvancedTooltipConfig: MapLayerOptions<AdvancedTooltipConfig> = {
  type: ADVANCED_TOOLTIP_LAYER_ID,
  name: '', // replaced by layer picker
  config: defaultOptions,
  location: {
    mode: FrameGeometrySourceMode.Auto,
  },
  tooltip: true,
};

export const advancedTooltipLayer: MapLayerRegistryItem<AdvancedTooltipConfig> = {
  id: ADVANCED_TOOLTIP_LAYER_ID,
  name: t('geomap.advanced-tooltip.layer-name', 'Advanced Tooltip'),
  description: t(
    'geomap.advanced-tooltip.layer-description',
    'Display markers with image-first tooltips that combine photos and selected fields.'
  ),
  isBaseMap: false,
  showLocation: true,
  hideOpacity: true,
  state: PluginState.beta,

  create: async (map: OpenLayersMap, options: MapLayerOptions<AdvancedTooltipConfig>, eventBus: EventBus, theme: GrafanaTheme2) => {
    const config: AdvancedTooltipConfig = {
      ...defaultOptions,
      ...options?.config,
    };

    const style = await getStyleConfigState(config.style);
    const location = await getLocationMatchers(options.location);
    const source = new FrameVectorSource<Point>(location);
    const symbol = config.style.symbol?.fixed;
    const webGLStyle = await getWebGLStyle(symbol, config.style.opacity);
    const hasText = styleUsesText(config.style);

    // Always use WebGL for positioning, apply custom pins as overlay
    const symbolLayer = new WebGLPointsLayer({ source, style: webGLStyle });
    
    // Create the appropriate vector layer based on initial config
    // Use regular Vector layer for custom markers to ensure proper hit detection
    let vectorLayer: Vector | VectorImage;
    if (config.useCustomPinMarker) {
      vectorLayer = new Vector({ 
        source,
        // Removed updateWhileAnimating and updateWhileInteracting to prevent
        // continuous rendering when idle, which was causing high CPU usage.
        // Hit detection works fine without these flags.
      });
    } else {
      vectorLayer = new VectorImage({ source, declutter: true });
    }
    
    let hasVector = hasText;

    // Determine initial layer configuration
    // When using custom pin markers, we only need the vector layer (pins are applied as feature styles)
    const getInitialLayers = () => {
      if (config.useCustomPinMarker) {
        return [vectorLayer]; // Only vector layer for custom pins - ensures tooltip works
      }
      return hasVector ? (symbol ? [symbolLayer, vectorLayer] : [vectorLayer]) : [symbolLayer];
    };

    const layers = new LayerGroup({
      layers: getInitialLayers(),
    });

    const legendProps = new ReplaySubject<MarkersLegendProps>(1);
    let legend: ReactNode = null;
    if (config.showLegend) {
      legend = <ObservablePropsWrapper watch={legendProps} initialSubProps={{}} child={MarkersLegend} />;
    }

    return {
      init: () => layers,
      legend,
      update: (data: PanelData) => {
        // Helper function to hide layers when no data/features
        const hideLayers = () => {
          source.clear();
          // Completely remove layers from map when there's no data to prevent GPU/CPU usage
          // This is critical for reducing idle CPU consumption - WebGL layers consume CPU even when hidden
          layers.setLayers(new Collection([]));
          symbolLayer.setVisible(false);
          vectorLayer.setVisible(false);
          // Stop legend updates to prevent unnecessary re-renders
          if (legend) {
            legendProps.next({
              styleConfig: undefined,
              size: undefined,
              layerName: options.name,
              layer: undefined,
            });
          }
        };

        if (!data.series?.length) {
          hideLayers();
          return;
        }
        
        const frame = data.series[0];
        
        // Check if frame has any data rows - if not, hide layers
        if (!frame.length || frame.length === 0) {
          hideLayers();
          return;
        }
        
        // Re-add layers when data is available (if they were removed)
        const existingLayers = layers.getLayers().getArray();
        let layersWereRestored = false;
        if (existingLayers.length === 0) {
          // Layers were removed, restore them based on current config
          const hasText = styleUsesText(config.style);
          const symbol = config.style.symbol?.fixed;
          let restoredLayers: BaseLayer[];
          if (config.useCustomPinMarker) {
            restoredLayers = [vectorLayer];
          } else {
            restoredLayers = hasText ? (symbol ? [symbolLayer, vectorLayer] : [vectorLayer]) : [symbolLayer];
          }
          layers.setLayers(new Collection(restoredLayers));
          // Re-enable visibility on individual layers when restoring
          symbolLayer.setVisible(true);
          vectorLayer.setVisible(true);
          layersWereRestored = true;
        }
        layers.setVisible(true);
        
        // Memoization: Skip expensive recalculation if data hasn't actually changed
        // We check multiple indicators to be sure data actually changed:
        // - structureRev: changes when data structure changes
        // - frame.length: number of data rows
        // - request startTime: changes on each new query (e.g., filter change)
        const currentDataRev = data.structureRev ?? 0;
        const lastDataRev = source.get('lastDataRev') as number | undefined;
        const lastFrameLength = source.get('lastFrameLength') as number | undefined;
        const currentRequestTime = data.request?.startTime ?? 0;
        const lastRequestTime = source.get('lastRequestTime') as number | undefined;
        const hasFeatures = source.getFeatures().length > 0;
        
        // Force update if:
        // - layers were just restored (features need to be repopulated)
        // - frame length changed (data rows changed)
        // - no features exist (need to create them)
        // - request time changed (new query executed, e.g., filter changed)
        const frameChanged = lastFrameLength !== frame.length;
        const requestChanged = lastRequestTime !== currentRequestTime;
        const needsUpdate = layersWereRestored || frameChanged || !hasFeatures || requestChanged;
        
        // Only skip if data rev is same AND we don't need an update
        if (currentDataRev === lastDataRev && currentDataRev !== 0 && !needsUpdate) {
          // Data structure hasn't changed and we have features, skip expensive recalculation
          return;
        }
        
        // Store current state for next comparison
        source.set('lastDataRev', currentDataRev);
        source.set('lastFrameLength', frame.length);
        source.set('lastRequestTime', currentRequestTime);
        
        style.dims = getStyleDimension(frame, style, theme);

        if (legend) {
          legendProps.next({
            styleConfig: style,
            size: style.dims?.size,
            layerName: options.name,
            layer: symbolLayer,
          });
        }

        source.update(frame);

        // Check if source has any features after update
        // If no valid location data was found, hide layers and return
        const featuresAfterUpdate = source.getFeatures().length;
        if (featuresAfterUpdate === 0) {
          // No valid markers found - hide layers to prevent empty map display
          hideLayers();
          return;
        }

        // Store frame reference for filter updates
        source.set('frame', frame);
        source.set('allFrames', data.series);

        const tooltipFieldIndexes = getTooltipFieldIndexes(config.fields, frame, data.series);
        const allowedTypes = normalizeFieldTypes(config.fieldTypes);
        const resolvedDetails = resolveDetailEntries(config, frame, data.series);
        const imageOptions = getImageOptions(config);
        
        // Resolve color field for custom pin markers - check all frames
        let pinColorField: Field | undefined;
        if (config.useCustomPinMarker && config.pinColorField) {
          const colorFieldLocation = resolveFieldReference(data.series, frame, {
            fieldNames: [config.pinColorField],
          });
          if (colorFieldLocation) {
            const colorFrame = data.series[colorFieldLocation.frameIndex] ?? frame;
            pinColorField = colorFrame?.fields?.[colorFieldLocation.fieldIndex];
          } else {
            // Fallback to first frame
            pinColorField = findField(frame, config.pinColorField);
          }
        }

        // Extract unique values for index-based color assignment
        // Colors are assigned by first-seen order: 1st value encountered → 1st color, 2nd value → 2nd color, etc.
        // IMPORTANT: Store unique values list in source to persist across filter changes
        // This ensures color mapping remains stable when values are filtered in/out
        // Only rebuild when data structure changes (structureRev), not when filters change
        const uniqueValuesKey = `pinColorUniqueValues_${config.pinColorField}_${config.pinColorScheme}`;
        const lastStructureRev = source.get('lastUniqueValuesStructureRev') as number | undefined;
        let pinColorUniqueValues: string[] | undefined = source.get(uniqueValuesKey) as string[] | undefined;
        
        // Rebuild unique values list only if:
        // 1. We don't have a stored list, OR
        // 2. The data structure has changed (structureRev changed), OR
        // 3. The color field or scheme has changed
        const shouldRebuildUniqueValues = !pinColorUniqueValues || 
                                         lastStructureRev !== currentDataRev ||
                                         !pinColorField;
        
        if (pinColorField && config.pinColorScheme === 'custom' && config.customColorPalette?.length) {
          if (shouldRebuildUniqueValues) {
            const seenValues = new Map<string, number>(); // Map preserves insertion order
            
            // Check all frames to get all possible unique values
            // Note: data.series may be filtered, but we build from what we have
            // The list will stabilize once all values have been seen at least once
            for (const dataFrame of data.series) {
              if (!dataFrame?.fields) continue;
              
              // Try to find the color field in this frame
              const colorFieldInFrame = dataFrame.fields.find(f => f.name === pinColorField.name);
              if (!colorFieldInFrame) continue;
              
              const fieldValues = colorFieldInFrame.values as any;
              const vals = fieldValues?.buffer ?? fieldValues ?? [];
              for (let i = 0; i < vals.length; i++) {
                const v = vals[i];
                if (v !== null && v !== undefined) {
                  const valueStr = String(v).trim();
                  if (!seenValues.has(valueStr)) {
                    seenValues.set(valueStr, seenValues.size); // Store with insertion index
                  }
                }
              }
            }
            
            // Convert to array preserving insertion order (first-seen order)
            pinColorUniqueValues = Array.from(seenValues.keys());
            
            // Merge with existing list to preserve values that might be filtered out
            // This ensures we maintain a complete list even when some values are temporarily hidden
            const existingList = source.get(uniqueValuesKey) as string[] | undefined;
            if (existingList && existingList.length > 0) {
              // Merge: keep existing order, add new values at the end
              const merged = new Map<string, number>();
              existingList.forEach((val, idx) => merged.set(val, idx));
              pinColorUniqueValues.forEach((val) => {
                if (!merged.has(val)) {
                  merged.set(val, merged.size);
                }
              });
              pinColorUniqueValues = Array.from(merged.keys());
            }
            
            // Store the updated list and structure revision
            source.set(uniqueValuesKey, pinColorUniqueValues);
            source.set('lastUniqueValuesStructureRev', currentDataRev);
          }
        } else {
          // Clear stored values if color field or scheme changed
          source.set(uniqueValuesKey, undefined);
        }

        // Reset vector layer when necessary for text markers or custom markers
        hasVector = styleUsesText(config.style);

        const currentLayers = layers.getLayers().getArray();
        const wasUsingCustomMarkers = currentLayers.length === 1 && currentLayers[0] instanceof Vector;
        const isUsingCustomMarkers = config.useCustomPinMarker;
        
        // If switching between custom and standard markers, recreate the vector layer
        if (wasUsingCustomMarkers !== isUsingCustomMarkers) {
          vectorLayer = isUsingCustomMarkers 
            ? new Vector({ 
                source,
                // Removed updateWhileAnimating and updateWhileInteracting to prevent
                // continuous rendering when idle, which was causing high CPU usage.
              }) 
            : new VectorImage({ source, declutter: true });
        }
        
        // Determine which layers should be active
        // Custom pin markers: ONLY vector layer (no WebGL at all to prevent background circles)
        // Standard markers: WebGL symbol layer + optional vector layer for text
        let newLayers: BaseLayer[];
        if (config.useCustomPinMarker) {
          // CRITICAL: Only use vector layer for custom markers
          // This prevents the background circle issue completely
          newLayers = [vectorLayer];
          // Completely hide and disable the symbol layer
          symbolLayer.setVisible(false);
          symbolLayer.setOpacity(0);
        } else {
          const shouldHaveVector = hasVector && symbol;
          newLayers = shouldHaveVector ? [symbolLayer, vectorLayer] : (hasVector ? [vectorLayer] : [symbolLayer]);
          // Restore symbol layer for standard markers
          symbolLayer.setVisible(true);
          symbolLayer.setOpacity(1);
        }
        
        // Update layers if configuration changed
        const layersChanged = currentLayers.length !== newLayers.length || 
                              !currentLayers.every((layer, idx) => layer === newLayers[idx]);
        if (layersChanged) {
          layers.setLayers(new Collection(newLayers));
        }

        // Force style refresh for custom markers when config changes
        // This ensures marker shapes and colors update immediately
        if (config.useCustomPinMarker) {
          source.forEachFeature((feature) => {
            feature.setStyle(undefined); // Clear existing style
          });
        }

        source.forEachFeature((feature) => {
          const geometry = feature.getGeometry();
          if (!geometry) {
            return;
          }

          const idx: number = feature.get('rowIndex');
          const dims = style.dims;
          const values: StyleConfigValues = { ...style.base };

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

          // Set up advanced tooltip configuration BEFORE duplicate check
          // This ensures all features (including overlapping ones) have proper tooltip config
          const headerInfo = resolveHeader(config.header, frame, data.series, idx);
          const detailRows = buildDetailRows(
            frame,
            data.series,
            idx,
            resolvedDetails,
            allowedTypes,
            tooltipFieldIndexes,
            headerInfo
          );

          // Get marker color for tooltip indicator
          let tooltipMarkerColor: string | undefined = values.color;
          if (pinColorField) {
            const colorValue = pinColorField.values[idx];
            if (colorValue !== null && colorValue !== undefined) {
              tooltipMarkerColor = getColorForValue(colorValue, config.pinColorScheme || 'default', config.customColorPalette, pinColorUniqueValues);
            }
          }

          const advancedConfig: AdvancedTooltipFeatureConfig = {
            imageUrl: resolveImageUrl(config.imageConfig, config.imageField, frame, data.series, idx, feature, config),
            fallbackImageUrl: config.imageConfig?.fallbackImageUrl,
            fieldIndexes: tooltipFieldIndexes,
            fieldTypes: allowedTypes,
            detailEntries: resolvedDetails,
            rows: detailRows,
            imageOptions,
            layerLabel: options.name,
            headerText: headerInfo?.text,
            headerIcon: headerInfo?.icon,
            headerIconColor: headerInfo?.iconColor,
            markerColor: tooltipMarkerColor, // Color for the circular marker indicator in tooltip
            pinColorFieldName: pinColorField?.name,
            pinColorScheme: config.pinColorScheme,
            customColorPalette: config.customColorPalette,
            useCustomPinMarker: config.useCustomPinMarker,
            enableHoverEffect: config.enableHoverEffect,
            enableRowHighlight: config.enableRowHighlight,
            enableColumnHighlight: config.enableColumnHighlight,
            buttonConfig: config.buttonConfig,
          };
          feature.set('advancedTooltip', advancedConfig);
          
          // Attach all frames so tooltip can resolve multi-frame field references
          feature.set('allFrames', data.series);

          // REMOVED: Duplicate marker filtering - each marker should render independently
          // Custom pins handle overlapping markers naturally through proper z-index and opacity
          // Standard WebGL markers also handle this correctly without manual deduplication

          if (geometry.getType() === 'LineString') {
            const lineStringStyle = style.maker(values);
            feature.setStyle(lineStringStyle);
          } else {
            // Only apply WebGL properties if NOT using custom markers
            // Custom markers use Vector layer with custom styles, not WebGL
            if (!config.useCustomPinMarker) {
              applyWebGLProperties(feature, values, theme);
            }

            if (geometry.getType() === 'Point') {
              // Handle custom pin markers
              if (config.useCustomPinMarker) {
                // Get color value from the correct frame if needed
                let colorValue: string | number | null | undefined = null;
                if (pinColorField) {
                  colorValue = pinColorField.values[idx];
                }
                
                const innerColor = colorValue !== null && colorValue !== undefined
                  ? getColorForValue(colorValue, config.pinColorScheme || 'default', config.customColorPalette, pinColorUniqueValues)
                  : values.color || theme.colors.primary.main;

                // Generate marker based on selected style
                const markerStyle = config.pinMarkerStyle || 'circle';
                const markerSize = config.pinSize || 24;
                
                let pinSvg: string;
                let anchor: [number, number];
                
                switch (markerStyle) {
                  case 'square':
                    pinSvg = generateSquareMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'diamond':
                    pinSvg = generateDiamondMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'star':
                    pinSvg = generateStarMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'triangle':
                    pinSvg = generateTriangleMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'hexagon':
                    pinSvg = generateHexagonMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'octagon':
                    pinSvg = generateOctagonMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'pentagon':
                    pinSvg = generatePentagonMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'heart':
                    pinSvg = generateHeartMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'cross':
                    pinSvg = generateCrossMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'pin':
                    pinSvg = generateSimplePinSVG({
                      pinColor: config.pinOutlineColor || '#EA4335',
                      circleColor: innerColor,
                      size: markerSize,
                    });
                    anchor = [0.5, 1]; // Bottom center for pin
                    break;
                  case 'modern-pin':
                    pinSvg = generateModernPinSVG({
                      circleColor: innerColor,
                      size: markerSize,
                    });
                    anchor = [0.5, 1]; // Bottom center for pin
                    break;
                  case 'default_circle':
                    pinSvg = generateDefaultCircleMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                  case 'circle':
                  default:
                    pinSvg = generateCircleMarkerSVG({ circleColor: innerColor, size: markerSize });
                    anchor = [0.5, 0.5];
                    break;
                }

                const pinIcon = new OLIcon({
                  src: pinSvg,
                  anchor: anchor as [number, number],
                  anchorXUnits: 'fraction',
                  anchorYUnits: 'fraction',
                  scale: 1,
                });

                const pinStyle = new OLStyle({
                  image: pinIcon,
                });

                // Add text marker if needed
                if (hasVector) {
                  const textStyle = textMarker(values);
                  if (Array.isArray(textStyle)) {
                    feature.setStyle([...textStyle, pinStyle]);
                  } else if (textStyle) {
                    feature.setStyle([textStyle, pinStyle]);
                  } else {
                    feature.setStyle(pinStyle);
                  }
                } else {
                  feature.setStyle(pinStyle);
                }
              } else if (hasVector) {
                // Standard text markers when not using custom pins
                feature.setStyle(textMarker(values));
              }
            }
          }

        });
      },
      registerOptionsUI: (builder) => {
        const imageCategory = [t('geomap.advanced-tooltip.category-image', 'Image display')];
        const headerCategory = [t('geomap.advanced-tooltip.category-header', 'Header content')];
        const contentCategory = [t('geomap.advanced-tooltip.category-content', 'Tooltip content')];
        const markerCategory = [t('geomap.advanced-tooltip.category-marker', 'Marker appearance')];
        const advancedCategory = [t('geomap.advanced-tooltip.category-advanced', 'Advanced')];

        builder
          .addBooleanSwitch({
            path: 'config.useCustomPinMarker',
            name: t('geomap.advanced-tooltip.use-pin-marker', 'Use custom markers'),
            description: t(
              'geomap.advanced-tooltip.use-pin-marker-description',
              'Enable custom colored markers with exact positioning.'
            ),
            category: markerCategory,
            defaultValue: defaultOptions.useCustomPinMarker,
          })
          .addSelect({
            path: 'config.pinMarkerStyle',
            name: t('geomap.advanced-tooltip.pin-marker-style', 'Marker shape'),
            description: t(
              'geomap.advanced-tooltip.pin-marker-style-desc',
              'Choose the shape of the marker. All shapes except pin are centered on exact coordinates.'
            ),
            category: markerCategory,
            settings: {
              options: [
                { label: 'Circle (3D)', value: 'circle', icon: 'circle' },
                { label: 'Circle (Flat)', value: 'default_circle', icon: 'circle' },
                { label: 'Square', value: 'square', icon: 'square-shape' },
                { label: 'Diamond', value: 'diamond', icon: 'gf-interpolation-smooth' },
                { label: 'Triangle', value: 'triangle', icon: 'angle-up' },
                { label: 'Star', value: 'star', icon: 'star' },
                { label: 'Hexagon', value: 'hexagon', icon: 'gf-hexagon' },
                { label: 'Octagon', value: 'octagon', icon: 'gf-octagon' },
                { label: 'Pentagon', value: 'pentagon', icon: 'gf-pentagon' },
                { label: 'Heart', value: 'heart', icon: 'heart' },
                { label: 'Cross', value: 'cross', icon: 'plus' },
                { label: 'Google Pin (3D)', value: 'pin', icon: 'map-marker' },
                { label: 'Modern Pin (Flat)', value: 'modern-pin', icon: 'map-marker-plus' },
              ],
            },
            defaultValue: defaultOptions.pinMarkerStyle,
            showIf: (options) => options.config?.useCustomPinMarker === true,
          })
          .addColorPicker({
            path: 'config.pinOutlineColor',
            name: t('geomap.advanced-tooltip.pin-outline-color', 'Marker border color'),
            description: t('geomap.advanced-tooltip.pin-outline-color-desc', 'The border color around the marker (use white for best visibility)'),
            category: markerCategory,
            defaultValue: defaultOptions.pinOutlineColor,
            showIf: (options) => options.config?.useCustomPinMarker === true && options.config?.pinMarkerStyle === 'pin',
            settings: [{ enableNamedColors: true }],
          })
          .addCustomEditor({
            id: 'config.pinColorField',
            path: 'config.pinColorField',
            name: t('geomap.advanced-tooltip.pin-color-field', 'Color field'),
            description: t(
              'geomap.advanced-tooltip.pin-color-field-description',
              'Select a field to color markers by value. Each unique value will get a distinct color from the chosen palette.'
            ),
            category: markerCategory,
            editor: (props) => {
              const { value, onChange, context } = props;
              const frames = Array.isArray(context.data) 
                ? context.data 
                : (context.data as any)?.series ?? [];
              
              const fieldOptions = frames.flatMap((frame: any, frameIdx: number) => 
                frame.fields?.map((field: any, fieldIdx: number) => ({
                  label: field.name,
                  value: field.name,
                  description: `${field.type} (Frame ${frameIdx})`,
                })) || []
              );

              return (
                <Select
                  options={fieldOptions}
                  value={fieldOptions.find((opt: any) => opt.value === value)}
                  onChange={(selection) => onChange(selection?.value)}
                  isClearable
                  placeholder="Select color field"
                  menuShouldPortal
                />
              );
            },
            showIf: (options) => options.config?.useCustomPinMarker === true,
          })
          .addSelect({
            path: 'config.pinColorScheme',
            name: t('geomap.advanced-tooltip.pin-color-scheme', 'Color palette'),
            description: t(
              'geomap.advanced-tooltip.pin-color-scheme-desc',
              'Choose how field values map to colors. Auto uses a diverse 8-color palette with consistent hashing.'
            ),
            category: markerCategory,
            settings: {
              options: [
                { 
                  label: 'Auto palette (8 colors)', 
                  value: 'default',
                  description: 'Automatically assigns colors from a diverse palette'
                },
                { 
                  label: 'Status colors', 
                  value: 'status',
                  description: 'Green: active/online/running, Red: inactive/offline/error, Orange: warning/pending'
                },
                { 
                  label: 'Priority colors', 
                  value: 'priority',
                  description: 'Red: high/critical/urgent, Orange: medium/normal, Blue: low/minor'
                },
                { 
                  label: 'Category colors', 
                  value: 'category',
                  description: 'A→purple, B→blue, C→green, D→orange, E→red, F→pink, G→teal, H→orange'
                },
                { 
                  label: 'Custom palette', 
                  value: 'custom',
                  description: 'Define your own color palette below'
                },
              ],
            },
            defaultValue: defaultOptions.pinColorScheme,
            showIf: (options) => options.config?.useCustomPinMarker === true && !!options.config?.pinColorField,
          })
          .addCustomEditor({
            id: 'config.customColorPalette',
            path: 'config.customColorPalette',
            name: t('geomap.advanced-tooltip.custom-palette', 'Custom colors'),
            description: t(
              'geomap.advanced-tooltip.custom-palette-desc',
              'Define colors for each unique value in your color field. Colors are assigned alphabetically.'
            ),
            category: markerCategory,
            editor: (props) => {
              const { value, onChange, context } = props;
              const colors = value || [];
              
              // Extract unique values from the selected color field
              const colorFieldName = (context.options as any)?.config?.pinColorField;
              const frames = Array.isArray(context.data)
                ? context.data
                : (context.data as any)?.series ?? [];
              
              // Get unique values from the color field
              const uniqueValues: string[] = [];
              if (colorFieldName && frames.length > 0) {
                const seenValues = new Set<string>();
                for (const frame of frames) {
                  const field = frame.fields?.find((f: any) => f.name === colorFieldName);
                  if (field?.values) {
                    const vals = field.values.buffer ?? field.values;
                    for (let i = 0; i < Math.min(vals.length, 1000); i++) {
                      const v = vals[i];
                      if (v !== null && v !== undefined && !seenValues.has(String(v))) {
                        seenValues.add(String(v));
                        uniqueValues.push(String(v));
                      }
                    }
                  }
                }
                // Sort alphabetically for consistent display (matches color assignment order)
                uniqueValues.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
              }
              
              const addColor = () => {
                onChange([...colors, '#3b82f6']);
              };
              
              const removeColor = (index: number) => {
                const newColors = colors.filter((_: string, i: number) => i !== index);
                onChange(newColors.length > 0 ? newColors : undefined);
              };
              
              const updateColor = (index: number, color: string | any) => {
                const newColors = [...colors];
                newColors[index] = typeof color === 'string' ? color : color.toString();
                onChange(newColors);
              };

              // Auto-generate colors for all unique values
              const autoGenerateColors = () => {
                const defaultColors = [
                  '#0891B2', '#0EA5E9', '#F59E0B', '#10B981', '#8B5CF6',
                  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
                  '#A855F7', '#22C55E', '#EAB308', '#DC2626', '#6366F1'
                ];
                const newColors = uniqueValues.map((_, i) => defaultColors[i % defaultColors.length]);
                onChange(newColors);
              };
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  {/* Show unique values from the field */}
                  {uniqueValues.length > 0 && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      marginBottom: '4px'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: '#60A5FA',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        📊 Unique values in "{colorFieldName}" ({uniqueValues.length})
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '6px',
                        maxHeight: '100px',
                        overflowY: 'auto'
                      }}>
                        {uniqueValues.slice(0, 50).map((val, i) => (
                          <span key={i} style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            backgroundColor: colors[i] || 'rgba(100, 100, 100, 0.5)',
                            color: '#fff',
                            borderRadius: '12px',
                            fontWeight: 500,
                            textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                          }}>
                            {val}
                          </span>
                        ))}
                        {uniqueValues.length > 50 && (
                          <span style={{ fontSize: '11px', color: '#888', padding: '4px 8px' }}>
                            +{uniqueValues.length - 50} more...
                          </span>
                        )}
                      </div>
                      {colors.length === 0 && uniqueValues.length > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon="plus-circle"
                          onClick={autoGenerateColors}
                          style={{ marginTop: '12px' }}
                        >
                          Auto-generate {Math.min(uniqueValues.length, 15)} colors
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Color list */}
                  {colors.map((color: string, index: number) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center', 
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid rgba(204, 204, 220, 0.15)',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        flex: 1
                      }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: color,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderRadius: '6px',
                          flexShrink: 0,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                        <Input
                          value={color}
                          onChange={(e) => updateColor(index, e.currentTarget.value)}
                          placeholder="#3b82f6"
                          style={{ flex: 1 }}
                        />
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#94A3B8',
                          minWidth: '90px',
                          textAlign: 'right',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: uniqueValues[index] ? 500 : 400
                        }}>
                          {uniqueValues[index] ? `"${uniqueValues[index]}"` : `Color ${index + 1}`}
                        </span>
                      </div>
                      <IconButton
                        name="trash-alt"
                        onClick={() => removeColor(index)}
                        tooltip="Remove color"
                        variant="secondary"
                      />
                    </div>
                  ))}
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="plus"
                    onClick={addColor}
                    fullWidth
                  >
                    Add Color
                  </Button>
                  
                  {colors.length === 0 && uniqueValues.length === 0 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#888', 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: '16px'
                    }}>
                      No colors defined. Click "Add Color" to create your custom palette.
                    </div>
                  )}
                  
                  <div style={{
                    fontSize: '11px',
                    color: '#64748B',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.15)',
                    borderRadius: '6px',
                    marginTop: '4px',
                    lineHeight: 1.5
                  }}>
                    💡 Colors are assigned alphabetically: 1st value → Color 1, 2nd value → Color 2, etc.
                  </div>
                </div>
              );
            },
            showIf: (options) => options.config?.useCustomPinMarker === true && options.config?.pinColorScheme === 'custom',
          })
          .addSliderInput({
            path: 'config.pinSize',
            name: t('geomap.advanced-tooltip.pin-size', 'Marker size'),
            description: t('geomap.advanced-tooltip.pin-size-desc', 'Size of the marker in pixels'),
            category: markerCategory,
            settings: {
              min: 8,
              max: 48,
              step: 2,
            },
            defaultValue: defaultOptions.pinSize,
            showIf: (options) => options.config?.useCustomPinMarker === true,
          })
          .addCustomEditor({
            id: 'config.style',
            path: 'config.style',
            name: t('geomap.advanced-tooltip.style', 'Marker style'),
            description: t(
              'geomap.advanced-tooltip.style-desc',
              'Configure marker appearance including color, size, and symbol. Use the Color field selector for value-based coloring.'
            ),
            editor: StyleEditor,
            category: markerCategory,
            defaultValue: defaultOptions.style,
            showIf: (options) => options.config?.useCustomPinMarker !== true,
          })
          .addBooleanSwitch({
            path: 'config.showLegend',
            name: t('geomap.advanced-tooltip.legend', 'Show legend'),
            defaultValue: defaultOptions.showLegend ?? true,
          })
          .addCustomEditor({
            id: 'config.header',
            path: 'config.header',
            name: t('geomap.advanced-tooltip.header.title', 'Header content'),
            description: t(
              'geomap.advanced-tooltip.header.description',
              'Choose which field should appear as the card headline.'
            ),
            category: headerCategory,
            editor: AdvancedTooltipHeaderEditor,
            defaultValue: defaultOptions.header,
          })
          .addCustomEditor({
            id: 'config.imageConfig',
            path: 'config.imageConfig',
            name: t('geomap.advanced-tooltip.image-config', 'Image configuration'),
            description: t(
              'geomap.advanced-tooltip.image-config-desc',
              'Configure how images are loaded: from a field, URL template, or static URL'
            ),
            category: imageCategory,
            editor: ImageConfigEditor,
            defaultValue: { mode: 'field' },
          })
          .addNumberInput({
            path: 'config.imageWidth',
            name: t('geomap.advanced-tooltip.image-width', 'Image width (px)'),
            category: imageCategory,
            settings: {
              min: 80,
              max: 800,
              integer: true,
            },
            defaultValue: defaultOptions.imageWidth,
          })
          .addNumberInput({
            path: 'config.imageHeight',
            name: t('geomap.advanced-tooltip.image-height', 'Image height (px)'),
            category: imageCategory,
            settings: {
              min: 60,
              max: 600,
              integer: true,
            },
            defaultValue: defaultOptions.imageHeight,
          })
          .addRadio({
            path: 'config.imageFit',
            name: t('geomap.advanced-tooltip.image-fit', 'Image fit'),
            category: imageCategory,
            settings: {
              options: [
                { label: t('geomap.advanced-tooltip.image-fit.cover', 'Cover'), value: 'cover' },
                { label: t('geomap.advanced-tooltip.image-fit.contain', 'Contain'), value: 'contain' },
              ],
            },
            defaultValue: defaultOptions.imageFit,
          })
          .addSliderInput({
            path: 'config.imageBorderRadius',
            name: t('geomap.advanced-tooltip.image-radius', 'Image corner radius'),
            category: imageCategory,
            settings: {
              min: 0,
              max: 40,
            },
            defaultValue: defaultOptions.imageBorderRadius,
          })
          .addMultiSelect({
            path: 'config.fieldTypes',
            name: t('geomap.advanced-tooltip.field-types', 'Allowed field types'),
            description: t(
              'geomap.advanced-tooltip.field-types-description',
              'Only show values that match the selected data types. Leave empty to include all fields.'
            ),
            category: contentCategory,
            settings: {
              options: [
                { label: t('geomap.advanced-tooltip.field-type.string', 'String'), value: [FieldType.string] },
                { label: t('geomap.advanced-tooltip.field-type.number', 'Number'), value: [FieldType.number] },
                { label: t('geomap.advanced-tooltip.field-type.time', 'Time'), value: [FieldType.time] },
                { label: t('geomap.advanced-tooltip.field-type.boolean', 'Boolean'), value: [FieldType.boolean] },
              ],
            },
            defaultValue: defaultOptions.fieldTypes,
          })
          .addCustomEditor({
            id: 'config.details',
            path: 'config.details',
            name: t('geomap.advanced-tooltip.selected-fields', 'Tooltip content'),
            description: t(
              'geomap.advanced-tooltip.selected-fields-description',
              'Pick which fields or custom values should be displayed under the image.'
            ),
            category: contentCategory,
            editor: AdvancedTooltipFieldsEditor,
            defaultValue: defaultOptions.details,
          })
          .addCustomEditor({
            id: 'config.buttonConfig',
            path: 'config.buttonConfig',
            name: t('geomap.advanced-tooltip.button-config', 'Variable update button'),
            description: t(
              'geomap.advanced-tooltip.button-config-description',
              'Add a button to update dashboard variables from table field values.'
            ),
            category: contentCategory,
            editor: AdvancedTooltipButtonEditor,
            defaultValue: { enabled: false, buttonText: 'Update Variables', buttonIcon: 'sync', variableMappings: [] },
          })
          .addBooleanSwitch({
            path: 'config.enableHoverEffect',
            name: t('geomap.advanced-tooltip.enable-hover', 'Enable hover'),
            description: t(
              'geomap.advanced-tooltip.enable-hover-description',
              'Allow hover interactions inside the tooltip card.'
            ),
            category: advancedCategory,
            defaultValue: defaultOptions.enableHoverEffect,
          })
          .addBooleanSwitch({
            path: 'config.enableRowHighlight',
            name: t('geomap.advanced-tooltip.row-highlight', 'Row highlight'),
            description: t(
              'geomap.advanced-tooltip.row-highlight-description',
              'Highlight the entire tooltip row on hover.'
            ),
            category: advancedCategory,
            defaultValue: defaultOptions.enableRowHighlight,
          })
          .addBooleanSwitch({
            path: 'config.enableColumnHighlight',
            name: t('geomap.advanced-tooltip.column-highlight', 'Column highlight'),
            description: t(
              'geomap.advanced-tooltip.column-highlight-description',
              'Highlight the value column on hover.'
            ),
            category: advancedCategory,
            defaultValue: defaultOptions.enableColumnHighlight,
          })
          .addTextInput({
            path: 'config.mapLatField',
            name: t('geomap.advanced-tooltip.map-lat-field', 'Latitude field for map URL'),
            description: t(
              'geomap.advanced-tooltip.map-lat-field-description',
              'Field name containing latitude values for generating map URLs. Leave empty to auto-detect common names (latitude, lat, lattitude).'
            ),
            category: imageCategory,
            defaultValue: defaultOptions.mapLatField,
          })
          .addTextInput({
            path: 'config.mapLonField',
            name: t('geomap.advanced-tooltip.map-lon-field', 'Longitude field for map URL'),
            description: t(
              'geomap.advanced-tooltip.map-lon-field-description',
              'Field name containing longitude values for generating map URLs. Leave empty to auto-detect common names (longitude, lon, lng).'
            ),
            category: imageCategory,
            defaultValue: defaultOptions.mapLonField,
          })
          .addTextInput({
            path: 'config.mapUrlTemplate',
            name: t('geomap.advanced-tooltip.map-url-template', 'Map URL template'),
            description: t(
              'geomap.advanced-tooltip.map-url-template-description',
              'Template for generating map URLs when no image is available. Use {{lat}} and {{lon}} placeholders. Example: localhost:3300/wrd-form/map?lat={{lat}}&lon={{lon}}'
            ),
            category: imageCategory,
            defaultValue: defaultOptions.mapUrlTemplate,
          });
      },
    };
  },
  defaultOptions,
};

function getTooltipFieldIndexes(names: string[] | undefined, frame: PanelData['series'][number], frames: PanelData['series']): number[] | undefined {
  if (!names?.length) {
    return undefined;
  }

  const indexes = names
    .map((name) => findFieldIndex(name, frame, frames))
    .filter((idx): idx is number => idx !== undefined);

  return indexes.length ? indexes : undefined;
}

function normalizeFieldTypes(fieldTypes: FieldType[] | undefined): FieldType[] | undefined {
  if (!fieldTypes || !fieldTypes.length) {
    return undefined;
  }
  const unique = Array.from(new Set(fieldTypes));
  return unique.length ? unique : undefined;
}

function resolveDetailEntries(
  config: AdvancedTooltipConfig,
  frame: DataFrame,
  frames: DataFrame[]
): AdvancedTooltipResolvedDetail[] | undefined {
  const detailsSource: AdvancedTooltipDetailConfig[] =
    (config.details && config.details.length
      ? config.details
      : config.fields?.map((field) => ({ id: field, type: 'field', field })) ?? []) ?? [];

  if (!detailsSource.length) {
    return undefined;
  }

  const resolved: AdvancedTooltipResolvedDetail[] = [];
  const sliced = detailsSource.slice(0, MAX_DETAIL_ITEMS);
  for (const detail of sliced) {
    if (detail.type === 'custom') {
      if (detail.value && detail.value.trim().length) {
        resolved.push({
          type: 'custom',
          label: detail.label ?? '',
          value: detail.value,
          showLabel: detail.showLabel !== false,
          icon: detail.icon,
          iconColor: detail.iconColor,
          labelColor: detail.labelColor,
          isLink: detail.isLink,
          linkDisplayText: detail.linkDisplayText,
          linkTemplate: detail.linkTemplate,
        });
      }
      continue;
    }

    const resolvedLocation = resolveFieldReference(frames, frame, {
      fieldKey: detail.fieldKey,
      frameRefId: detail.frameRefId,
      fieldNames: [detail.fieldName, detail.field],
    });

    if (!resolvedLocation) {
      continue;
    }

    const sourceFrame = frames[resolvedLocation.frameIndex] ?? frame;
    const sourceField = sourceFrame?.fields?.[resolvedLocation.fieldIndex];
    if (!sourceField) {
      continue;
    }

    let displayLabel = detail.label ?? detail.field;
    if (!displayLabel) {
      displayLabel = getFieldDisplayName(sourceField, sourceFrame, frames);
    }

    resolved.push({
      type: 'field',
      label: displayLabel,
      fieldIndex: resolvedLocation.fieldIndex,
      frameIndex: resolvedLocation.frameIndex,
      showLabel: detail.showLabel !== false,
      icon: detail.icon,
      iconColor: detail.iconColor,
      labelColor: detail.labelColor,
      isLink: detail.isLink,
      linkDisplayText: detail.linkDisplayText,
      linkTemplate: detail.linkTemplate,
    });
  }

  return resolved.length ? resolved : undefined;
}

function getImageOptions(config: AdvancedTooltipConfig): AdvancedTooltipImageOptions {
  return {
    width: config.imageWidth ?? DEFAULT_IMAGE_WIDTH,
    height: config.imageHeight ?? DEFAULT_IMAGE_HEIGHT,
    fit: config.imageFit ?? 'cover',
    borderRadius: config.imageBorderRadius ?? DEFAULT_IMAGE_BORDER_RADIUS,
  };
}

interface ResolvedHeaderInfo {
  text?: string;
  icon?: string;
  iconColor?: string;
  fieldIndex?: number;
  hideDuplicate?: boolean;
  frameIndex?: number;
}

function resolveHeader(
  header: AdvancedTooltipHeaderConfig | undefined,
  frame: DataFrame,
  frames: DataFrame[],
  rowIndex: number
): ResolvedHeaderInfo | undefined {
  if (!header) {
    return undefined;
  }

  let text = header.customText?.trim();
  let fieldIndex: number | undefined = undefined;
  let frameIndex: number | undefined = undefined;
  const resolvedLocation = resolveFieldReference(frames, frame, {
    fieldKey: header.fieldKey,
    frameRefId: header.frameRefId,
    fieldNames: [header.fieldName],
  });

  if (resolvedLocation) {
    frameIndex = resolvedLocation.frameIndex;
    const sourceFrame = frames[resolvedLocation.frameIndex] ?? frame;
    const field = sourceFrame?.fields?.[resolvedLocation.fieldIndex];
    if (field) {
      const value = getFieldValue(field, rowIndex);
      if (value && value.trim().length) {
        text = value;
      }
      fieldIndex = resolvedLocation.fieldIndex;
    }
  }

  if (!text || !text.trim().length) {
    return undefined;
  }

  return {
    text,
    icon: header.icon,
    iconColor: header.iconColor,
    fieldIndex,
    hideDuplicate: header.hideDuplicate !== false,
    frameIndex,
  };
}

function buildDetailRows(
  frame: DataFrame,
  frames: DataFrame[],
  rowIndex: number,
  details: AdvancedTooltipResolvedDetail[] | undefined,
  allowedTypes: FieldType[] | undefined,
  fallbackIndexes: number[] | undefined,
  headerInfo?: ResolvedHeaderInfo
): AdvancedTooltipRow[] {
  const rows: AdvancedTooltipRow[] = [];

  const getSourceFrame = (detail?: AdvancedTooltipResolvedDetail): DataFrame => {
    if (detail?.frameIndex != null && frames[detail.frameIndex]) {
      return frames[detail.frameIndex]!;
    }
    return frame;
  };

  const pushCustomRow = (detail: AdvancedTooltipResolvedDetail) => {
    if (!detail.value || !detail.value.trim().length) {
      return;
    }
    const sourceFrame = getSourceFrame(detail);
    const resolvedValue = applyLinkTemplate(detail.linkTemplate, detail.value.trim(), sourceFrame, rowIndex);
    rows.push({
      label: detail.label ?? '',
      value: resolvedValue ?? '',
      showLabel: detail.showLabel !== false,
      icon: detail.icon,
      iconColor: detail.iconColor,
      labelColor: detail.labelColor,
      isLink: detail.isLink,
      linkDisplayText: detail.linkDisplayText,
      linkTemplate: detail.linkTemplate,
    });
  };

  const pushFieldRow = (
    field: Field | undefined,
    sourceFrame: DataFrame,
    detail?: AdvancedTooltipResolvedDetail
  ) => {
    if (!shouldIncludeField(field, allowedTypes)) {
      return;
    }
    
    const text = getFieldValue(field, rowIndex);
    
    if (text == null || text === '') {
      return;
    }
    const resolvedValue = applyLinkTemplate(detail?.linkTemplate, text, sourceFrame, rowIndex);
    const label = detail?.label ?? getFieldDisplayName(field, sourceFrame, frames);
    const finalValue = resolvedValue ?? text;
    
    rows.push({
      label,
      value: finalValue,
      showLabel: detail ? detail.showLabel !== false : true,
      icon: detail?.icon,
      iconColor: detail?.iconColor,
      labelColor: detail?.labelColor,
      isLink: detail?.isLink,
      linkDisplayText: detail?.linkDisplayText,
      linkTemplate: detail?.linkTemplate,
    });
  };

  if (details?.length) {
    for (const detail of details) {
      if (rows.length >= MAX_DETAIL_ITEMS) {
        break;
      }

      if (detail.type === 'custom') {
        pushCustomRow(detail);
        continue;
      }

      const sourceFrame = getSourceFrame(detail);
      const field = sourceFrame.fields?.[detail.fieldIndex ?? -1];
      if (
        headerInfo?.hideDuplicate !== false &&
        detail.fieldIndex === headerInfo?.fieldIndex &&
        (detail.frameIndex ?? 0) === (headerInfo?.frameIndex ?? 0)
      ) {
        continue;
      }
      pushFieldRow(field, sourceFrame, detail);
    }
  } else {
    const indexes =
      fallbackIndexes && fallbackIndexes.length ? fallbackIndexes : frame.fields.map((_, idx) => idx);
    for (const idx of indexes) {
      if (rows.length >= MAX_DETAIL_ITEMS) {
        break;
      }
      if (headerInfo?.hideDuplicate !== false && headerInfo?.frameIndex === 0 && headerInfo?.fieldIndex === idx) {
        continue;
      }
      const field = frame.fields[idx];
      pushFieldRow(field, frame);
    }
  }

  return rows.slice(0, MAX_DETAIL_ITEMS);
}

function applyLinkTemplate(
  template: string | undefined,
  baseValue: string | undefined,
  frame: DataFrame,
  rowIndex: number
): string | undefined {
  if (!template || !template.trim().length) {
    return baseValue;
  }

  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, rawKey) => {
    const key = rawKey.trim();
    if (!key) {
      return '';
    }
    if (key === 'value') {
      return baseValue ?? '';
    }

    const field =
      frame.fields.find((f) => f.name === key) ??
      frame.fields.find((f) => getFieldDisplayName(f, frame) === key);
    if (field) {
      const replacement = getFieldValue(field, rowIndex);
      return replacement ?? '';
    }

    return '';
  });
}

function parseFieldKey(fieldKey?: string): { frameIndex: number; fieldIndex: number } | undefined {
  if (!fieldKey) {
    return undefined;
  }

  const parts = fieldKey.split(':');
  if (parts.length !== 2) {
    return undefined;
  }

  const frameIndex = Number(parts[0]);
  const fieldIndex = Number(parts[1]);
  if (Number.isNaN(frameIndex) || Number.isNaN(fieldIndex)) {
    return undefined;
  }

  return { frameIndex, fieldIndex };
}

interface FieldReferenceContext {
  fieldKey?: string;
  frameRefId?: string;
  fieldNames?: Array<string | undefined>;
}

function findFrameIndexByRefId(frames: DataFrame[], refId?: string): number | undefined {
  if (!refId?.length) {
    return undefined;
  }

  const index = frames.findIndex((candidate) => candidate?.refId === refId);
  return index >= 0 ? index : undefined;
}

function resolveFieldReference(
  frames: DataFrame[],
  defaultFrame: DataFrame,
  reference: FieldReferenceContext
): { frameIndex: number; fieldIndex: number } | undefined {
  const parsedKey = parseFieldKey(reference.fieldKey);
  const refIndex = findFrameIndexByRefId(frames, reference.frameRefId);

  const fieldNames = (reference.fieldNames ?? []).filter(
    (name): name is string => typeof name === 'string' && name.trim().length > 0
  );

  // Priority 1: Try by field name first (most stable)
  if (fieldNames.length > 0) {
    const candidateFrames: number[] = [];
    
    // Try specific frame first if we have a refIndex
    if (refIndex !== undefined) {
      candidateFrames.push(refIndex);
    }
    
    // Then try all frames
    for (let i = 0; i < frames.length; i++) {
      if (!candidateFrames.includes(i)) {
        candidateFrames.push(i);
      }
    }
    
    // Search by field name
    for (const frameIdx of candidateFrames) {
      const sourceFrame = frames[frameIdx];
      if (!sourceFrame?.fields?.length) {
        continue;
      }

      for (const name of fieldNames) {
        const exactIdx = sourceFrame.fields.findIndex((field) => field?.name === name);
        if (exactIdx !== -1) {
          return { frameIndex: frameIdx, fieldIndex: exactIdx };
        }

        const displayIdx = findFieldIndex(name, sourceFrame, frames);
        if (displayIdx !== undefined) {
          return { frameIndex: frameIdx, fieldIndex: displayIdx };
        }
      }
    }
  }

  // Priority 2: Fall back to fieldKey (index-based) if field name didn't work
  if (parsedKey) {
    const sourceFrame = frames[parsedKey.frameIndex];
    if (sourceFrame?.fields?.[parsedKey.fieldIndex]) {
      return { frameIndex: parsedKey.frameIndex, fieldIndex: parsedKey.fieldIndex };
    }
  }

  return undefined;
}

function shouldIncludeField(field: Field | undefined, allowedTypes?: FieldType[]): field is Field {
  if (!field) {
    return false;
  }
  if (field.config?.custom?.hideFrom?.tooltip) {
    return false;
  }
  if (allowedTypes && allowedTypes.length && !allowedTypes.includes(field.type)) {
    return false;
  }
  return true;
}

function getFieldValue(field: Field, rowIndex: number): string | undefined {
  if (!field || !field.values) {
    return undefined;
  }
  
  if (rowIndex < 0 || rowIndex >= field.values.length) {
    return undefined;
  }
  
  const raw = field.values[rowIndex];
  
  if (raw === undefined || raw === null) {
    return undefined;
  }
  
  // Try using field's display function first
  if (field.display) {
    try {
      const displayValue = formattedValueToString(field.display(raw));
      if (displayValue && displayValue !== '[object Object]') {
        return displayValue;
      }
    } catch (err) {
      // Continue to fallback
    }
  }
  
  // Handle objects
  if (typeof raw === 'object') {
    // Check if it's an array
    if (Array.isArray(raw)) {
      return raw.join(', ');
    }
    
    // Check if it has a toString that's not the default Object.toString
    if (raw.toString && raw.toString !== Object.prototype.toString) {
      const str = raw.toString();
      if (str && str !== '[object Object]') {
        return str;
      }
    }
    
    // Try to extract meaningful value from object
    if ('value' in raw && raw.value !== undefined) {
      return String(raw.value);
    }
    if ('text' in raw && raw.text !== undefined) {
      return String(raw.text);
    }
    if ('name' in raw && raw.name !== undefined) {
      return String(raw.name);
    }
    
    // Last resort: JSON stringify
    try {
      return JSON.stringify(raw);
    } catch (err) {
      return '[object Object]';
    }
  }
  
  return `${raw}`;
}

function getImageForRow(field: Field | undefined, row: number): string | undefined {
  if (!field) {
    return undefined;
  }

  const value = field.values[row];
  if (value == null) {
    return undefined;
  }

  return String(value);
}

/**
 * Helper function to extract latitude and longitude from feature geometry or frame data
 */
function getLatLonFromFeatureOrFrame(
  feature: Feature,
  frame: DataFrame,
  frames: DataFrame[],
  rowIndex: number,
  config?: AdvancedTooltipConfig
): { lat: number; lon: number } | null {
  // First, try to get from feature geometry
  const geometry = feature.getGeometry();
  if (geometry) {
    const geometryType = geometry.getType();
    let coords: number[] | undefined;
    
    // Handle Point geometry (most common case)
    if (geometryType === 'Point') {
      const pointGeometry = geometry as Point;
      coords = pointGeometry.getCoordinates();
    } else if (geometryType === 'LineString') {
      // For LineString, get the first coordinate
      const lineString = geometry as any;
      if (lineString.getCoordinates && lineString.getCoordinates().length > 0) {
        coords = lineString.getCoordinates()[0];
      }
    } else if (geometryType === 'Polygon') {
      // For Polygon, get the first coordinate of the exterior ring
      const polygon = geometry as any;
      if (polygon.getCoordinates && polygon.getCoordinates().length > 0) {
        const rings = polygon.getCoordinates();
        if (rings[0] && rings[0].length > 0) {
          coords = rings[0][0];
        }
      }
    }
    
    if (coords && coords.length >= 2) {
      // Convert from map projection to lon/lat
      const [lon, lat] = toLonLat(coords);
      if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
  }

  // Fallback: try to find latitude and longitude fields in frames
  // Use configurable field names if provided, otherwise use common defaults
  const latFieldNames = config?.mapLatField
    ? [config.mapLatField]
    : ['Latitude', 'latitude', 'lat', 'lattitude'];
  const lonFieldNames = config?.mapLonField
    ? [config.mapLonField]
    : ['Longitude', 'longitude', 'lon', 'lng'];

  for (const searchFrame of frames) {
    const latField = searchFrame.fields.find(f => {
      const fieldName = f.name;
      return latFieldNames.some(name => fieldName === name);
    });
    const lonField = searchFrame.fields.find(f => {
      const fieldName = f.name;
      return lonFieldNames.some(name => fieldName === name);
    });

    if (latField && lonField &&
        latField.values[rowIndex] != null &&
        lonField.values[rowIndex] != null) {
      const lat = Number(latField.values[rowIndex]);
      const lon = Number(lonField.values[rowIndex]);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
  }

  return null;
}

/**
 * Generate fallback URL when no image is available
 */
function generateFallbackImageUrl(
  feature: Feature,
  frame: DataFrame,
  frames: DataFrame[],
  rowIndex: number,
  config?: AdvancedTooltipConfig
): string | undefined {
  const coords = getLatLonFromFeatureOrFrame(feature, frame, frames, rowIndex, config);
  if (coords) {
    const template = config?.mapUrlTemplate || 'localhost:3300/wrd-form/map?lat={{lat}}&lon={{lon}}';
    let url = template.replace(/\{\{lat\}\}/g, coords.lat.toString()).replace(/\{\{lon\}\}/g, coords.lon.toString());
    
    // Ensure URL has leading slash for nginx proxying if it doesn't start with http/https/localhost
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('localhost:') && !url.startsWith('/')) {
      url = '/' + url;
    }
    
    return url;
  }
  return undefined;
}

function resolveImageUrl(
  imageConfig: ImageConfigType | undefined,
  legacyImageField: string | undefined,
  frame: DataFrame,
  frames: DataFrame[],
  rowIndex: number,
  feature?: Feature,
  fullConfig?: AdvancedTooltipConfig
): string | undefined {
  let imageUrl: string | undefined;

  // Handle new image config
  if (imageConfig) {
    if (imageConfig.mode === 'static') {
      imageUrl = imageConfig.staticUrl;
    } else if (imageConfig.mode === 'field' && imageConfig.fieldName) {
      const field = findField(frame, imageConfig.fieldName);
      imageUrl = getImageForRow(field, rowIndex);
    } else if (imageConfig.mode === 'template' && imageConfig.urlTemplate) {
      // Replace {{fieldName}} with actual field values
      let url = imageConfig.urlTemplate;
      const regex = /\{\{\s*([^}]+)\s*\}\}/g;
      
      url = url.replace(regex, (match, fieldName) => {
        const trimmedFieldName = fieldName.trim();
        
        // Search for field in all frames
        for (const searchFrame of frames) {
          const field = searchFrame.fields.find(f => f.name === trimmedFieldName);
          if (field && field.values[rowIndex] != null) {
            return String(field.values[rowIndex]);
          }
        }
        
        // If not found, return empty string
        return '';
      });
      
      imageUrl = url;
    }
  } else if (legacyImageField) {
    // Legacy support: use imageField
    const field = findField(frame, legacyImageField);
    imageUrl = getImageForRow(field, rowIndex);
  }

  // If no image URL was found, generate fallback URL using lat/lon
  if (!imageUrl && feature) {
    imageUrl = generateFallbackImageUrl(feature, frame, frames, rowIndex, fullConfig);
  }

  return imageUrl;
}

function resolveMarkerColor(theme: GrafanaTheme2, color?: string): string {
  const fallback = tinycolor(theme.colors.primary.main).toString();
  if (!color) {
    return fallback;
  }

  const candidate = color.trim();
  if (!candidate.length) {
    return fallback;
  }

  if (candidate.startsWith('#') || candidate.startsWith('rgb') || candidate.startsWith('hsl')) {
    return tinycolor(candidate).toString();
  }

  const themed = theme.visualization.getColorByName(candidate);
  if (themed) {
    return tinycolor(themed).toString();
  }

  return tinycolor(candidate).toString();
}

function applyWebGLProperties(feature: Feature, values: StyleConfigValues, theme: GrafanaTheme2) {
  const baseColorCandidate = values.color ?? defaultStyleConfig.color.fixed;
  const colorString = resolveMarkerColor(theme, baseColorCandidate);

  let colorValues = getRGBValues(colorString);
  if (!colorValues) {
    const fallbackColor = resolveMarkerColor(theme, defaultStyleConfig.color.fixed);
    colorValues = getRGBValues(fallbackColor) ?? { r: 255, g: 255, b: 255, a: 1 };
  }

  const radius = values.size ?? DEFAULT_SIZE;
  const displacement = getDisplacement(values.symbolAlign ?? defaultStyleConfig.symbolAlign, radius);
  const alpha = colorValues.a ?? 1;

  feature.setProperties({ red: colorValues.r });
  feature.setProperties({ green: colorValues.g });
  feature.setProperties({ blue: colorValues.b });
  feature.setProperties({ size: radius * 2 });
  feature.setProperties({ rotation: ((values.rotation ?? 0) * Math.PI) / 180 });
  feature.setProperties({ opacity: (values.opacity ?? 1) * alpha });
  feature.setProperties({ offsetX: displacement[0] });
  feature.setProperties({ offsetY: displacement[1] });
}
