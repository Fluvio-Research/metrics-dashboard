import { css } from '@emotion/css';

import { useStyles2 } from '../../../themes/ThemeContext';
import { TableCellProps } from '../types';

/**
 * Parameter structure for displaying complex parameter/subtype data in table cells.
 * 
 * Example JSON input:
 * [{"parameterId":"1-1","parameterName":"Water Quality","subtypes":[{"subtypeId":"1-1-sub-0","subtypeName":"Temp"}]}]
 * 
 * Will be displayed as:
 * "Water Quality (Temp)"
 */
interface Parameter {
  parameterId?: string;
  parameterName?: string;
  subtypes?: Array<{
    subtypeId?: string;
    subtypeName?: string;
  }>;
}

/**
 * Parses the value to extract parameter information
 */
function parseParameterValue(value: unknown): Parameter[] | null {
  if (!value) {
    return null;
  }

  let parsed: unknown;

  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        return null;
      }
    } else {
      return null;
    }
  } else {
    parsed = value;
  }

  // Ensure we have an array
  const paramArray = Array.isArray(parsed) ? parsed : [parsed];

  // Validate that items have the expected structure
  const hasValidStructure = paramArray.some((item) => {
    return (
      item &&
      typeof item === 'object' &&
      ('parameterId' in item || 'parameterName' in item || 'subtypes' in item)
    );
  });

  if (!hasValidStructure) {
    return null;
  }

  return paramArray as Parameter[];
}

/**
 * Formats parameters into a readable string
 */
function formatParameters(parameters: Parameter[]): string {
  if (!parameters || parameters.length === 0) {
    return '';
  }

  return parameters
    .map((param) => {
      const parts: string[] = [];

      // Add parameter name if available
      if (param.parameterName) {
        parts.push(param.parameterName);
      }

      // Add subtypes if available
      if (param.subtypes && param.subtypes.length > 0) {
        const subtypeNames = param.subtypes
          .map((subtype) => subtype.subtypeName)
          .filter((name) => name)
          .join(', ');

        if (subtypeNames) {
          parts.push(`(${subtypeNames})`);
        }
      }

      return parts.join(' ');
    })
    .filter((str) => str)
    .join('; ');
}

export function ParameterCell(props: TableCellProps): JSX.Element {
  const { cell, cellProps } = props;
  const styles = useStyles2(getStyles);

  const parameters = parseParameterValue(cell.value);

  let displayText: string;
  if (!parameters) {
    // Fallback to string representation if not a parameter structure
    displayText = String(cell.value ?? '');
  } else {
    const formatted = formatParameters(parameters);
    displayText = formatted || String(cell.value ?? '');
  }

  return (
    <div {...cellProps} className={styles.container}>
      <span className={styles.text}>{displayText}</span>
    </div>
  );
}

const getStyles = () => ({
  container: css({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  }),
  text: css({
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  }),
});

