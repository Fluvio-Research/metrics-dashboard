package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/grafana/grafana-aws-sdk/pkg/awsds"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces - only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ backend.CallResourceHandler   = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

var (
	fromClauseWithIndexQuoted    = regexp.MustCompile(`(?i)FROM\s+"([^"]+)"\s+INDEX\s+"([^"]+)"`)
	fromClauseQuoted             = regexp.MustCompile(`(?i)FROM\s+"([^"]+)"`)
	fromClauseWithIndexUnquoted  = regexp.MustCompile(`(?i)FROM\s+([^\s"]+)\s+INDEX\s+([^\s"]+)`)
	fromClauseUnquoted           = regexp.MustCompile(`(?i)FROM\s+([^\s";]+)`)
	partitionKeyOperatorDetector = func(partitionKey string) *regexp.Regexp {
		escaped := regexp.QuoteMeta(partitionKey)
		pattern := fmt.Sprintf(`(?i)(?:"%s"|%s)\s*(=|IN|BETWEEN|<>|!=|<=|>=|<|>)`, escaped, escaped)
		return regexp.MustCompile(pattern)
	}
)

// NewDatasource creates a new datasource instance.
func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	dsSetting := awsds.AWSDatasourceSettings{}
	err := dsSetting.Load(settings)
	if err != nil {
		backend.Logger.Error("failed to load settings", err.Error())
		return nil, err
	}

	authSettings := awsds.ReadAuthSettings(ctx)
	sessionCache := awsds.NewSessionCache()

	return &Datasource{
		Settings:     dsSetting,
		authSettings: *authSettings,
		sessionCache: sessionCache,
	}, nil
}

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
	Settings     awsds.AWSDatasourceSettings
	sessionCache *awsds.SessionCache
	authSettings awsds.AuthSettings
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
}

func (d *Datasource) getDynamoDBClient(ctx context.Context, settings *backend.DataSourceInstanceSettings) (*dynamodb.DynamoDB, error) {
	httpClientProvider := httpclient.NewProvider()
	httpClientOptions, err := settings.HTTPClientOptions(ctx)
	if err != nil {
		backend.Logger.Error("failed to create http client options", err.Error())
		return nil, err
	}

	httpClient, err := httpClientProvider.New(httpClientOptions)
	if err != nil {
		backend.Logger.Error("failed to create http client", err.Error())
		return nil, err
	}

	session, err := d.sessionCache.GetSessionWithAuthSettings(awsds.GetSessionConfig{
		Settings:      d.Settings,
		HTTPClient:    httpClient,
		UserAgentName: aws.String("DynamoDB"),
	}, d.authSettings)

	if err != nil {
		return nil, err
	}

	return dynamodb.New(session), nil
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()
	dynamoDBClient, err := d.getDynamoDBClient(ctx, req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		return nil, err
	}

	for _, q := range req.Queries {
		res := d.query(ctx, dynamoDBClient, q)
		response.Responses[q.RefID] = res
	}

	return response, nil
}

