import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

// Field mapping configuration for dynamic data transformation
export interface FieldMapping {
  fieldName: string;          // Display name in Grafana
  sourcePath: string;         // JSONPath to source data (e.g., "location.lat", "nested.array[0].value")
  dataType: 'string' | 'number' | 'boolean' | 'time' | 'json';
  transformation?: string;    // Optional transformation (e.g., "parseFloat", "new Date()", "JSON.stringify")
}

// Query model sent from Grafana to the backend.
export interface DynamoQuery extends DataQuery {
  // Basic query parameters
  partiql?: string;
  table?: string;
  partitionKeyName?: string;
  partitionKeyValue?: string;
  sortKeyName?: string;
  sortKeyValue?: string;
  limit?: number;
  
  // Query mode state
  queryMode?: 'partiql' | 'key';

  // Time filtering
  timeFilterEnabled?: boolean;
  timestampField?: string;      // Field name to filter on (default: "timestamp")
  timeFrom?: string;            // ISO date string for start time
  timeTo?: string;              // ISO date string for end time
  
  // Dynamic field mapping and transformation
  fieldMappings?: FieldMapping[];
  outputFormat?: 'auto' | 'table' | 'geomap' | 'timeseries';
  
  // Schema discovery
  discoverSchema?: boolean;
}

// Default values for a new query
export const DEFAULT_QUERY: Partial<DynamoQuery> = {
  limit: 100,
  outputFormat: 'auto',
  fieldMappings: [],
  discoverSchema: false,
  timeFilterEnabled: false,
  timestampField: 'timestamp',
  queryMode: 'key',
};

// Data source configuration options (saved in Grafana)
export interface FluvioDataSourceOptions extends DataSourceJsonData {
  region?: string;
  endpoint?: string;
}

// Secure fields stored only in the backend
export interface FluvioSecureJsonData {
  accessKey?: string;
  secretKey?: string;
  // Note: sessionToken removed - this plugin is optimized for permanent IAM credentials
}
