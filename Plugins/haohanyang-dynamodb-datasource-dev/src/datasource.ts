import {
  DataSourceInstanceSettings,
  CoreApp,
  ScopedVars,
  DataQueryRequest,
  DataQueryResponse,
  MetricFindValue,
  LegacyMetricFindQueryOptions,
  StandardVariableQuery,
  StandardVariableSupport,
} from "@grafana/data";
import { DataSourceWithBackend, getTemplateSrv } from "@grafana/runtime";
import { Observable, lastValueFrom } from "rxjs";
import { DynamoDBQuery, DynamoDBDataSourceOptions, DEFAULT_QUERY, DatetimeFormat, DynamoDBVariableQuery } from "./types";
import { formatRefTime } from "./utils";

export class DataSource extends DataSourceWithBackend<DynamoDBQuery, DynamoDBDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<DynamoDBDataSourceOptions>) {
    super(instanceSettings);
    this.variables = new DynamoDBVariableSupport(this);
    console.log('DynamoDB datasource variables support initialized:', this.variables?.getType?.());
  }

  getDefaultQuery(_: CoreApp): Partial<DynamoDBQuery> {
    return DEFAULT_QUERY;
  }

  applyTemplateVariables(query: DynamoDBQuery, scopedVars: ScopedVars) {
    return {
      ...query,
      queryText: getTemplateSrv().replace(query.queryText, scopedVars),
    };
  }

  filterQuery(query: DynamoDBQuery): boolean {
    // if no query has been provided, prevent the query from being executed
    return !!query.queryText;
  }

  query(request: DataQueryRequest<DynamoDBQuery>): Observable<DataQueryResponse> {
    // Validate time range
    if (!request.range || !request.range.from || !request.range.to) {
      console.error('Invalid time range in query request');
      throw new Error('Invalid time range');
    }

    let fromTime = Math.floor(request.range.from.toDate().getTime() / 1000);
    let toTime = Math.floor(request.range.to.toDate().getTime() / 1000);
    
    // Validate time range values
    if (isNaN(fromTime) || isNaN(toTime) || fromTime < 0 || toTime < 0) {
      console.error('Invalid time range values:', { fromTime, toTime });
      throw new Error('Invalid time range values');
    }

    // Ensure fromTime is always before toTime
    if (fromTime > toTime) {
      console.warn('From time is after to time, swapping values');
      [fromTime, toTime] = [toTime, fromTime];
    }
    
    console.log('Time range debug:', { fromTime, toTime, from: request.range.from.toDate(), to: request.range.to.toDate() });
    
    const queries = request.targets.map((query) => {
      let processedQuery = query.queryText || "";
      
      // Skip empty queries (already handled by filterQuery, but double-check)
      if (!processedQuery.trim()) {
        console.warn('Skipping empty query');
        return query;
      }
      
      // Replace Grafana time variables with actual values
      processedQuery = processedQuery
        .replace(/\$from/g, fromTime.toString())
        .replace(/\$to/g, toTime.toString())
        // Handle $__timeFilter function - convert to proper DynamoDB PartiQL syntax
        .replace(/\$__timeFilter\(\s*['"`]?(\w+)['"`]?\s*\)/gi, (_m, attr) => `"${attr}" BETWEEN ${fromTime} AND ${toTime}`);
      
      console.log('Query transformation:', { original: query.queryText, processed: processedQuery });
      
      return {
        ...query,
        queryText: processedQuery,
        datetimeAttributes: (query.datetimeAttributes || []).map(field => {
          // Validate field has required properties
          if (!field || !field.name) {
            console.warn('Invalid datetime attribute field, skipping:', field);
            return field;
          }
          
          if (field.format !== DatetimeFormat.UnixTimestampSeconds && field.format !== DatetimeFormat.UnixTimestampMiniseconds) {
            try {
              return { ...field, format: formatRefTime(field.format) };
            } catch (error) {
              console.error('Error formatting datetime attribute:', error);
              return field;
            }
          }
          return field;
        })
      };
    });
    return super.query({ ...request, targets: queries });
  }

  /**
   * Implemented as part of DataSourceAPI and used for template variable queries.
   * This method enables the Query field to appear in variable configuration.
   */
  async metricFindQuery(query: string | DynamoDBVariableQuery, options?: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    // Handle both string and object query formats
    let queryString: string;
    if (typeof query === 'string') {
      queryString = query;
    } else {
      queryString = query.query || '';
    }

    if (!queryString) {
      return Promise.resolve([]);
    }

    // Replace template variables in the query
    const interpolatedQuery = getTemplateSrv().replace(queryString, options?.scopedVars);
    
    console.log('Variable query:', { original: query, interpolated: interpolatedQuery });

    try {
      // Create a DynamoDB query for the variable
      const dynamoQuery: DynamoDBQuery =
        this.variables instanceof DynamoDBVariableSupport
          ? this.variables.toDataQuery({ refId: 'variable-query', query: interpolatedQuery })
          : {
              queryText: interpolatedQuery,
              datetimeAttributes: [],
              customFilters: [],
              refId: 'variable-query',
              datasource: this.getRef(),
            };

      // Execute the query using the backend
      const request: DataQueryRequest<DynamoDBQuery> = {
        targets: [dynamoQuery],
        range: options?.range || { from: 'now-1h', to: 'now', raw: { from: 'now-1h', to: 'now' } } as any,
        scopedVars: options?.scopedVars || {},
        timezone: 'browser',
        app: CoreApp.Dashboard,
        requestId: 'variable-query',
        interval: '1m',
        intervalMs: 60000,
        maxDataPoints: 1000,
        startTime: Date.now(),
      };

      // Execute the query
      const response = await lastValueFrom(this.query(request));
      
      if (!response?.data || response.data.length === 0) {
        return [];
      }

      // Transform the response to MetricFindValue format
      const frame = response.data[0];
      const results: MetricFindValue[] = [];

      if (frame.fields && frame.fields.length > 0) {
        const field = frame.fields[0]; // Use the first field for variable values
        
        if (field.values) {
          for (let i = 0; i < field.values.length; i++) {
            const value = field.values.get(i);
            if (value !== null && value !== undefined) {
              results.push({
                text: String(value),
                value: String(value),
              });
            }
          }
        }
      }

      console.log('Variable query results:', results);
      return results;
    } catch (error) {
      console.error('Error executing variable query:', error);
      return [];
    }
  }
}

class DynamoDBVariableSupport extends StandardVariableSupport<DataSource, DynamoDBQuery, DynamoDBDataSourceOptions> {
  constructor(private readonly datasource: DataSource) {
    super();
  }

  getDefaultQuery(): Partial<DynamoDBQuery> {
    return {
      queryText: DEFAULT_QUERY.queryText ?? "",
    };
  }

  toDataQuery(query: StandardVariableQuery): DynamoDBQuery {
    return {
      refId: query.refId ?? "variable-query",
      datasource: this.datasource.getRef(),
      queryText: query.query ?? "",
      datetimeAttributes: [],
      customFilters: [],
    };
  }

  query(request: DataQueryRequest<DynamoDBQuery>): Observable<DataQueryResponse> {
    return this.datasource.query(request);
  }
}