func (d *Datasource) query(ctx context.Context, dynamoDBClient *dynamodb.DynamoDB, query backend.DataQuery) backend.DataResponse {
	var response backend.DataResponse

	var qm QueryModel

	err := json.Unmarshal(query.JSON, &qm)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err.Error()))
	}

	backend.Logger.Debug("Query model", qm)

	// Validate query text is not empty
	if qm.QueryText == "" {
		return backend.ErrDataResponse(backend.StatusBadRequest, "query text cannot be empty")
	}

	// Modify query to add ORDER BY if ScanIndexForward is set and no ORDER BY exists
	finalQuery := qm.QueryText
	nativeSortApplied := false
	nativeSortField := ""
	if qm.ScanIndexForward != nil {
		finalQuery, nativeSortApplied, nativeSortField = d.prepareNativeOrderBy(ctx, dynamoDBClient, qm)
	}

	input := &dynamodb.ExecuteStatementInput{
		Statement: aws.String(finalQuery),
	}

	if qm.Limit > 0 {
		input.Limit = aws.Int64(qm.Limit)
	}

	backend.Logger.Info("Executing PartiQL query", "statement", finalQuery, "limit", qm.Limit, "scanIndexForward", qm.ScanIndexForward, "nativeSortApplied", nativeSortApplied)

	// Safety limits to prevent infinite loops and memory exhaustion
	const maxPages = 1000                // Maximum number of pages to fetch (secondary guard)
	const maxItems = 1000000             // Maximum total items to accumulate (1 million)
	const maxQueryDuration = time.Minute // Time-based guard for long-running pagination

	// Collect all items by handling pagination with NextToken
	var allItems []map[string]*dynamodb.AttributeValue
	var pageCount int
	startTime := time.Now()

	for {
		// Check if context is cancelled (timeout or user cancelled)
		select {
		case <-ctx.Done():
			backend.Logger.Warn("Query cancelled or timed out", "pageCount", pageCount, "itemsFetched", len(allItems))
			// Return partial results if we have any
			if len(allItems) > 0 {
				backend.Logger.Info("Returning partial results due to cancellation", "totalItems", len(allItems))
				break
			}
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("query cancelled: %v", ctx.Err()))
		default:
			// Continue with query execution
		}

		pageCount++

		// Time-based guard to prevent long-running loops
		if time.Since(startTime) > maxQueryDuration {
			backend.Logger.Warn("Maximum query duration reached", "maxQueryDuration", maxQueryDuration, "pagesFetched", pageCount, "itemsFetched", len(allItems))
			if len(allItems) > 0 {
				backend.Logger.Info("Returning partial results due to duration limit", "totalItems", len(allItems))
				break
			}
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("query exceeded maximum duration of %s", maxQueryDuration))
		}

		// Safety check: prevent infinite loops
		if pageCount > maxPages {
			backend.Logger.Error("Maximum page limit reached", "maxPages", maxPages, "totalItems", len(allItems))
			// Return partial results with warning
			if len(allItems) > 0 {
				backend.Logger.Warn("Returning partial results due to page limit", "totalItems", len(allItems))
				break
			}
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("query exceeded maximum page limit of %d", maxPages))
		}

		backend.Logger.Debug("Fetching page", "page", pageCount)

		output, err := dynamoDBClient.ExecuteStatementWithContext(ctx, input)
		if err != nil {
			backend.Logger.Error("Query execution error", "error", err.Error(), "page", pageCount)
			// Return partial results if we have any data from previous pages
			if len(allItems) > 0 {
				backend.Logger.Warn("Returning partial results due to error", "totalItems", len(allItems))
				break
			}
			return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("executes statement: %v", err.Error()))
		}

		// Append items from this page to the accumulated results
		allItems = append(allItems, output.Items...)

		backend.Logger.Debug("Page results", "page", pageCount, "itemsInPage", len(output.Items), "totalItems", len(allItems))

		// Safety check: prevent memory exhaustion
		if len(allItems) >= maxItems {
			backend.Logger.Warn("Maximum item limit reached", "maxItems", maxItems, "totalItems", len(allItems))
			backend.Logger.Info("Returning results (item limit reached)", "totalItems", len(allItems))
			break
		}

		// Check if we've reached the user's requested limit
		if qm.Limit > 0 && int64(len(allItems)) >= qm.Limit {
			backend.Logger.Info("Reached user's requested limit", "limit", qm.Limit, "totalItems", len(allItems))
			break
		}

		// Check if there are more results to fetch
		if output.NextToken == nil || *output.NextToken == "" {
			backend.Logger.Info("Query complete", "totalPages", pageCount, "totalItems", len(allItems))
			break
		}

		// Set the NextToken for the next iteration
		input.NextToken = output.NextToken
		backend.Logger.Debug("More results available, fetching next page", "nextToken", *output.NextToken)
	}

	// Handle empty results
	if len(allItems) == 0 {
		backend.Logger.Debug("Query returned no results")
		// Return empty frame instead of error
		frame := data.NewFrame(query.RefID)
		response.Frames = append(response.Frames, frame)
		return response
	}

	clientSortApplied := false
	if len(allItems) > 1 && qm.SortBy != "" {
		backend.Logger.Info("Applying client-side sort (explicit sortBy)", "field", qm.SortBy, "direction", qm.SortDirection)
		sortItems(allItems, qm.SortBy, qm.SortDirection)
		clientSortApplied = true
	}

	if len(allItems) > 1 && !clientSortApplied && !nativeSortApplied {
		direction := "asc"
		if qm.ScanIndexForward != nil && !*qm.ScanIndexForward {
			direction = "desc"
		}

		if nativeSortField != "" {
			backend.Logger.Info("Applying client-side sort (native sort fallback)", "field", nativeSortField, "direction", direction)
			sortItems(allItems, nativeSortField, direction)
			clientSortApplied = true
		}
	}

	if len(allItems) > 1 && !clientSortApplied && qm.ScanIndexForward != nil && !nativeSortApplied {
		// Fallback: if ScanIndexForward was set but ORDER BY wasn't added (e.g., missing partition key equality),
		// apply heuristics on common timestamp fields
		direction := "asc"
		if !*qm.ScanIndexForward {
			direction = "desc"
		}

		sortKeyFields := []string{"timestamp", "created_at", "createdAt", "date", "time"}
		for _, field := range sortKeyFields {
			if len(allItems) > 0 && allItems[0][field] != nil {
				backend.Logger.Info("Applying client-side sort (heuristic fallback)", "field", field, "direction", direction)
				sortItems(allItems, field, direction)
				clientSortApplied = true
				break
			}
		}
	}

	// Enforce user's limit on the final results
	// This is critical because DynamoDB's Limit parameter only limits examined items,
	// not the items returned after filtering
	if qm.Limit > 0 && int64(len(allItems)) > qm.Limit {
		backend.Logger.Info("Trimming results to user's limit", "before", len(allItems), "after", qm.Limit)
		allItems = allItems[:qm.Limit]
	}

	// Create a combined output with all accumulated items
	combinedOutput := &dynamodb.ExecuteStatementOutput{
		Items: allItems,
	}

	datetimeAttributes := make(map[string]string)
	for _, k := range qm.DatetimeAttributes {
		datetimeAttributes[k.Name] = k.Format
	}

	frame, err := QueryResultToDataFrame(query.RefID, combinedOutput, datetimeAttributes)
	if err != nil {
		response.Error = err
		return response
	}

	response.Frames = append(response.Frames, frame)
	return response
}

