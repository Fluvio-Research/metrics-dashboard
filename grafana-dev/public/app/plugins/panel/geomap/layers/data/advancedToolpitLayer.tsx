import OpenLayersMap from 'ol/Map';
import { Point } from 'ol/geom';
import { VectorImage } from 'ol/layer';
import LayerGroup from 'ol/layer/Group';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import Collection from 'ol/Collection';
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
import { FrameVectorSource } from 'app/features/geo/utils/frameVectorSource';
import { getLocationMatchers } from 'app/features/geo/utils/location';
import { findField, findFieldIndex } from 'app/features/dimensions/utils';

import {
  AdvancedToolPitTooltipConfig,
  AdvancedToolPitResolvedDetail,
  AdvancedToolPitImageOptions,
  AdvancedToolPitTooltipRow,
} from '../../components/AdvancedToolPitTooltip';
import {
  AdvancedToolPitFieldsEditor,
  AdvancedToolPitDetailConfig,
} from '../../editor/AdvancedToolPitFieldsEditor';
import {
  AdvancedToolPitHeaderEditor,
  AdvancedToolPitHeaderConfig,
} from '../../editor/AdvancedToolPitHeaderEditor';
import { MarkersLegend, MarkersLegendProps } from '../../components/MarkersLegend';
import { ObservablePropsWrapper } from '../../components/ObservablePropsWrapper';
import { StyleEditor } from '../../editor/StyleEditor';
import { getWebGLStyle, textMarker } from '../../style/markers';
import { DEFAULT_SIZE, defaultStyleConfig, StyleConfigValues } from '../../style/types';
import { getDisplacement, getRGBValues, getStyleConfigState, styleUsesText } from '../../style/utils';
import { getStyleDimension } from '../../utils/utils';
import { MarkersConfig } from './markersLayer';
import { generateSimplePinSVG, getColorForValue } from '../../utils/customMarkers';
import { Icon as OLIcon, Style as OLStyle } from 'ol/style';

export interface AdvancedToolPitConfig extends MarkersConfig {
  imageField?: string;
  fields?: string[]; // legacy support
  fieldTypes?: FieldType[];
  details?: AdvancedToolPitDetailConfig[];
  imageWidth?: number;
  imageHeight?: number;
  imageFit?: 'cover' | 'contain';
  imageBorderRadius?: number;
  header?: AdvancedToolPitHeaderConfig;
  useCustomPinMarker?: boolean;
  pinOutlineColor?: string;
  pinColorField?: string;
  pinColorScheme?: 'status' | 'priority' | 'category' | 'default';
  pinSize?: number;
}

const DEFAULT_IMAGE_WIDTH = 280;
const DEFAULT_IMAGE_HEIGHT = 180;
const DEFAULT_IMAGE_BORDER_RADIUS = 12;
const MAX_DETAIL_ITEMS = 6;

const defaultOptions: AdvancedToolPitConfig = {
  style: defaultStyleConfig,
  showLegend: true,
  imageField: undefined,
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
  pinOutlineColor: '#2c3e50',
  pinColorField: undefined,
  pinColorScheme: 'default',
  pinSize: 40,
};

export const ADVANCED_TOOLPIT_LAYER_ID = 'advanced-toolpit';

export const defaultAdvancedToolPitConfig: MapLayerOptions<AdvancedToolPitConfig> = {
  type: ADVANCED_TOOLPIT_LAYER_ID,
  name: '', // replaced by layer picker
  config: defaultOptions,
  location: {
    mode: FrameGeometrySourceMode.Auto,
  },
  tooltip: true,
};

