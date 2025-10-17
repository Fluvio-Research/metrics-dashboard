import { FieldTransformation } from '../types';

export class DataTransformer {
  static transformValue(value: string, transformation?: FieldTransformation): string {
    if (!transformation || !value) {
      return value;
    }

    switch (transformation.type) {
      case 'uppercase':
        return value.toUpperCase();
      
      case 'lowercase':
        return value.toLowerCase();
      
      case 'trim':
        return value.trim();
      
      case 'date_format':
        return this.transformDate(value, transformation.params);
      
      case 'regex_replace':
        return this.regexReplace(value, transformation.params);
      
      default:
        return value;
    }
  }

  private static transformDate(value: string, params?: Record<string, string>): string {
    if (!params?.targetFormat) {
      return value;
    }

    try {
      // Try to parse as ISO date
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value;
      }

      const targetFormat = params.targetFormat;
      
      // Simple date formatting
      if (targetFormat === 'ISO') {
        return date.toISOString();
      } else if (targetFormat === 'unix') {
        return String(Math.floor(date.getTime() / 1000));
      } else if (targetFormat === 'unix_ms') {
        return String(date.getTime());
      } else if (targetFormat === 'YYYY-MM-DD') {
        return date.toISOString().split('T')[0];
      } else if (targetFormat === 'YYYY-MM-DD HH:mm:ss') {
        return date.toISOString().replace('T', ' ').substring(0, 19);
      }
      
      return value;
    } catch (error) {
      return value;
    }
  }

  private static regexReplace(value: string, params?: Record<string, string>): string {
    if (!params?.pattern || !params?.replacement) {
      return value;
    }

    try {
      const flags = params.flags || 'g';
      const regex = new RegExp(params.pattern, flags);
      return value.replace(regex, params.replacement);
    } catch (error) {
      return value;
    }
  }

  static transformRow(row: Record<string, string>, transformations: Record<string, FieldTransformation>): Record<string, string> {
    const transformed: Record<string, string> = {};

    for (const [key, value] of Object.entries(row)) {
      const transformation = transformations[key];
      transformed[key] = this.transformValue(value, transformation);
    }

    return transformed;
  }
}