// prepareNativeOrderBy attempts to inject a DynamoDB-native ORDER BY clause when possible.
// It returns the potentially modified query string, whether native sorting was applied,
// and the field that should be used for client-side fallback sorting if needed.
func (d *Datasource) prepareNativeOrderBy(ctx context.Context, dynamoDBClient *dynamodb.DynamoDB, qm QueryModel) (string, bool, string) {
	query := qm.QueryText

	// If query already includes ORDER BY, treat native sorting as handled manually.
	if strings.Contains(strings.ToUpper(query), "ORDER BY") {
		backend.Logger.Debug("Query already contains ORDER BY clause, skipping injection")
		return query, true, strings.TrimSpace(qm.SortKey)
	}

	tableName, indexName := extractTableAndIndex(query)
	if tableName == "" {
		backend.Logger.Warn("Native sort requested but table name could not be determined from query")
		return query, false, strings.TrimSpace(qm.SortKey)
	}

	schema, err := getKeySchema(ctx, dynamoDBClient, tableName, indexName)
	if err != nil {
		backend.Logger.Warn("Failed to describe table for native sort", "table", tableName, "index", indexName, "error", err.Error())
		return query, false, strings.TrimSpace(qm.SortKey)
	}

	requestedSortKey := strings.TrimSpace(qm.SortKey)
	nativeSortField := requestedSortKey
	if nativeSortField == "" {
		nativeSortField = schema.SortKey
	}

	if schema.SortKey == "" {
		backend.Logger.Warn("Native sort requested but table/index has no sort key", "table", tableName, "index", indexName)
		return query, false, nativeSortField
	}

	if requestedSortKey != "" && !strings.EqualFold(requestedSortKey, schema.SortKey) {
		backend.Logger.Warn("Requested sort key is not part of the primary key for native sort", "requested", requestedSortKey, "schemaSortKey", schema.SortKey)
		return query, false, nativeSortField
	}

	if schema.PartitionKey == "" {
		backend.Logger.Warn("Unable to determine partition key for native sort", "table", tableName, "index", indexName)
		return query, false, nativeSortField
	}

	if !partitionKeyHasEquality(query, schema.PartitionKey) {
		backend.Logger.Warn("Cannot apply native ORDER BY without partition key equality", "partitionKey", schema.PartitionKey)
		return query, false, nativeSortField
	}

	modifiedQuery, injected := injectOrderByClause(query, qm.ScanIndexForward, schema.SortKey)
	if injected {
		return modifiedQuery, true, schema.SortKey
	}

	return query, false, nativeSortField
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	backend.Logger.Debug("Checking health")
	res := &backend.CheckHealthResult{}

	client, err := d.getDynamoDBClient(ctx, req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		res.Status = backend.HealthStatusError
		res.Message = err.Error()
		return res, nil
	}

	extraSettings, err := loadExtraPluginSettings(*req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		res.Status = backend.HealthStatusError
		res.Message = err.Error()
		return res, err
	}

	_, err = client.DescribeTableWithContext(ctx, &dynamodb.DescribeTableInput{
		TableName: aws.String(extraSettings.ConnectionTestTable),
	})

	if err != nil {
		res.Status = backend.HealthStatusError
		res.Message = err.Error()
		return res, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Successfully connects to DynamoDB",
	}, nil
}

