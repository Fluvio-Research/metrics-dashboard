# DynamoDB Pagination Fix

## Issue
The DynamoDB datasource plugin was hitting the maximum payload transfer limit when querying large datasets. DynamoDB returns a `NextToken` when query results exceed the response size limit, but the plugin was not handling this continuation token to fetch the remaining data.

## Solution
Implemented pagination logic in the backend Go code to iteratively fetch all query results by:

1. **Checking for NextToken**: After each query execution, check if a `NextToken` is present in the response
2. **Iterative Fetching**: When a `NextToken` exists, make subsequent queries using it as `ExclusiveStartKey`
3. **Result Accumulation**: Append items from each page to the accumulated results
4. **Complete Dataset**: Continue until no more `NextToken` is returned

## Changes Made

### File: `Plugins/haohanyang-dynamodb-datasource-dev/pkg/plugin/datasource.go`

Modified the `query()` function (lines 107-176) to implement pagination:

```go
// Collect all items by handling pagination with NextToken
var allItems []map[string]*dynamodb.AttributeValue
var pageCount int

for {
    pageCount++
    backend.Logger.Debug("Fetching page", "page", pageCount)

    output, err := dynamoDBClient.ExecuteStatementWithContext(ctx, input)
    if err != nil {
        return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("executes statement: %v", err.Error()))
    }

    // Append items from this page to the accumulated results
    allItems = append(allItems, output.Items...)

    backend.Logger.Debug("Page results", "page", pageCount, "itemsInPage", len(output.Items), "totalItems", len(allItems))

    // Check if there are more results to fetch
    if output.NextToken == nil || *output.NextToken == "" {
        backend.Logger.Info("Query complete", "totalPages", pageCount, "totalItems", len(allItems))
        break
    }

    // Set the NextToken for the next iteration
    input.NextToken = output.NextToken
    backend.Logger.Debug("More results available, fetching next page", "nextToken", *output.NextToken)
}

// Create a combined output with all accumulated items
combinedOutput := &dynamodb.ExecuteStatementOutput{
    Items: allItems,
}
```

## Testing

### How to Test the Fix

1. **Start Grafana**:
   ```bash
   ./dev.sh start
   ```

2. **Access Grafana**: Navigate to http://localhost:3000 (admin/admin)

3. **Configure DynamoDB Datasource**: If not already configured, add your AWS credentials

4. **Create a Test Query**: Query a table with a large dataset (e.g., > 1MB response size)
   ```sql
   SELECT * FROM "YourTable" WHERE "timestamp" BETWEEN $from AND $to
   ```

5. **Test Different Limits**:
   - Set Limit to 200 - should return 200 records
   - Set Limit to 11,000 - should return 11,000 records (previously would stop at ~1MB)
   - Set Limit to 50,000 - should return all records up to 50,000 (previously would stop at first page)

6. **Verify Complete Data**: Check the visualization to ensure all expected records are displayed, not just the first page

### Expected Behavior

**Before Fix:**
- Queries would return incomplete datasets when results exceeded DynamoDB's payload size limit
- No matter how high the limit was set, only the first page (up to ~1MB) would be returned

**After Fix:**
- All query results are returned, regardless of size
- Multiple pages are automatically fetched and combined
- Logs show pagination progress (page count, items per page, total items)

### Monitoring Logs

To see pagination in action, monitor the Grafana logs:
```bash
./dev.sh logs
```

Look for log entries like:
```
level=debug msg="Fetching page" page=1
level=debug msg="Page results" page=1 itemsInPage=1000 totalItems=1000
level=debug msg="More results available, fetching next page" nextToken=...
level=debug msg="Fetching page" page=2
level=debug msg="Page results" page=2 itemsInPage=1000 totalItems=2000
level=info msg="Query complete" totalPages=5 totalItems=4850
```

## Build Information

- **Plugin**: haohanyang-dynamodb-datasource-dev (fluvio-connect-dynamodb)
- **Version**: 0.1.0
- **Built**: October 8, 2025
- **Location**: `/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/data/plugins/haohanyang-dynamodb-datasource-dev/`

## Performance Considerations

- **Memory**: Accumulates all results in memory before returning. For extremely large datasets (millions of records), this could consume significant memory.
- **Time**: Multiple API calls are made, so queries with many pages will take longer to complete.
- **Best Practice**: Use appropriate `LIMIT` clauses in your PartiQL queries to fetch only the data you need.

## Related Files

- Backend: `Plugins/haohanyang-dynamodb-datasource-dev/pkg/plugin/datasource.go`
- Frontend: `Plugins/haohanyang-dynamodb-datasource-dev/src/datasource.ts`
- Build Script: `Plugins/haohanyang-dynamodb-datasource-dev/Magefile.go`

## Next Steps

1. Start Grafana: `./dev.sh start`
2. Test with your Water Level Updates dashboard
3. Verify that all records are now showing in the time series visualization
4. Check logs to confirm pagination is working correctly

## Troubleshooting

If the fix doesn't work:

1. **Verify plugin is loaded**: Check Grafana logs for plugin loading errors
2. **Clear browser cache**: Force refresh the dashboard (Cmd+Shift+R on Mac)
3. **Restart Grafana**: `./dev.sh restart`
4. **Check logs**: `./dev.sh logs` for any error messages
5. **Rebuild plugin**: 
   ```bash
   cd Plugins/haohanyang-dynamodb-datasource-dev
   mage -v
   npm run build
   cd ../..
   rsync -av --delete Plugins/haohanyang-dynamodb-datasource-dev/dist/ data/plugins/haohanyang-dynamodb-datasource-dev/
   ./dev.sh restart
   ```
