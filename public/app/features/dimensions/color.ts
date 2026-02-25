import {
  DataFrame,
  Field,
  FieldType,
  getDisplayProcessor,
  getFieldColorModeForField,
  GrafanaTheme2,
  getFieldConfigWithMinMax,
} from '@grafana/data';
import { ColorDimensionConfig } from '@grafana/schema';

import { DimensionSupplier } from './types';
import { findField, getLastNotNullFieldValue } from './utils';

//---------------------------------------------------------
// Color dimension
//---------------------------------------------------------

export function getColorDimension(
  frame: DataFrame | undefined,
  config: ColorDimensionConfig,
  theme: GrafanaTheme2
): DimensionSupplier<string> {
  return getColorDimensionForField(findField(frame, config.field), config, theme);
}

/**
 * Get a consistent color for a value using a color palette
 * This ensures same values always get the same color (like cluster IDs)
 */
function getColorForCategoricalValue(value: unknown, theme: GrafanaTheme2): string {
  const palette = theme.visualization.palette;
  const stringValue = String(value ?? '');
  
  // Hash the string to get a consistent index
  let hash = 0;
  for (let i = 0; i < stringValue.length; i++) {
    const char = stringValue.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % palette.length;
  return theme.visualization.getColorByName(palette[index]);
}

export function getColorDimensionForField(
  field: Field | undefined,
  config: ColorDimensionConfig,
  theme: GrafanaTheme2
): DimensionSupplier<string> {
  if (!field) {
    const v = theme.visualization.getColorByName(config.fixed ?? 'grey');
    return {
      isAssumed: Boolean(config.field?.length) || !config.fixed,
      fixed: v,
      value: () => v,
      get: (i) => v,
    };
  }

  // Use the expensive color calculation by value
  const mode = getFieldColorModeForField(field);
  if (mode.isByValue || field.config.mappings?.length) {
    // Force this to use local min/max for range
    const config = getFieldConfigWithMinMax(field, true);
    if (config !== field.config) {
      field = { ...field, config };
      field.state = undefined;
    }

    const disp = getDisplayProcessor({ field, theme });
    const getColor = (value: unknown): string => {
      return disp(value).color ?? '#ccc';
    };

    return {
      field,
      get: (index: number): string => getColor(field!.values[index]),
      value: () => getColor(getLastNotNullFieldValue(field!)),
    };
  }

  // Auto-assign colors for categorical/string fields (like cluster IDs)
  // This ensures different values get different colors consistently
  if (field.type === FieldType.string || field.type === FieldType.number) {
    const uniqueValues = new Set(field.values);
    
    // If we have multiple unique values, treat as categorical and assign palette colors
    if (uniqueValues.size > 1 && uniqueValues.size < 100) {
      return {
        field,
        get: (index: number): string => {
          const value = field.values[index];
          return getColorForCategoricalValue(value, theme);
        },
        value: () => getColorForCategoricalValue(getLastNotNullFieldValue(field), theme),
      };
    }
  }

  // Fallback: series or fixed color (does not depend on value)
  const fixed = mode.getCalculator(field, theme)(0, 0);
  return {
    fixed,
    value: () => fixed,
    get: (i) => fixed,
    field,
  };
}