// CallResource handles custom resource calls from the frontend
func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	backend.Logger.Debug("CallResource", "path", req.Path, "method", req.Method)

	switch req.Path {
	case "tables":
		return d.handleListTables(ctx, req, sender)
	case "table-attributes":
		return d.handleTableAttributes(ctx, req, sender)
	case "upload/presets", "upload/preview", "upload/execute", "upload/schema":
		return d.handleUploadResource(ctx, req, sender)
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
			Body:   []byte(`{"error": "endpoint not found"}`),
		})
	}
}

// handleListTables returns a list of DynamoDB tables
func (d *Datasource) handleListTables(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	client, err := d.getDynamoDBClient(ctx, req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		backend.Logger.Error("Failed to get DynamoDB client", "error", err.Error())
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to get client: %s"}`, err.Error())),
		})
	}

	// List all tables (with pagination support)
	var tableNames []string
	var lastEvaluatedTableName *string

	for {
		input := &dynamodb.ListTablesInput{
			Limit: aws.Int64(100), // Fetch 100 tables per page
		}
		if lastEvaluatedTableName != nil {
			input.ExclusiveStartTableName = lastEvaluatedTableName
		}

		output, err := client.ListTablesWithContext(ctx, input)
		if err != nil {
			backend.Logger.Error("Failed to list tables", "error", err.Error())
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusInternalServerError,
				Body:   []byte(fmt.Sprintf(`{"error": "failed to list tables: %s"}`, err.Error())),
			})
		}

		// Convert []*string to []string
		for _, tableName := range output.TableNames {
			if tableName != nil {
				tableNames = append(tableNames, *tableName)
			}
		}

		// Check if there are more tables to fetch
		if output.LastEvaluatedTableName == nil {
			break
		}
		lastEvaluatedTableName = output.LastEvaluatedTableName
	}

	backend.Logger.Info("Listed tables", "count", len(tableNames))

	// Return as JSON
	response := struct {
		Tables []string `json:"tables"`
	}{
		Tables: tableNames,
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to marshal response: %s"}`, err.Error())),
		})
	}

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   responseJSON,
	})
}

