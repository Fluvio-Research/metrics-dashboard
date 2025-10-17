import { FieldValidation, ValidationError, UploadField } from '../types';
import { resolveFieldType, normalizeConfiguredType } from './dynamoTypes';

export class Validators {
  static validateField(
    fieldName: string,
    value: string,
    field: UploadField,
    rowIndex?: number
  ): ValidationError | null {
    // Check required
    if (field.required && (!value || value.trim() === '')) {
      return {
        field: fieldName,
        message: field.validation?.customMessage || `${fieldName} is required`,
        row: rowIndex,
        severity: 'error',
      };
    }

    if (!value || !field.validation) {
      return null;
    }

    const validation = field.validation;
    const effectiveType = resolveFieldType(field);

    // Check pattern
    if (validation.pattern) {
      try {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          return {
            field: fieldName,
            message: validation.customMessage || `${fieldName} does not match required pattern`,
            row: rowIndex,
            severity: 'error',
          };
        }
      } catch (error) {
        console.error('Invalid regex pattern:', validation.pattern);
      }
    }

    // Check string length
    if (validation.minLength !== undefined && value.length < validation.minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${validation.minLength} characters`,
        row: rowIndex,
        severity: 'error',
      };
    }

    if (validation.maxLength !== undefined && value.length > validation.maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at most ${validation.maxLength} characters`,
        row: rowIndex,
        severity: 'error',
      };
    }

    // Check numeric range
    if (effectiveType === 'number') {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        if (validation.min !== undefined && numValue < validation.min) {
          return {
            field: fieldName,
            message: `${fieldName} must be at least ${validation.min}`,
            row: rowIndex,
            severity: 'error',
          };
        }

        if (validation.max !== undefined && numValue > validation.max) {
          return {
            field: fieldName,
            message: `${fieldName} must be at most ${validation.max}`,
            row: rowIndex,
            severity: 'error',
          };
        }
      }
    }

    return null;
  }

  static validateRow(
    row: Record<string, string>,
    schema: UploadField[],
    rowIndex?: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of schema) {
      const value = row[field.name];
      const error = this.validateField(field.name, value, field, rowIndex);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  static validateAllRows(
    rows: Record<string, string>[],
    schema: UploadField[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    rows.forEach((row, index) => {
      const rowErrors = this.validateRow(row, schema, index + 1);
      errors.push(...rowErrors);
    });

    return errors;
  }

  static getFieldTypeValidationHint(type?: string): string {
    const normalised = normalizeConfiguredType(type);
    switch (normalised) {
      case 'string':
        return 'Enter text value';
      case 'number':
        return 'Enter numeric value (e.g., 123 or 45.67)';
      case 'boolean':
        return 'Enter true or false';
      case 'json':
        return 'Enter valid JSON object';
      default:
        return 'Enter value';
    }
  }
}
