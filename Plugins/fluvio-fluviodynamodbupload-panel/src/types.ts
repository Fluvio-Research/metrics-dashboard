import { DataSourceRef } from '@grafana/data';

export type UploadInputMode = 'form' | 'json' | 'file' | 'wizard';

export interface UploadPanelOptions {
  datasource?: DataSourceRef;
  presetId?: string; // @deprecated: Use selectedPresetId instead
  selectedPresetId?: string; // Panel-configured preset ID (viewers won't see preset selector when this is set)
  presetConfig?: string; // JSON string of the preset configuration
  inputMode?: UploadInputMode;
  autoPreview?: boolean;
  showHelp?: boolean;
  enableBatchUpload?: boolean;
}

export interface UploadField {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
  defaultValue?: string;
  validation?: FieldValidation;
  transformation?: FieldTransformation;
  dynamoType?: string;
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customMessage?: string;
}

export interface FieldTransformation {
  type: 'uppercase' | 'lowercase' | 'trim' | 'date_format' | 'regex_replace' | 'custom';
  params?: Record<string, string>;
}

export interface UploadPresetSummary {
  id: string;
  name: string;
  description?: string;
  table: string;
  index?: string;
  operation: 'insert' | 'update' | 'delete' | 'select';
  schema?: UploadField[];
  allowAdHocFields?: boolean;
  allowDryRun?: boolean;
  maxPayloadKB?: number;
  partiqlTemplate?: string;
  responsePreview?: boolean;
  helpText?: string;
  category?: string;
}

export interface UploadPreviewResponse {
  preset: UploadPresetSummary;
  itemCount: number;
  statements: string[];
  payloadSizeBytes: number;
  estimatedCapacity?: number;
}

export interface ConsumedCapacitySummary {
  tableName?: string;
  capacityUnits: number;
  readUnits?: number;
  writeUnits?: number;
  throttleEvents?: number;
}

export interface UploadExecuteResponse {
  preset: UploadPresetSummary;
  itemCount: number;
  statements: string[];
  payloadSizeBytes: number;
  consumedCapacity?: ConsumedCapacitySummary[];
  results?: Record<string, unknown>[];
  warnings?: string[];
}

export interface ParsedFileData {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
  rowCount: number;
}

export interface ValidationError {
  field: string;
  message: string;
  row?: number;
  severity: 'error' | 'warning';
}

export interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
  errors: ValidationError[];
}