// handleTableAttributes returns the attributes (column names) for a specific DynamoDB table
func (d *Datasource) handleTableAttributes(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	// Parse URL to get query parameters
	parsedURL, err := url.Parse(req.URL)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(`{"error": "invalid URL"}`),
		})
	}

	// Get table name from query parameter
	tableName := parsedURL.Query().Get("table")
	if tableName == "" {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusBadRequest,
			Body:   []byte(`{"error": "table parameter is required"}`),
		})
	}

	client, err := d.getDynamoDBClient(ctx, req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		backend.Logger.Error("Failed to get DynamoDB client", "error", err.Error())
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to get client: %s"}`, err.Error())),
		})
	}

	// Describe the table to get its schema
	describeInput := &dynamodb.DescribeTableInput{
		TableName: aws.String(tableName),
	}

	describeOutput, err := client.DescribeTableWithContext(ctx, describeInput)
	if err != nil {
		backend.Logger.Error("Failed to describe table", "table", tableName, "error", err.Error())
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to describe table: %s"}`, err.Error())),
		})
	}

	// Extract attribute names from table schema
	var attributes []string

	// Add key schema attributes (partition key and sort key)
	for _, keyElement := range describeOutput.Table.KeySchema {
		if keyElement.AttributeName != nil {
			attributes = append(attributes, *keyElement.AttributeName)
		}
	}

	// Add other attributes from attribute definitions
	for _, attrDef := range describeOutput.Table.AttributeDefinitions {
		if attrDef.AttributeName != nil {
			// Avoid duplicates (key attributes are already added)
			found := false
			for _, existing := range attributes {
				if existing == *attrDef.AttributeName {
					found = true
					break
				}
			}
			if !found {
				attributes = append(attributes, *attrDef.AttributeName)
			}
		}
	}

	// Also scan a few items to discover additional attributes not in the schema
	// (DynamoDB is schemaless, so items can have attributes not defined in key schema)
	scanInput := &dynamodb.ScanInput{
		TableName: aws.String(tableName),
		Limit:     aws.Int64(5), // Just scan a few items to discover attributes
	}

	scanOutput, err := client.ScanWithContext(ctx, scanInput)
	if err == nil && len(scanOutput.Items) > 0 {
		// Extract attribute names from actual items
		attributeSet := make(map[string]bool)

		// Add existing attributes to set
		for _, attr := range attributes {
			attributeSet[attr] = true
		}

		// Discover new attributes from items
		for _, item := range scanOutput.Items {
			for attrName := range item {
				if !attributeSet[attrName] {
					attributes = append(attributes, attrName)
					attributeSet[attrName] = true
				}
			}
		}
	}

	backend.Logger.Info("Discovered table attributes", "table", tableName, "attributes", attributes)

	// Return as JSON
	response := struct {
		Attributes []string `json:"attributes"`
	}{
		Attributes: attributes,
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fmt.Sprintf(`{"error": "failed to marshal response: %s"}`, err.Error())),
		})
	}

	return sender.Send(&backend.CallResourceResponse{
		Status: http.StatusOK,
		Body:   responseJSON,
	})
}

