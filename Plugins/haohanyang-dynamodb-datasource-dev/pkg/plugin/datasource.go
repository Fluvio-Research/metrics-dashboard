package plugin

import (
	"context"
	"encoding/json"
	"fmt"

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
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
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

	input := &dynamodb.ExecuteStatementInput{
		Statement: aws.String(qm.QueryText),
	}

	if qm.Limit > 0 {
		input.Limit = aws.Int64(qm.Limit)
	}

	backend.Logger.Info("Executing PartiQL query", "statement", qm.QueryText, "limit", qm.Limit)

	// Safety limits to prevent infinite loops and memory exhaustion
	const maxPages = 1000    // Maximum number of pages to fetch
	const maxItems = 1000000 // Maximum total items to accumulate (1 million)

	// Collect all items by handling pagination with NextToken
	var allItems []map[string]*dynamodb.AttributeValue
	var pageCount int

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
