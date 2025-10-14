import { DataSourceRef } from '@grafana/data';

export type UploadInputMode = 'form' | 'json';

export interface UploadPanelOptions {
  datasource?: DataSourceRef;
  presetId?: string;
  inputMode?: UploadInputMode;
  autoPreview?: boolean;
}

export interface UploadField {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
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

