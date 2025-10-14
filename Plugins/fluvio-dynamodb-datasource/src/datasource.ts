import {
  DataSourceInstanceSettings,
  CoreApp,
  ScopedVars,
  AdHocVariableFilter,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv, TemplateSrv } from '@grafana/runtime';
import { DynamoQuery, FluvioDataSourceOptions, DEFAULT_QUERY } from './types';

export class DataSource extends DataSourceWithBackend<DynamoQuery, FluvioDataSourceOptions> {
  instanceSettings: DataSourceInstanceSettings<FluvioDataSourceOptions>;
  templateSrv: TemplateSrv;

  constructor(instanceSettings: DataSourceInstanceSettings<FluvioDataSourceOptions>) {
    super(instanceSettings);
    this.instanceSettings = instanceSettings;
    this.templateSrv = getTemplateSrv();
    
    // Force visible debug to confirm plugin is loading
    console.error('🚀 FLUVIO DYNAMODB PLUGIN LOADED!', Date.now());
    console.warn('🚀 Instance Settings:', instanceSettings);
  }

  // Default query shown when adding a new panel
  getDefaultQuery(app: CoreApp): Partial<DynamoQuery> {
    return DEFAULT_QUERY;
  }

  // Return false to prevent queries with no input
  filterQuery(query: DynamoQuery): boolean {
    return !!query.partiql || !!query.table;
  }

  // Apply template variables to queries before sending to backend
  applyTemplateVariables(query: DynamoQuery, scopedVars: ScopedVars, filters?: AdHocVariableFilter[]): DynamoQuery {
    console.log('🔍 PLUGIN DEBUG: applyTemplateVariables called!', Date.now());
    console.log('🔍 SCOPED VARS:', scopedVars);
    console.log('🔍 QUERY:', query);

    // Only get time from Grafana time picker when timestamp filtering is enabled
    if (query.timeFilterEnabled && scopedVars.__from && scopedVars.__to) {
      query.timeFrom = new Date(scopedVars.__from.value).toISOString();
      query.timeTo = new Date(scopedVars.__to.value).toISOString();
      console.log('🔍 Got time from Grafana time picker:', {
        timeFrom: query.timeFrom,
        timeTo: query.timeTo
      });
    }
    const variables = { ...scopedVars };

    const { fromUnix, toUnix, fromIso, toIso } = this.resolveTimeRange(scopedVars, query);

    // Debug logging for time range
    console.log('DEBUG: Time range calculation:', {
      fromUnix, toUnix, fromIso, toIso,
      scopedVars: scopedVars,
      timeFilterEnabled: query.timeFilterEnabled,
      timestampField: query.timestampField
    });

    variables.__from = { value: fromUnix.toString() };
    variables.__to = { value: toUnix.toString() };
    variables.__fromIso = { value: fromIso };
    variables.__toIso = { value: toIso };
    variables.__interval = { value: '$__interval' };
    variables.__interval_ms = { value: '$__interval_ms' };

    // Handle time filter for PartiQL queries
    const interpolatedTimestampField = query.timestampField
      ? this.templateSrv.replace(query.timestampField, variables)
      : query.timestampField;
    const effectiveTimeField = interpolatedTimestampField || 'timestamp';
    const quotedTimeField = this.formatPartiqlIdentifier(effectiveTimeField);

    // Always set the __timeFilter variable
    if (query.timeFilterEnabled) {
      const timeFilterValue = `${quotedTimeField} BETWEEN ${fromUnix} AND ${toUnix}`;
      console.log('DEBUG: Creating time filter:', timeFilterValue);
      variables.__timeFilter = {
        value: timeFilterValue,
      };
    } else {
      console.log('DEBUG: Time filter disabled, using 1=1');
      // When time filter is disabled, replace with a condition that's always true
      variables.__timeFilter = {
        value: '1=1',
      };
    }

    const interpolatedQuery = {
      ...query,
      timeFrom: fromIso,
      timeTo: toIso,
      partiql: query.partiql
        ? (() => {
            const originalQuery = query.partiql;
            const replacedQuery = this.templateSrv.replace(query.partiql, variables);
            console.log('DEBUG: PartiQL replacement:', {
              original: originalQuery,
              replaced: replacedQuery,
              timeFilterEnabled: query.timeFilterEnabled
            });
            return replacedQuery;
          })()
        : query.partiql,
      table: query.table ? this.templateSrv.replace(query.table, variables) : query.table,
      partitionKeyName: query.partitionKeyName
        ? this.templateSrv.replace(query.partitionKeyName, variables)
        : query.partitionKeyName,
      partitionKeyMode: query.partitionKeyMode,
      partitionKeyValues: query.partitionKeyValues
        ? query.partitionKeyValues
            .map((value) => this.templateSrv.replace(value, variables))
            .filter((value) => value !== '')
        : query.partitionKeyValues,
      partitionKeyValue: query.partitionKeyValue
        ? this.templateSrv.replace(query.partitionKeyValue, variables)
        : query.partitionKeyValue,
      sortKeyName: query.sortKeyName
        ? this.templateSrv.replace(query.sortKeyName, variables)
        : query.sortKeyName,
      sortKeyValue: query.sortKeyValue
        ? this.templateSrv.replace(query.sortKeyValue, variables)
        : query.sortKeyValue,
      sortKeyOperator: query.sortKeyOperator,
      sortKeyRangeStart: query.sortKeyRangeStart
        ? this.templateSrv.replace(query.sortKeyRangeStart, variables)
        : query.sortKeyRangeStart,
      sortKeyRangeEnd: query.sortKeyRangeEnd
        ? this.templateSrv.replace(query.sortKeyRangeEnd, variables)
        : query.sortKeyRangeEnd,
      sortKeyValues: query.sortKeyValues
        ? query.sortKeyValues
            .map((value) => this.templateSrv.replace(value, variables))
            .filter((value) => value !== '')
        : query.sortKeyValues,
      sortDirection: query.sortDirection,
      timestampField: interpolatedTimestampField,
      fieldMappings:
        query.fieldMappings?.map((mapping) => ({
          ...mapping,
          sourcePath: this.templateSrv.replace(mapping.sourcePath, variables),
          fieldName: this.templateSrv.replace(mapping.fieldName, variables),
        })) || query.fieldMappings,
    };

    return interpolatedQuery;
  }



