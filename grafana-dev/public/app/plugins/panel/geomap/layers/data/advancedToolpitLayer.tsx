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

        // Reset vector layer when necessary for text markers
        hasVector = styleUsesText(config.style);
        if (hasVector && !layers.getLayers().getArray().includes(vectorLayer)) {
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
            applyWebGLProperties(feature, values, theme);
          }

          if (hasVector && geometry.getType() === 'Point') {
            feature.setStyle(textMarker(values));
          }

          const headerInfo = resolveHeader(config.header, frame, data.series, idx);
          const detailRows = buildDetailRows(
            frame,
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
            rows: detailRows,
            imageOptions,
            layerLabel: options.name,
            headerText: headerInfo?.text,
            headerIcon: headerInfo?.icon,
            headerIconColor: headerInfo?.iconColor,
          };
          feature.set('advancedToolPit', advancedConfig);
        });
      },
      registerOptionsUI: (builder) => {
        const imageCategory = [t('geomap.advanced-toolpit.category-image', 'Image display')];
        const headerCategory = [t('geomap.advanced-toolpit.category-header', 'Header content')];
        const contentCategory = [t('geomap.advanced-toolpit.category-content', 'Tooltip content')];

        builder
          .addCustomEditor({
            id: 'config.style',
            path: 'config.style',
            name: t('geomap.advanced-toolpit.style', 'Marker style'),
            editor: StyleEditor,
            defaultValue: defaultOptions.style,
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
        });
      }
      continue;
    }

    const parsedKey = parseFieldKey(detail.fieldKey);
    let fieldIndex: number | undefined;
    let frameIndex = 0;

    let displayLabel = detail.label ?? detail.field;

    if (parsedKey) {
      frameIndex = parsedKey.frameIndex;
      fieldIndex = parsedKey.fieldIndex;
      if (!frames[frameIndex] || !frames[frameIndex].fields[fieldIndex]) {
        fieldIndex = undefined;
      }
    }

    if (fieldIndex === undefined && detail.field) {
      frameIndex = 0;
      fieldIndex = findFieldIndex(detail.field, frame, frames);
    }

    if (fieldIndex === undefined) {
      continue;
    }

    const sourceFrame = frames[frameIndex] ?? frame;
    const sourceField = sourceFrame?.fields?.[fieldIndex];
    if (!sourceField) {
      continue;
    }
    if (!displayLabel) {
      displayLabel = getFieldDisplayName(sourceField, sourceFrame, frames);
    }

    resolved.push({
      type: 'field',
      label: displayLabel,
      fieldIndex,
      frameIndex,
      showLabel: detail.showLabel !== false,
      icon: detail.icon,
      iconColor: detail.iconColor,
      labelColor: detail.labelColor,
      isLink: detail.isLink,
      linkDisplayText: detail.linkDisplayText,
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
  let frameIndex = 0;

  if (header.fieldKey) {
    const parsed = parseFieldKey(header.fieldKey);
    if (parsed) {
      frameIndex = parsed.frameIndex;
      fieldIndex = parsed.fieldIndex;
    }
  }

  if (fieldIndex === undefined && header.fieldName) {
    fieldIndex = findFieldIndex(header.fieldName, frame, frames);
    frameIndex = 0;
  }

  if (fieldIndex !== undefined) {
    const sourceFrame = frames[frameIndex] ?? frame;
    const field = sourceFrame?.fields?.[fieldIndex];
    if (field) {
      const value = getFieldValue(field, rowIndex);
      if (value && value.trim().length) {
        text = value;
      }
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
  rowIndex: number,
  details: AdvancedToolPitResolvedDetail[] | undefined,
  allowedTypes: FieldType[] | undefined,
  fallbackIndexes: number[] | undefined,
  headerInfo?: ResolvedHeaderInfo
): AdvancedToolPitTooltipRow[] {
  const rows: AdvancedToolPitTooltipRow[] = [];

  const pushCustomRow = (detail: AdvancedToolPitResolvedDetail) => {
    if (!detail.value || !detail.value.trim().length) {
      return;
    }
    rows.push({
      label: detail.label ?? '',
      value: detail.value.trim(),
      showLabel: detail.showLabel !== false,
      icon: detail.icon,
      iconColor: detail.iconColor,
      labelColor: detail.labelColor,
      isLink: detail.isLink,
      linkDisplayText: detail.linkDisplayText,
    });
  };

  const pushFieldRow = (field: Field | undefined, detail?: AdvancedToolPitResolvedDetail) => {
    if (!shouldIncludeField(field, allowedTypes)) {
      return;
    }
    const text = getFieldValue(field!, rowIndex);
    if (text == null || text === '') {
      return;
    }
    rows.push({
      label: detail?.label ?? getFieldDisplayName(field!, frame),
      value: text,
      showLabel: detail ? detail.showLabel !== false : true,
      icon: detail?.icon,
      iconColor: detail?.iconColor,
      labelColor: detail?.labelColor,
      isLink: detail?.isLink,
      linkDisplayText: detail?.linkDisplayText,
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

      const field = frame.fields[detail.fieldIndex ?? -1];
      if (headerInfo?.hideDuplicate !== false && detail.fieldIndex === headerInfo?.fieldIndex && (detail.frameIndex ?? 0) === (headerInfo?.frameIndex ?? 0)) {
        continue;
      }
      pushFieldRow(field, detail);
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
      pushFieldRow(field);
    }
  }

  return rows.slice(0, MAX_DETAIL_ITEMS);
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

function applyWebGLProperties(feature: any, values: StyleConfigValues, theme: GrafanaTheme2) {
  const colorString = tinycolor(theme.visualization.getColorByName(values.color)).toString();
  const colorValues = getRGBValues(colorString);

  const radius = values.size ?? DEFAULT_SIZE;
  const displacement = getDisplacement(values.symbolAlign ?? defaultStyleConfig.symbolAlign, radius);

  feature.setProperties({ red: colorValues?.r ?? 255 });
  feature.setProperties({ green: colorValues?.g ?? 255 });
  feature.setProperties({ blue: colorValues?.b ?? 255 });
  feature.setProperties({ size: (values.size ?? 1) * 2 });
  feature.setProperties({ rotation: ((values.rotation ?? 0) * Math.PI) / 180 });
  feature.setProperties({ opacity: (values.opacity ?? 1) * (colorValues?.a ?? 1) });
  feature.setProperties({ offsetX: displacement[0] });
  feature.setProperties({ offsetY: displacement[1] });
}
