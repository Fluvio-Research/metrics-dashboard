import { AwsAuthDataSourceJsonData, AwsAuthDataSourceSecureJsonData } from "@grafana/aws-sdk";
import { DataQuery } from "@grafana/schema";

export interface DynamoDBQuery extends DataQuery {
  queryText?: string;
  limit?: number;
  datetimeAttributes: DatetimeAttribute[];
  customFilters?: CustomFilter[];
  sortBy?: string;           // Field name to sort by (client-side)
  sortDirection?: 'asc' | 'desc';  // Sort direction (client-side)
  sortKey?: string;          // Sort key attribute for DynamoDB native sorting
  scanIndexForward?: boolean;      // DynamoDB native sort order (Query API only)
}

export interface CustomFilter {
  field: string;
  operator: string;
  value: string;
}

export const DEFAULT_QUERY: Partial<DynamoDBQuery> = {
  queryText: "",
  datetimeAttributes: [],
  customFilters: []
};

export interface DynamoDBDataSourceOptions extends AwsAuthDataSourceJsonData {
  connectionTestTable?: string;
  uploadPresets?: UploadPreset[];
  maxUploadPayloadKB?: number;
}

export interface DynamoDBDataSourceSecureJsonData extends AwsAuthDataSourceSecureJsonData { }

export const DatetimeFormat = {
  UnixTimestampSeconds: "1",
  UnixTimestampMiniseconds: "2",
  CustomFormat: "custom"
};
export interface DatetimeAttribute {
  name: string;
  format: string;
}

export interface DynamoDBVariableQuery {
  query: string;
}

export type UploadOperation = 'insert' | 'update' | 'delete' | 'select';

export interface UploadField {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
}

export interface UploadPreset {
  id: string;
  name: string;
  description?: string;
  table: string;
  index?: string;
  operation: UploadOperation;
  schema?: UploadField[];
  partiqlTemplate?: string;
  allowAdHocFields?: boolean;
  allowDryRun?: boolean;
  maxPayloadKB?: number;
  responsePreview?: boolean;
}