// sortItems sorts DynamoDB items by a specified field
// Works with any field type (string, number, boolean)
func sortItems(items []map[string]*dynamodb.AttributeValue, sortBy string, sortDirection string) {
	if sortBy == "" || len(items) == 0 {
		return
	}

	descending := sortDirection == "desc"

	// Use stable sort to maintain order for equal elements
	backend.Logger.Debug("Sorting items", "field", sortBy, "direction", sortDirection, "count", len(items))

	// Define comparison function
	less := func(i, j int) bool {
		valI := items[i][sortBy]
		valJ := items[j][sortBy]

		// Handle nil values - put them at the end
		if valI == nil && valJ == nil {
			return false
		}
		if valI == nil {
			return false // nil goes to end
		}
		if valJ == nil {
			return true // non-nil comes before nil
		}

		// Compare based on DynamoDB attribute type
		var cmp int

		// String comparison
		if valI.S != nil && valJ.S != nil {
			if *valI.S < *valJ.S {
				cmp = -1
			} else if *valI.S > *valJ.S {
				cmp = 1
			} else {
				cmp = 0
			}
		} else if valI.N != nil && valJ.N != nil {
			// Number comparison - parse as float64
			numI, errI := parseFloat(*valI.N)
			numJ, errJ := parseFloat(*valJ.N)
			if errI == nil && errJ == nil {
				if numI < numJ {
					cmp = -1
				} else if numI > numJ {
					cmp = 1
				} else {
					cmp = 0
				}
			} else {
				// Fallback to string comparison if parse fails
				if *valI.N < *valJ.N {
					cmp = -1
				} else if *valI.N > *valJ.N {
					cmp = 1
				} else {
					cmp = 0
				}
			}
		} else if valI.BOOL != nil && valJ.BOOL != nil {
			// Boolean comparison - false < true
			if !*valI.BOOL && *valJ.BOOL {
				cmp = -1
			} else if *valI.BOOL && !*valJ.BOOL {
				cmp = 1
			} else {
				cmp = 0
			}
		} else {
			// Mixed types or unsupported types - no ordering
			return false
		}

		if descending {
			return cmp > 0
		}
		return cmp < 0
	}

	// Use Go's sort.SliceStable for stable sorting
	sortSliceStable(items, less)
}

// Helper function for stable sorting
func sortSliceStable(items []map[string]*dynamodb.AttributeValue, less func(i, j int) bool) {
	n := len(items)
	for i := 1; i < n; i++ {
		for j := i; j > 0 && less(j, j-1); j-- {
			items[j], items[j-1] = items[j-1], items[j]
		}
	}
}

// reverseItems reverses the order of items in place
// Used for ScanIndexForward=false to mimic DynamoDB Query API behavior
func reverseItems(items []map[string]*dynamodb.AttributeValue) {
	for i, j := 0, len(items)-1; i < j; i, j = i+1, j-1 {
		items[i], items[j] = items[j], items[i]
	}
}

// Helper to parse float from string
func parseFloat(s string) (float64, error) {
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	return f, err
}

type keySchemaInfo struct {
	PartitionKey string
	SortKey      string
}

func getKeySchema(ctx context.Context, client *dynamodb.DynamoDB, tableName, indexName string) (*keySchemaInfo, error) {
	output, err := client.DescribeTableWithContext(ctx, &dynamodb.DescribeTableInput{
		TableName: aws.String(tableName),
	})
	if err != nil {
		return nil, err
	}

	if output == nil || output.Table == nil {
		return nil, fmt.Errorf("table description not available for %s", tableName)
	}

	schema := &keySchemaInfo{}
	var keyElements []*dynamodb.KeySchemaElement

	if indexName == "" {
		keyElements = output.Table.KeySchema
	} else {
		found := false
		if output.Table.GlobalSecondaryIndexes != nil {
			for _, gsi := range output.Table.GlobalSecondaryIndexes {
				if gsi != nil && gsi.IndexName != nil && strings.EqualFold(*gsi.IndexName, indexName) {
					keyElements = gsi.KeySchema
					indexName = *gsi.IndexName
					found = true
					break
				}
			}
		}
		if !found && output.Table.LocalSecondaryIndexes != nil {
			for _, lsi := range output.Table.LocalSecondaryIndexes {
				if lsi != nil && lsi.IndexName != nil && strings.EqualFold(*lsi.IndexName, indexName) {
					keyElements = lsi.KeySchema
					indexName = *lsi.IndexName
					found = true
					break
				}
			}
		}
		if !found {
			return nil, fmt.Errorf("index %s not found on table %s", indexName, tableName)
		}
	}

	for _, elem := range keyElements {
		if elem == nil {
			continue
		}
		attrName := aws.StringValue(elem.AttributeName)
		switch aws.StringValue(elem.KeyType) {
		case dynamodb.KeyTypeHash:
			schema.PartitionKey = attrName
		case dynamodb.KeyTypeRange:
			schema.SortKey = attrName
		}
	}

	return schema, nil
}

