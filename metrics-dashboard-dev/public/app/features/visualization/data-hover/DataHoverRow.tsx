import { FeatureLike } from 'ol/Feature';

import { ArrayDataFrame, DataFrame, Field, FieldType } from '@grafana/data';

import { DataHoverView } from './DataHoverView';
import {
  AdvancedToolPitTooltip,
  AdvancedToolPitTooltipConfig,
} from 'app/plugins/panel/geomap/components/AdvancedToolPitTooltip';

type Props = {
  feature?: FeatureLike;
};

export const DataHoverRow = ({ feature }: Props) => {
  let data: DataFrame;
  let rowIndex = 0;
  if (!feature) {
    return null;
  }

  const advancedConfig = feature.get('advancedToolPit') as AdvancedToolPitTooltipConfig | undefined;
  if (advancedConfig && hasAdvancedToolPitContent(feature, advancedConfig)) {
    return <AdvancedToolPitTooltip feature={feature} config={advancedConfig} />;
  }

  data = feature.get('frame');
  if (data) {
    rowIndex = feature.get('rowIndex');
  } else {
    const { geometry, ...properties } = feature.getProperties();
    data = new ArrayDataFrame([properties]);
  }

  return <DataHoverView data={data} rowIndex={rowIndex} />;
};

function hasAdvancedToolPitContent(feature: FeatureLike, config: AdvancedToolPitTooltipConfig): boolean {
  if (config.imageUrl) {
    return true;
  }

  if (config.headerText && config.headerText.trim().length) {
    return true;
  }

  if (config.rows && config.rows.some((row) => row.value && row.value.trim().length)) {
    return true;
  }

  const frame = feature.get('frame') as DataFrame | undefined;
  const rowIndex = feature.get('rowIndex') as number | undefined;

  if (!frame || rowIndex === undefined) {
    return false;
  }

  const allowedTypes = config.fieldTypes && config.fieldTypes.length ? config.fieldTypes : undefined;

  if (config.detailEntries && config.detailEntries.length) {
    for (const entry of config.detailEntries) {
      if (entry.type === 'custom' && entry.value && entry.value.trim().length) {
        return true;
      }
      if (entry.type === 'field' && entry.fieldIndex !== undefined) {
        const field = frame.fields[entry.fieldIndex];
        if (fieldMatches(field, rowIndex, allowedTypes)) {
          return true;
        }
      }
    }
    return false;
  }

  const indexes =
    config.fieldIndexes && config.fieldIndexes.length > 0
      ? config.fieldIndexes
      : frame.fields.map((_, idx) => idx);

  return indexes.some((idx) => {
    const field = frame.fields[idx];
    return fieldMatches(field, rowIndex, allowedTypes);
  });
}

function fieldMatches(field: Field | undefined, rowIndex: number, allowedTypes?: FieldType[]): boolean {
  if (!field) {
    return false;
  }

  if (field.config?.custom?.hideFrom?.tooltip) {
    return false;
  }

  if (allowedTypes && allowedTypes.length && !allowedTypes.includes(field.type)) {
    return false;
  }

  const value = field.values[rowIndex];
  return value !== undefined && value !== null && value !== '';
}
