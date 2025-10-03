import { DataSourceInstanceSettings, CoreApp, ScopedVars, DataQueryRequest, DataQueryResponse } from "@grafana/data";
import { DataSourceWithBackend, getTemplateSrv } from "@grafana/runtime";
import { Observable } from "rxjs";
import { DynamoDBQuery, DynamoDBDataSourceOptions, DEFAULT_QUERY, DatetimeFormat } from "./types";
import { formatRefTime } from "./utils";

export class DataSource extends DataSourceWithBackend<DynamoDBQuery, DynamoDBDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<DynamoDBDataSourceOptions>) {
    super(instanceSettings);
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
    const fromTime = Math.floor(request.range.from.toDate().getTime() / 1000);
    const toTime = Math.floor(request.range.to.toDate().getTime() / 1000);
    
    console.log('Time range debug:', { fromTime, toTime, from: request.range.from.toDate(), to: request.range.to.toDate() });
    
    const queries = request.targets.map((query) => {
      let processedQuery = query.queryText || "";
      
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
          if (field.format !== DatetimeFormat.UnixTimestampSeconds && field.format !== DatetimeFormat.UnixTimestampMiniseconds) {
            return { ...field, format: formatRefTime(field.format) };
          }
          return field;
        })
      };
    });
    return super.query({ ...request, targets: queries });
  }
}