func extractTableAndIndex(query string) (string, string) {
	if matches := fromClauseWithIndexQuoted.FindStringSubmatch(query); len(matches) == 3 {
		return matches[1], matches[2]
	}
	if matches := fromClauseQuoted.FindStringSubmatch(query); len(matches) == 2 {
		return matches[1], ""
	}
	if matches := fromClauseWithIndexUnquoted.FindStringSubmatch(query); len(matches) == 3 {
		return strings.Trim(matches[1], `"'`), strings.Trim(matches[2], `"'`)
	}
	if matches := fromClauseUnquoted.FindStringSubmatch(query); len(matches) >= 2 {
		return strings.Trim(matches[1], `"'`), ""
	}
	return "", ""
}

func partitionKeyHasEquality(query, partitionKey string) bool {
	if partitionKey == "" {
		return false
	}
	re := partitionKeyOperatorDetector(partitionKey)
	matches := re.FindStringSubmatch(query)
	if len(matches) < 2 {
		return false
	}
	operator := strings.TrimSpace(matches[1])
	return strings.EqualFold(operator, "=")
}

func quoteIdentifier(identifier string) string {
	if identifier == "" {
		return ""
	}
	escaped := strings.ReplaceAll(identifier, `"`, `""`)
	return fmt.Sprintf(`"%s"`, escaped)
}

// injectOrderByClause adds ORDER BY to PartiQL query for server-side sorting
// This mimics DynamoDB's native Query API ScanIndexForward parameter
// Note: DynamoDB requires a WHERE clause when using ORDER BY (can only sort within a partition)
func injectOrderByClause(query string, scanIndexForward *bool, sortKey string) (string, bool) {
	if scanIndexForward == nil || sortKey == "" {
		return query, false
	}

	queryUpper := strings.ToUpper(query)

	// Check if ORDER BY already exists (case-insensitive)
	if strings.Contains(queryUpper, "ORDER BY") {
		backend.Logger.Debug("Query already contains ORDER BY, skipping injection")
		return query, true
	}

	// DynamoDB requires WHERE clause when using ORDER BY
	if !strings.Contains(queryUpper, "WHERE") {
		backend.Logger.Warn("Cannot add ORDER BY without WHERE clause - DynamoDB requires partition key equality in WHERE for ORDER BY. Using client-side sorting.")
		return query, false
	}

	// Determine sort direction
	direction := "ASC"
	if !*scanIndexForward {
		direction = "DESC"
	}

	// Add ORDER BY clause before any trailing semicolon
	trimmedQuery := strings.TrimSpace(query)
	trimmedQuery = strings.TrimSuffix(trimmedQuery, ";")

	sortFieldQuoted := quoteIdentifier(sortKey)
	modifiedQuery := fmt.Sprintf("%s ORDER BY %s %s", trimmedQuery, sortFieldQuoted, direction)

	backend.Logger.Info("Injected ORDER BY clause", "field", sortFieldQuoted, "direction", direction, "originalQuery", query, "modifiedQuery", modifiedQuery)

	return modifiedQuery, true
}