export const advancedToolPitLayer: MapLayerRegistryItem<AdvancedToolPitConfig> = {
  id: ADVANCED_TOOLPIT_LAYER_ID,
  name: t('geomap.advanced-toolpit.layer-name', 'Advanced ToolPit'),
  description: t(
    'geomap.advanced-toolpit.layer-description',
    'Display markers with image-first tooltips that combine photos and selected fields.'
  ),
  isBaseMap: false,
  showLocation: true,
  hideOpacity: true,
  state: PluginState.beta,

  create: async (map: OpenLayersMap, options: MapLayerOptions<AdvancedToolPitConfig>, eventBus: EventBus, theme: GrafanaTheme2) => {
    const config: AdvancedToolPitConfig = {
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
    const vectorLayer = new VectorImage({ source, declutter: true });
    let hasVector = hasText;

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
      legend,
      update: (data: PanelData) => {
        if (!data.series?.length) {
          source.clear();
          return;
        }

        const frame = data.series[0];
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

        const tooltipFieldIndexes = getTooltipFieldIndexes(config.fields, frame, data.series);
        const allowedTypes = normalizeFieldTypes(config.fieldTypes);
        const imageField = config.imageField ? findField(frame, config.imageField) : undefined;
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

        // Reset vector layer when necessary for text markers
        hasVector = styleUsesText(config.style);

        const currentLayers = layers.getLayers().getArray();
        const shouldHaveVector = hasVector && symbol;
        const hasVectorInLayers = currentLayers.includes(vectorLayer);

        if (shouldHaveVector !== hasVectorInLayers) {
          const newLayers = hasVector ? (symbol ? [symbolLayer, vectorLayer] : [vectorLayer]) : [symbolLayer];
          layers.setLayers(new Collection(newLayers));
        }

        const processedMarkers = new Set<string>();

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

          if (geometry.getType() === 'Point') {
            const coordinates = geometry.getCoordinates();
            if (!coordinates || coordinates.length < 2) {
              return;
            }
            const key = buildMarkerKey(coordinates, values);
            if (processedMarkers.has(key)) {
              return;
            }
            processedMarkers.add(key);
          }

          if (geometry.getType() === 'LineString') {
            const lineStringStyle = style.maker(values);
            feature.setStyle(lineStringStyle);
          } else {
            // Apply WebGL properties for positioning and interaction
            applyWebGLProperties(feature, values, theme);

            if (geometry.getType() === 'Point') {
              // Handle custom pin markers
              if (config.useCustomPinMarker) {
                // Get color value from the correct frame if needed
                let colorValue = null;
                if (pinColorField) {
                  // If color field is from a different frame, we need to match rows properly
                  // For now, use the same row index (assumes frames are aligned)
                  colorValue = pinColorField.values[idx];
                }
                const innerColor = colorValue
                  ? getColorForValue(colorValue, config.pinColorScheme || 'default')
                  : values.color || theme.colors.primary.main;

                const pinSvg = generateSimplePinSVG({
                  pinColor: config.pinOutlineColor || '#2c3e50',
                  circleColor: innerColor,
                  size: config.pinSize || 40,
                });

                const pinIcon = new OLIcon({
                  src: pinSvg,
                  anchor: [0.5, 1], // Anchor at bottom center of pin
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

          const advancedConfig: AdvancedToolPitTooltipConfig = {
            imageUrl: getImageForRow(imageField, idx),
            fieldIndexes: tooltipFieldIndexes,
            fieldTypes: allowedTypes,
            detailEntries: resolvedDetails,
            rows: detailRows,
            imageOptions,
            layerLabel: options.name,
            headerText: headerInfo?.text,
            headerIcon: headerInfo?.icon,
            headerIconColor: headerInfo?.iconColor,
          };
          feature.set('advancedToolPit', advancedConfig);
          
          // Attach all frames so tooltip can resolve multi-frame field references
          feature.set('allFrames', data.series);
        });
      },
      registerOptionsUI: (builder) => {
        const imageCategory = [t('geomap.advanced-toolpit.category-image', 'Image display')];
        const headerCategory = [t('geomap.advanced-toolpit.category-header', 'Header content')];
        const contentCategory = [t('geomap.advanced-toolpit.category-content', 'Tooltip content')];
        const markerCategory = [t('geomap.advanced-toolpit.category-marker', 'Marker appearance')];

        builder
          .addBooleanSwitch({
            path: 'config.useCustomPinMarker',
            name: t('geomap.advanced-toolpit.use-pin-marker', 'Use pin-style markers'),
            description: t(
              'geomap.advanced-toolpit.use-pin-marker-description',
              'Enable Google Maps-style pin markers with customizable colors.'
            ),
            category: markerCategory,
            defaultValue: defaultOptions.useCustomPinMarker,
          })
          .addColorPicker({
            path: 'config.pinOutlineColor',
            name: t('geomap.advanced-toolpit.pin-outline-color', 'Pin outline color'),
            category: markerCategory,
            defaultValue: defaultOptions.pinOutlineColor,
            showIf: (options) => options.config?.useCustomPinMarker === true,
          })
          .addFieldNamePicker({
            path: 'config.pinColorField',
            name: t('geomap.advanced-toolpit.pin-color-field', 'Inner circle color field'),
            description: t(
              'geomap.advanced-toolpit.pin-color-field-description',
              'Field values will determine the inner circle color. Leave empty for fixed color.'
            ),
            category: markerCategory,
            showIf: (options) => options.config?.useCustomPinMarker === true,
          })
          .addRadio({
            path: 'config.pinColorScheme',
            name: t('geomap.advanced-toolpit.pin-color-scheme', 'Color scheme'),
            category: markerCategory,
            settings: {
              options: [
                { label: t('geomap.advanced-toolpit.scheme.default', 'Auto (8 colors)'), value: 'default' },
                { label: t('geomap.advanced-toolpit.scheme.status', 'Status (active/inactive)'), value: 'status' },
                { label: t('geomap.advanced-toolpit.scheme.priority', 'Priority (high/medium/low)'), value: 'priority' },
                { label: t('geomap.advanced-toolpit.scheme.category', 'Category (A/B/C/D/E)'), value: 'category' },
              ],
            },
            defaultValue: defaultOptions.pinColorScheme,
            showIf: (options) => options.config?.useCustomPinMarker === true && !!options.config?.pinColorField,
          })
          .addSliderInput({
            path: 'config.pinSize',
            name: t('geomap.advanced-toolpit.pin-size', 'Pin size'),
            category: markerCategory,
            settings: {
              min: 20,
              max: 80,
              step: 5,
            },
            defaultValue: defaultOptions.pinSize,
            showIf: (options) => options.config?.useCustomPinMarker === true,
          })
          .addCustomEditor({
            id: 'config.style',
            path: 'config.style',
            name: t('geomap.advanced-toolpit.style', 'Marker style'),
            editor: StyleEditor,
            defaultValue: defaultOptions.style,
            showIf: (options) => options.config?.useCustomPinMarker !== true,
          })
          .addBooleanSwitch({
            path: 'config.showLegend',
            name: t('geomap.advanced-toolpit.legend', 'Show legend'),
            defaultValue: defaultOptions.showLegend ?? true,
          })
          .addCustomEditor({
            id: 'config.header',
            path: 'config.header',
            name: t('geomap.advanced-toolpit.header.title', 'Header content'),
            description: t(
              'geomap.advanced-toolpit.header.description',
              'Choose which field should appear as the card headline.'
            ),
            category: headerCategory,
            editor: AdvancedToolPitHeaderEditor,
            defaultValue: defaultOptions.header,
          })
          .addFieldNamePicker({
            path: 'config.imageField',
            name: t('geomap.advanced-toolpit.image-field', 'Image URL field'),
            category: imageCategory,
            settings: {
              filter: (f: Field) => f.type === FieldType.string,
              noFieldsMessage: t(
                'geomap.advanced-toolpit.image-field.no-fields',
                'No string fields available in the current data.'
              ),
            },
          })
          .addNumberInput({
            path: 'config.imageWidth',
            name: t('geomap.advanced-toolpit.image-width', 'Image width (px)'),
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
            name: t('geomap.advanced-toolpit.image-height', 'Image height (px)'),
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
            name: t('geomap.advanced-toolpit.image-fit', 'Image fit'),
            category: imageCategory,
            settings: {
              options: [
                { label: t('geomap.advanced-toolpit.image-fit.cover', 'Cover'), value: 'cover' },
                { label: t('geomap.advanced-toolpit.image-fit.contain', 'Contain'), value: 'contain' },
              ],
            },
            defaultValue: defaultOptions.imageFit,
          })
          .addSliderInput({
            path: 'config.imageBorderRadius',
            name: t('geomap.advanced-toolpit.image-radius', 'Image corner radius'),
            category: imageCategory,
            settings: {
              min: 0,
              max: 40,
            },
            defaultValue: defaultOptions.imageBorderRadius,
          })
          .addMultiSelect({
            path: 'config.fieldTypes',
            name: t('geomap.advanced-toolpit.field-types', 'Allowed field types'),
            description: t(
              'geomap.advanced-toolpit.field-types-description',
              'Only show values that match the selected data types. Leave empty to include all fields.'
            ),
            category: contentCategory,
            settings: {
              options: [
                { label: t('geomap.advanced-toolpit.field-type.string', 'String'), value: [FieldType.string] },
                { label: t('geomap.advanced-toolpit.field-type.number', 'Number'), value: [FieldType.number] },
                { label: t('geomap.advanced-toolpit.field-type.time', 'Time'), value: [FieldType.time] },
                { label: t('geomap.advanced-toolpit.field-type.boolean', 'Boolean'), value: [FieldType.boolean] },
              ],
            },
            defaultValue: defaultOptions.fieldTypes,
          })
          .addCustomEditor({
            id: 'config.details',
            path: 'config.details',
            name: t('geomap.advanced-toolpit.selected-fields', 'Tooltip content'),
            description: t(
              'geomap.advanced-toolpit.selected-fields-description',
              'Pick which fields or custom values should be displayed under the image.'
            ),
            category: contentCategory,
            editor: AdvancedToolPitFieldsEditor,
            defaultValue: defaultOptions.details,
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
  config: AdvancedToolPitConfig,
  frame: DataFrame,
  frames: DataFrame[]
): AdvancedToolPitResolvedDetail[] | undefined {
  const detailsSource: AdvancedToolPitDetailConfig[] =
    (config.details && config.details.length
      ? config.details
      : config.fields?.map((field) => ({ id: field, type: 'field', field })) ?? []) ?? [];

  if (!detailsSource.length) {
    return undefined;
  }

  const resolved: AdvancedToolPitResolvedDetail[] = [];
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

function getImageOptions(config: AdvancedToolPitConfig): AdvancedToolPitImageOptions {
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
  header: AdvancedToolPitHeaderConfig | undefined,
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
  details: AdvancedToolPitResolvedDetail[] | undefined,
  allowedTypes: FieldType[] | undefined,
  fallbackIndexes: number[] | undefined,
  headerInfo?: ResolvedHeaderInfo
): AdvancedToolPitTooltipRow[] {
  const rows: AdvancedToolPitTooltipRow[] = [];

  const getSourceFrame = (detail?: AdvancedToolPitResolvedDetail): DataFrame => {
    if (detail?.frameIndex != null && frames[detail.frameIndex]) {
      return frames[detail.frameIndex]!;
    }
    return frame;
  };

  const pushCustomRow = (detail: AdvancedToolPitResolvedDetail) => {
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
    detail?: AdvancedToolPitResolvedDetail
  ) => {
    if (!shouldIncludeField(field, allowedTypes)) {
      return;
    }
    const text = getFieldValue(field!, rowIndex);
    if (text == null || text === '') {
      return;
    }
    const resolvedValue = applyLinkTemplate(detail?.linkTemplate, text, sourceFrame, rowIndex);
    rows.push({
      label: detail?.label ?? getFieldDisplayName(field!, sourceFrame, frames),
      value: resolvedValue ?? text,
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

  const candidateFrames: number[] = [];
  if (refIndex !== undefined) {
    candidateFrames.push(refIndex);
  }
  if (parsedKey) {
    candidateFrames.push(parsedKey.frameIndex);
  }
  candidateFrames.push(0);

  const fieldNames = (reference.fieldNames ?? []).filter(
    (name): name is string => typeof name === 'string' && name.trim().length > 0
  );
  const seen = new Set<number>();

  for (const candidate of candidateFrames) {
    if (candidate < 0 || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);

    const sourceFrame = frames[candidate] ?? defaultFrame;
    if (!sourceFrame?.fields?.length) {
      continue;
    }

    if (
      parsedKey &&
      parsedKey.frameIndex === candidate &&
      sourceFrame.fields[parsedKey.fieldIndex]
    ) {
      return { frameIndex: candidate, fieldIndex: parsedKey.fieldIndex };
    }

    for (const name of fieldNames) {
      const exactIdx = sourceFrame.fields.findIndex((field) => field?.name === name);
      if (exactIdx !== -1) {
        return { frameIndex: candidate, fieldIndex: exactIdx };
      }

      const displayIdx = findFieldIndex(name, sourceFrame, frames);
      if (displayIdx !== undefined) {
        return { frameIndex: candidate, fieldIndex: displayIdx };
      }
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
  const raw = field.values[rowIndex];
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (field.display) {
    try {
      return formattedValueToString(field.display(raw));
    } catch (err) {
      // ignore and fall back to string conversion
    }
  }
  if (typeof raw === 'object') {
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

function buildMarkerKey(coordinates: number[], values: StyleConfigValues): string {
  const { color, size, text, rotation } = values;
  return `advancedToolPit|${coordinates[0]}|${coordinates[1]}|${color}|${size}|${text}|${rotation}`;
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

function applyWebGLProperties(feature: any, values: StyleConfigValues, theme: GrafanaTheme2) {
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