  private resolveTimeRange(scopedVars: ScopedVars, query: DynamoQuery) {
    const now = Date.now();
    const defaultFrom = now - 24 * 60 * 60 * 1000;
    const defaultTo = now;

    let fromMs: number | undefined;
    let toMs: number | undefined;

    // Only use time from Grafana time picker when available
    if (scopedVars.__from?.value !== undefined) {
      fromMs = this.coerceToMillis(scopedVars.__from.value);
    }
    if (scopedVars.__to?.value !== undefined) {
      toMs = this.coerceToMillis(scopedVars.__to.value);
    }

    // Check query object if scopedVars don't have time
    if (!fromMs && query.timeFrom) {
      fromMs = this.coerceToMillis(query.timeFrom);
    }
    if (!toMs && query.timeTo) {
      toMs = this.coerceToMillis(query.timeTo);
    }

    // Fallback to defaults
    fromMs = fromMs ?? defaultFrom;
    toMs = toMs ?? defaultTo;

    const from = Math.min(fromMs, toMs);
    const to = Math.max(fromMs, toMs);

    return {
      fromUnix: Math.floor(from / 1000),
      toUnix: Math.floor(to / 1000),
      fromIso: new Date(from).toISOString(),
      toIso: new Date(to).toISOString(),
    };
  }

  private coerceToMillis(candidate: any): number | undefined {
    if (candidate === undefined || candidate === null) {
      return undefined;
    }

    if (typeof candidate === 'number') {
      if (!Number.isFinite(candidate)) {
        return undefined;
      }
      return this.normalizeEpoch(candidate);
    }

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed === '') {
        return undefined;
      }

      const numeric = Number(trimmed);
      if (!Number.isNaN(numeric)) {
        return this.normalizeEpoch(numeric);
      }

      const parsed = Date.parse(trimmed);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }

      return undefined;
    }

    if (candidate instanceof Date) {
      const time = candidate.getTime();
      return Number.isFinite(time) ? time : undefined;
    }

    if (typeof (candidate as any).toMillis === 'function') {
      const millis = (candidate as any).toMillis();
      if (Number.isFinite(millis)) {
        return millis;
      }
    }

    if (typeof candidate.valueOf === 'function') {
      const valueOfResult = candidate.valueOf();
      if (typeof valueOfResult === 'number' && Number.isFinite(valueOfResult)) {
        return this.normalizeEpoch(valueOfResult);
      }
    }

    if (typeof (candidate as any).toISOString === 'function') {
      const iso = (candidate as any).toISOString();
      const parsed = Date.parse(iso);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }

  private normalizeEpoch(value: number): number {
    // Check if value looks like seconds (between 1970-2100 in seconds)
    // Unix timestamp for Jan 1, 1970 = 0, Jan 1, 2100 ≈ 4.1e9
    if (value >= 0 && value <= 4.1e9) {
      return value * 1000; // Convert seconds to milliseconds
    }
    
    // Check if value looks like milliseconds (between 1970-2100 in milliseconds)
    // Unix timestamp for Jan 1, 1970 = 0ms, Jan 1, 2100 ≈ 4.1e12ms
    if (value >= 0 && value <= 4.1e12) {
      return value; // Already in milliseconds
    }
    
    // For values outside reasonable timestamp ranges, return as-is
    // This handles edge cases but may not be valid timestamps
    return value;
  }

  private formatPartiqlIdentifier(identifier?: string): string {
    if (!identifier) {
      return '"timestamp"';
    }

    const trimmed = identifier.trim();

    if (trimmed === '') {
      return '"timestamp"';
    }

    // If identifier already contains quotes, parentheses, brackets, or spaces, assume user supplied a full expression
    if (/["'\s()\[\]]/.test(trimmed)) {
      return trimmed;
    }

    // Quote each dot-delimited segment to protect reserved words
    return trimmed
      .split('.')
      .map((segment) => `"${segment.replace(/"/g, '""')}"`)
      .join('.');
  }

  // Get available template variables for UI hints
  getVariables(): string[] {
    return this.templateSrv.getVariables().map((v) => `$${v.name}`);
  }


  // DataSourceWithBackend automatically handles query() and testDatasource() methods
}
