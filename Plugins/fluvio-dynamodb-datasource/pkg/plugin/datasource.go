package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// DataSource holds AWS client and settings
type DataSource struct {
	cfg    FluvioSettings
	client *dynamodb.DynamoDB
}

type FluvioSettings struct {
	Region       string
	Endpoint     string
	AccessKey    string
	SecretKey    string
	SessionToken string // Kept for backwards compatibility but not recommended
}

// NewDatasource creates a new datasource instance
func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	// Unmarshal jsonData and secureJsonData
	var opt FluvioSettings
	if err := json.Unmarshal(settings.JSONData, &opt); err != nil {
		return nil, fmt.Errorf("could not unmarshal JSONData: %w", err)
	}
	if v, ok := settings.DecryptedSecureJSONData["accessKey"]; ok {
		opt.AccessKey = v
	}
	if v, ok := settings.DecryptedSecureJSONData["secretKey"]; ok {
		opt.SecretKey = v
	}
	if v, ok := settings.DecryptedSecureJSONData["sessionToken"]; ok {
		opt.SessionToken = v
	}

	// Normalize whitespace to avoid subtle credential mismatches when users paste values
	opt.AccessKey = strings.TrimSpace(opt.AccessKey)
	opt.SecretKey = strings.TrimSpace(opt.SecretKey)
	opt.SessionToken = strings.TrimSpace(opt.SessionToken)

	// Validate required fields
	if opt.Region == "" {
		return nil, fmt.Errorf("AWS Region is required. Please configure the region in the data source settings")
	}

	backend.Logger.Info("Creating DynamoDB datasource", "region", opt.Region, "endpoint", opt.Endpoint)

	// Create AWS config
	awsConfig := &aws.Config{
		Region: aws.String(opt.Region),
	}

	// Set custom endpoint if provided
	if opt.Endpoint != "" {
		awsConfig.Endpoint = aws.String(opt.Endpoint)
	}

	// Set credentials if provided (optimized for permanent credentials)
	if opt.AccessKey != "" && opt.SecretKey != "" {
		credentialType := "permanent"
		hasSessionToken := opt.SessionToken != ""
		accessKeyPrefix := ""
		if len(opt.AccessKey) >= 4 {
			accessKeyPrefix = opt.AccessKey[:4]
		}

		// Detect credential flavour and guard against stale session tokens being reused
		if strings.HasPrefix(opt.AccessKey, "ASIA") {
			credentialType = "temporary"
			if opt.SessionToken == "" {
				return nil, fmt.Errorf("temporary AWS credentials require a session token. Either provide the session token or switch to long-term IAM credentials")
			}
		} else {
			if opt.SessionToken != "" {
				backend.Logger.Warn("Ignoring saved session token for permanent credentials", "accessKeyPrefix", accessKeyPrefix)
				opt.SessionToken = ""
				hasSessionToken = false
			}
		}

		awsConfig.Credentials = credentials.NewStaticCredentials(
			opt.AccessKey,
			opt.SecretKey,
			opt.SessionToken,
		)

		logArgs := []interface{}{"credentialType", credentialType, "hasSessionToken", hasSessionToken}
		if accessKeyPrefix != "" {
			logArgs = append(logArgs, "accessKeyPrefix", accessKeyPrefix)
		}
		backend.Logger.Info("Configured AWS credentials", logArgs...)
	} else {
		// Use environment credentials as fallback
		awsConfig.Credentials = credentials.NewEnvCredentials()
		backend.Logger.Info("Using environment credentials (fallback)")
	}

	// Create AWS session
	sess, err := session.NewSession(awsConfig)
	if err != nil {
		return nil, fmt.Errorf("unable to create AWS session: %w", err)
	}

	// Create DynamoDB client
	client := dynamodb.New(sess)

	return &DataSource{cfg: opt, client: client}, nil
}

// Dispose cleans up resources.
func (d *DataSource) Dispose() {
	// Nothing to do here for DynamoDB client
}

// QueryData handles multiple queries and returns results
func (d *DataSource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	resp := backend.NewQueryDataResponse()
	for _, q := range req.Queries {
		// Unmarshal the JSON query model into our struct
		var query DynamoQuery
		if err := json.Unmarshal(q.JSON, &query); err != nil {
			resp.Responses[q.RefID] = backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("invalid query json: %s", err.Error()))
			continue
		}

		frame, err := d.executeQuery(ctx, &query, q.TimeRange)
		if err != nil {
			resp.Responses[q.RefID] = backend.ErrDataResponse(backend.StatusInternal, err.Error())
			continue
		}
		// Create response with data frame
		res := backend.DataResponse{
			Frames: data.Frames{frame},
		}
		resp.Responses[q.RefID] = res
	}
	return resp, nil
}

type FieldMapping struct {
	FieldName      string `json:"fieldName"`
	SourcePath     string `json:"sourcePath"`
	DataType       string `json:"dataType"`
	Transformation string `json:"transformation,omitempty"`
}

type DynamoQuery struct {
	// Basic query parameters
	Partiql           string `json:"partiql"`
	Table             string `json:"table"`
	PartitionKeyName  string `json:"partitionKeyName"`
	PartitionKeyValue string `json:"partitionKeyValue"`
	SortKeyName       string `json:"sortKeyName"`
	SortKeyValue      string `json:"sortKeyValue"`
	Limit             int    `json:"limit"`
	QueryMode         string `json:"queryMode"`

	// Time filtering
	TimeFilterEnabled bool   `json:"timeFilterEnabled"`
	TimestampField    string `json:"timestampField"`
	TimeFrom          string `json:"timeFrom"` // ISO date string
	TimeTo            string `json:"timeTo"`   // ISO date string

	// Dynamic field mapping and transformation
	FieldMappings  []FieldMapping `json:"fieldMappings"`
	OutputFormat   string         `json:"outputFormat"`
	DiscoverSchema bool           `json:"discoverSchema"`
}

// parseFlexibleTime parses a variety of timestamp formats (ISO-8601, unix seconds, unix milliseconds).
func parseFlexibleTime(value string) (time.Time, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return time.Time{}, fmt.Errorf("time value is empty")
	}

	if ts, err := time.Parse(time.RFC3339Nano, trimmed); err == nil {
		return ts.UTC(), nil
	}

	if unixInt, err := strconv.ParseInt(trimmed, 10, 64); err == nil {
		// Treat large values as milliseconds, smaller values as seconds.
		if unixInt > 1_000_000_000_000 {
			return time.UnixMilli(unixInt).UTC(), nil
		}
		return time.Unix(unixInt, 0).UTC(), nil
	}

	if unixFloat, err := strconv.ParseFloat(trimmed, 64); err == nil {
		seconds := int64(unixFloat)
		nanos := int64((unixFloat - float64(seconds)) * float64(time.Second))
		return time.Unix(seconds, nanos).UTC(), nil
	}

	return time.Time{}, fmt.Errorf("unsupported time format: %s", value)
}

// resolveEffectiveTimeRange combines the dashboard time range with any explicit overrides from the query.
// It ensures the resulting window stays within the dashboard selection while allowing users to further narrow it.
func resolveEffectiveTimeRange(q *DynamoQuery, tr backend.TimeRange) (time.Time, time.Time) {
	var panelFrom, panelTo time.Time
	if !tr.From.IsZero() {
		panelFrom = tr.From.UTC()
	}
	if !tr.To.IsZero() {
		panelTo = tr.To.UTC()
	}
	if !panelFrom.IsZero() && !panelTo.IsZero() && panelFrom.After(panelTo) {
		panelFrom, panelTo = panelTo, panelFrom
	}

	var (
		manualFrom    time.Time
		manualTo      time.Time
		hasManualFrom bool
		hasManualTo   bool
	)

	if q != nil {
		if t, err := parseFlexibleTime(q.TimeFrom); err == nil {
			manualFrom = t
			hasManualFrom = true
		}
		if t, err := parseFlexibleTime(q.TimeTo); err == nil {
			manualTo = t
			hasManualTo = true
		}
		if hasManualFrom && hasManualTo && manualFrom.After(manualTo) {
			manualFrom, manualTo = manualTo, manualFrom
		}
	}

	effectiveFrom := panelFrom
	effectiveTo := panelTo

	if effectiveFrom.IsZero() && effectiveTo.IsZero() {
		if hasManualFrom {
			effectiveFrom = manualFrom
		}
		if hasManualTo {
			effectiveTo = manualTo
		}
	}

	if effectiveFrom.IsZero() && !effectiveTo.IsZero() {
		effectiveFrom = effectiveTo.Add(-24 * time.Hour)
	}
	if effectiveTo.IsZero() && !effectiveFrom.IsZero() {
		effectiveTo = effectiveFrom.Add(24 * time.Hour)
	}
	if effectiveFrom.IsZero() && effectiveTo.IsZero() {
		now := time.Now().UTC()
		effectiveTo = now
		effectiveFrom = now.Add(-24 * time.Hour)
	}

	if hasManualFrom {
		if effectiveFrom.IsZero() || manualFrom.After(effectiveFrom) {
			effectiveFrom = manualFrom
		}
	}
	if hasManualTo {
		if effectiveTo.IsZero() || manualTo.Before(effectiveTo) {
			effectiveTo = manualTo
		}
	}

	if effectiveFrom.After(effectiveTo) {
		effectiveTo = effectiveFrom
	}

	return effectiveFrom, effectiveTo
}

// convertDynamoItemToJSON converts a DynamoDB item to clean JSON
func convertDynamoItemToJSON(item map[string]*dynamodb.AttributeValue) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	for key, attrValue := range item {
		if attrValue == nil {
			continue
		}

		if attrValue.S != nil {
			result[key] = *attrValue.S
		} else if attrValue.N != nil {
			// Try to parse as float first, then int
			if f, err := strconv.ParseFloat(*attrValue.N, 64); err == nil {
				result[key] = f
			} else {
				result[key] = *attrValue.N
			}
		} else if attrValue.BOOL != nil {
			result[key] = *attrValue.BOOL
		} else if attrValue.M != nil {
			// Recursively convert nested map
			if nested, err := convertDynamoItemToJSON(attrValue.M); err == nil {
				result[key] = nested
			} else {
				result[key] = attrValue.M
			}
		} else if attrValue.L != nil {
			// Convert list
			var list []interface{}
			for _, listItem := range attrValue.L {
				if listItem.S != nil {
					list = append(list, *listItem.S)
				} else if listItem.N != nil {
					if f, err := strconv.ParseFloat(*listItem.N, 64); err == nil {
						list = append(list, f)
					} else {
						list = append(list, *listItem.N)
					}
				} else if listItem.BOOL != nil {
					list = append(list, *listItem.BOOL)
				} else if listItem.M != nil {
					if nested, err := convertDynamoItemToJSON(listItem.M); err == nil {
						list = append(list, nested)
					} else {
						list = append(list, listItem.M)
					}
				}
			}
			result[key] = list
		} else {
			// For any other type, just store the raw value
			result[key] = attrValue
		}
	}

	return result, nil
}

func (d *DataSource) executeQuery(ctx context.Context, q *DynamoQuery, tr backend.TimeRange) (*data.Frame, error) {
	var items []map[string]*dynamodb.AttributeValue
	var err error

	// Always align query time range with the dashboard selection to ensure $__from/$__to macros and
	// automatic time filtering respect the panel's time picker. Allow explicit query overrides to further
	// narrow the window but never expand beyond the dashboard range.
	effectiveFrom, effectiveTo := resolveEffectiveTimeRange(q, tr)
	if !effectiveFrom.IsZero() {
		formatted := effectiveFrom.UTC().Format(time.RFC3339)
		if q.TimeFrom != formatted {
			backend.Logger.Info("Resolved timeFrom from dashboard range", "previous", q.TimeFrom, "resolved", formatted)
		}
		q.TimeFrom = formatted
	}
	if !effectiveTo.IsZero() {
		formatted := effectiveTo.UTC().Format(time.RFC3339)
		if q.TimeTo != formatted {
			backend.Logger.Info("Resolved timeTo from dashboard range", "previous", q.TimeTo, "resolved", formatted)
		}
		q.TimeTo = formatted
	}

	// Normalize resource identifiers before building AWS requests
	originalTable := q.Table
	q.Table = strings.TrimSpace(q.Table)
	if originalTable != q.Table {
		backend.Logger.Info("Normalized table name by trimming whitespace", "original", originalTable, "normalized", q.Table)
	}
	q.PartitionKeyName = strings.TrimSpace(q.PartitionKeyName)
	q.SortKeyName = strings.TrimSpace(q.SortKeyName)
	q.TimestampField = strings.TrimSpace(q.TimestampField)

	trimmedPartiql := strings.TrimSpace(q.Partiql)
	q.Partiql = trimmedPartiql
	if trimmedPartiql != "" {
		items, err = d.executePartiQL(trimmedPartiql, &tr, q, q.Limit)
	} else if isLikelyPartiqlStatement(q.Table) {
		backend.Logger.Warn("Detected PartiQL statement in table field; executing as PartiQL",
			"statement", q.Table,
		)
		items, err = d.executePartiQL(strings.TrimSpace(q.Table), &tr, q, q.Limit)
	} else if q.Table != "" && q.PartitionKeyName == "" && q.PartitionKeyValue == "" {
		// If no partition key is specified, perform a scan to get all documents
		items, err = d.executeScanWithFilter(q)
	} else {
		items, err = d.executeKeyQuery(q)
	}

	if err != nil {
		return nil, err
	}

	// Convert DynamoDB items to clean JSON
	var cleanItems []map[string]interface{}
	for _, item := range items {
		cleanItem, err := convertDynamoItemToJSON(item)
		if err != nil {
			backend.Logger.Error("Failed to convert DynamoDB item", "error", err.Error())
			continue
		}
		cleanItems = append(cleanItems, cleanItem)
	}

	// If schema discovery is requested, return schema information
	if q.DiscoverSchema {
		return d.buildSchemaFrame(cleanItems), nil
	}

	// Build dynamic frame based on field mappings or auto-discovery
	return d.buildDynamicFrame(cleanItems, q)
}

// buildSchemaFrame returns schema information for the given data
func (d *DataSource) buildSchemaFrame(items []map[string]interface{}) *data.Frame {
	frame := data.NewFrame("schema")

	// Debug logging
	backend.Logger.Info("buildSchemaFrame called", "itemCount", len(items))

	// Collect all unique field paths and their types
	schemaMap := make(map[string]map[string]int) // path -> type -> count

	for _, item := range items {
		d.discoverFieldsRecursive(item, "", schemaMap)
	}

	backend.Logger.Info("Schema discovery completed", "uniqueFields", len(schemaMap))

	// Build schema frame
	frame.Fields = append(frame.Fields,
		data.NewField("field_path", nil, make([]string, 0)),
		data.NewField("data_type", nil, make([]string, 0)),
		data.NewField("sample_value", nil, make([]string, 0)),
		data.NewField("frequency", nil, make([]int64, 0)),
	)

	for path, types := range schemaMap {
		// Find most common type
		maxCount := 0
		mostCommonType := "string"
		for dataType, count := range types {
			if count > maxCount {
				maxCount = count
				mostCommonType = dataType
			}
		}

		// Get sample value (check if items exist first)
		sampleStr := "N/A"
		if len(items) > 0 {
			sampleValue := d.extractValueByPath(items[0], path)
			sampleStr = fmt.Sprintf("%v", sampleValue)
			if len(sampleStr) > 100 {
				sampleStr = sampleStr[:100] + "..."
			}
		}

		frame.AppendRow(path, mostCommonType, sampleStr, int64(maxCount))
	}

	return frame
}

// buildDynamicFrame builds a data frame based on field mappings or auto-discovery
func (d *DataSource) buildDynamicFrame(items []map[string]interface{}, q *DynamoQuery) (*data.Frame, error) {
	frame := data.NewFrame("response")

	// Always add time field for Grafana
	frame.Fields = append(frame.Fields, data.NewField("time", nil, make([]time.Time, 0, len(items))))

	// If no field mappings provided, auto-discover based on actual data
	fieldMappings := q.FieldMappings
	if len(fieldMappings) == 0 || q.OutputFormat == "auto" {
		fieldMappings = d.autoDiscoverFields(items, q.OutputFormat)
		backend.Logger.Info("Auto-discovered field mappings", "count", len(fieldMappings))
	}

	// Create fields based on mappings
	fieldIndexMap := make(map[string]int)
	for i, mapping := range fieldMappings {
		fieldIndexMap[mapping.FieldName] = i + 1 // +1 because of time field

		switch mapping.DataType {
		case "number":
			frame.Fields = append(frame.Fields, data.NewField(mapping.FieldName, nil, make([]float64, 0, len(items))))
		case "boolean":
			frame.Fields = append(frame.Fields, data.NewField(mapping.FieldName, nil, make([]bool, 0, len(items))))
		case "time":
			frame.Fields = append(frame.Fields, data.NewField(mapping.FieldName, nil, make([]time.Time, 0, len(items))))
		default: // string, json
			frame.Fields = append(frame.Fields, data.NewField(mapping.FieldName, nil, make([]string, 0, len(items))))
		}
	}

	// Add raw JSON field if requested or no mappings
	if len(fieldMappings) == 0 || q.OutputFormat == "auto" {
		frame.Fields = append(frame.Fields, data.NewField("raw_json", nil, make([]string, 0, len(items))))
	}

	// Populate data
	for _, item := range items {
		row := make([]interface{}, len(frame.Fields))
		row[0] = time.Now() // time field

		// Extract mapped fields
		for i, mapping := range fieldMappings {
			rawValue := d.extractValueByPath(item, mapping.SourcePath)
			transformedValue := d.transformValue(rawValue, mapping)
			row[i+1] = transformedValue
		}

		// Add raw JSON if needed
		if len(frame.Fields) > len(fieldMappings)+1 {
			jsonBytes, _ := json.Marshal(item)
			row[len(row)-1] = string(jsonBytes)
		}

		frame.AppendRow(row...)
	}

	return frame, nil
}

// discoverFieldsRecursive recursively discovers all field paths in the data
func (d *DataSource) discoverFieldsRecursive(obj interface{}, prefix string, schemaMap map[string]map[string]int) {
	switch v := obj.(type) {
	case map[string]interface{}:
		for key, value := range v {
			path := key
			if prefix != "" {
				path = prefix + "." + key
			}
			d.discoverFieldsRecursive(value, path, schemaMap)
		}
	case []interface{}:
		if len(v) > 0 {
			// Analyze first array element
			d.discoverFieldsRecursive(v[0], prefix+"[0]", schemaMap)
		}
	default:
		dataType := d.getDataType(obj)
		if schemaMap[prefix] == nil {
			schemaMap[prefix] = make(map[string]int)
		}
		schemaMap[prefix][dataType]++
	}
}

// extractValueByPath extracts a value from nested JSON using dot notation
func (d *DataSource) extractValueByPath(obj interface{}, path string) interface{} {
	if path == "" {
		return obj
	}

	parts := strings.Split(path, ".")
	current := obj

	for _, part := range parts {
		// Handle array access like "field[0]"
		if strings.Contains(part, "[") && strings.Contains(part, "]") {
			arrayPart := strings.Split(part, "[")[0]
			indexStr := strings.TrimSuffix(strings.Split(part, "[")[1], "]")
			index, err := strconv.Atoi(indexStr)
			if err != nil {
				return nil
			}

			if m, ok := current.(map[string]interface{}); ok {
				if arr, ok := m[arrayPart].([]interface{}); ok && index < len(arr) {
					current = arr[index]
				} else {
					return nil
				}
			} else {
				return nil
			}
		} else {
			// Regular field access
			if m, ok := current.(map[string]interface{}); ok {
				if val, exists := m[part]; exists {
					current = val
				} else {
					return nil
				}
			} else {
				return nil
			}
		}
	}

	return current
}

// transformValue applies transformation to a raw value based on mapping configuration
func (d *DataSource) transformValue(rawValue interface{}, mapping FieldMapping) interface{} {
	if rawValue == nil {
		return d.getDefaultValue(mapping.DataType)
	}

	// Auto-detect and handle coordinate fields (latitude/longitude)
	if d.isCoordinateField(mapping.FieldName, mapping.SourcePath) {
		return d.parseCoordinate(rawValue)
	}

	// Apply custom transformations if specified (support comma-separated)
	if mapping.Transformation != "" {
		transforms := strings.Split(strings.ReplaceAll(mapping.Transformation, " ", ""), ",")
		for _, transform := range transforms {
			if transform == "" {
				continue
			}
			rawValue = d.applySingleTransform(rawValue, transform)
		}
	}

	// Convert to target data type
	switch mapping.DataType {
	case "number":
		if f, ok := rawValue.(float64); ok {
			return f
		}
		if i, ok := rawValue.(int); ok {
			return float64(i)
		}
		if str, ok := rawValue.(string); ok {
			if f, err := strconv.ParseFloat(str, 64); err == nil {
				return f
			}
		}
		return 0.0
	case "boolean":
		if b, ok := rawValue.(bool); ok {
			return b
		}
		if str, ok := rawValue.(string); ok {
			return str == "true"
		}
		return false
	case "time":
		if t, ok := rawValue.(time.Time); ok {
			return t
		}
		if str, ok := rawValue.(string); ok {
			if t, err := time.Parse(time.RFC3339, str); err == nil {
				return t
			}
		}
		return time.Now()
	case "json":
		jsonBytes, _ := json.Marshal(rawValue)
		return string(jsonBytes)
	default: // string
		return fmt.Sprintf("%v", rawValue)
	}
}

// isCoordinateField checks if a field is a coordinate field (latitude/longitude)
func (d *DataSource) isCoordinateField(fieldName, sourcePath string) bool {
	fieldLower := strings.ToLower(fieldName)
	pathLower := strings.ToLower(sourcePath)

	// Check field name patterns
	coordFields := []string{"latitude", "lat", "longitude", "lon", "lng"}
	for _, coord := range coordFields {
		if fieldLower == coord {
			return true
		}
	}

	// Check source path patterns
	coordPaths := []string{"location.lat", "location.lon", "location.lng", "coord.lat", "coord.lon", "geo.lat", "geo.lon"}
	for _, coord := range coordPaths {
		if pathLower == coord {
			return true
		}
	}

	return false
}

// parseCoordinate specifically handles coordinate parsing with robust error handling
func (d *DataSource) parseCoordinate(rawValue interface{}) interface{} {
	// If already a number, use it directly
	if f, ok := rawValue.(float64); ok {
		return f
	}
	if i, ok := rawValue.(int); ok {
		return float64(i)
	}

	// Parse string coordinates
	if str, ok := rawValue.(string); ok {
		// Clean the string (remove extra spaces, quotes, etc.)
		cleanStr := strings.TrimSpace(str)
		cleanStr = strings.Trim(cleanStr, "'\"")

		// Try to parse as float
		if f, err := strconv.ParseFloat(cleanStr, 64); err == nil {
			// Validate coordinate ranges
			if f >= -180.0 && f <= 180.0 {
				return f
			}
		}
	}

	// Default for invalid coordinates
	return 0.0
}

// applySingleTransform applies a single transformation to a value
func (d *DataSource) applySingleTransform(rawValue interface{}, transform string) interface{} {
	switch transform {
	case "parseFloat":
		if str, ok := rawValue.(string); ok {
			if f, err := strconv.ParseFloat(str, 64); err == nil {
				return f
			}
		}
	case "parseInt":
		if str, ok := rawValue.(string); ok {
			if i, err := strconv.Atoi(str); err == nil {
				return i
			}
		}
	case "timestamp":
		if str, ok := rawValue.(string); ok {
			if i, err := strconv.ParseInt(str, 10, 64); err == nil {
				return time.Unix(i, 0)
			}
		}
	}
	return rawValue
}

// autoDiscoverFields automatically creates field mappings based on actual data structure
func (d *DataSource) autoDiscoverFields(items []map[string]interface{}, outputFormat string) []FieldMapping {
	if len(items) == 0 {
		return []FieldMapping{}
	}

	mappings := []FieldMapping{}

	// Dynamically analyze the first item to discover all available fields
	firstItem := items[0]

	// Create mappings for all top-level fields in the data
	for key, value := range firstItem {
		dataType := d.getDataType(value)
		mappings = append(mappings, FieldMapping{
			FieldName:  key,
			SourcePath: key,
			DataType:   dataType,
		})
	}

	// If there are nested objects, add some common nested paths
	// but make it dynamic based on actual structure
	for key, value := range firstItem {
		if nested, ok := value.(map[string]interface{}); ok {
			for nestedKey, nestedValue := range nested {
				nestedDataType := d.getDataType(nestedValue)
				nestedPath := key + "." + nestedKey
				mappings = append(mappings, FieldMapping{
					FieldName:  key + "_" + nestedKey,
					SourcePath: nestedPath,
					DataType:   nestedDataType,
				})
			}
		}
	}

	return mappings
}

// getDataType determines the data type of a value
func (d *DataSource) getDataType(value interface{}) string {
	switch value.(type) {
	case float64, int, int64:
		return "number"
	case bool:
		return "boolean"
	case time.Time:
		return "time"
	case map[string]interface{}, []interface{}:
		return "json"
	default:
		return "string"
	}
}

// getDefaultValue returns a default value for a given data type
func (d *DataSource) getDefaultValue(dataType string) interface{} {
	switch dataType {
	case "number":
		return 0.0
	case "boolean":
		return false
	case "time":
		return time.Now()
	default:
		return ""
	}
}

// Helper function to safely extract string values (legacy support)
func getStringValue(value interface{}) string {
	if value == nil {
		return ""
	}
	if str, ok := value.(string); ok {
		return str
	}
	return fmt.Sprintf("%v", value)
}

func isLikelyPartiqlStatement(input string) bool {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return false
	}
	upper := strings.ToUpper(trimmed)
	return strings.HasPrefix(upper, "SELECT ") || strings.HasPrefix(upper, "INSERT ") ||
		strings.HasPrefix(upper, "UPDATE ") || strings.HasPrefix(upper, "DELETE ")
}

func (d *DataSource) executePartiQL(statement string, tr *backend.TimeRange, q *DynamoQuery, limit int) ([]map[string]*dynamodb.AttributeValue, error) {
	sanitized, err := sanitizePartiQLStatement(statement, tr, q)
	if err != nil {
		backend.Logger.Error("PartiQL validation failed", "error", err.Error())
		return nil, err
	}

	// Add automatic time filtering to PartiQL if enabled and not already present
	if q.TimeFilterEnabled && q.TimestampField != "" && q.TimeFrom != "" && q.TimeTo != "" {
		sanitized, err = d.addTimeFilterToPartiQL(sanitized, q)
		if err != nil {
			backend.Logger.Error("Failed to add time filter to PartiQL", "error", err.Error())
			return nil, err
		}
	}

	backend.Logger.Info("Executing PartiQL statement", "statement", sanitized, "limit", limit)

	// Basic validation of PartiQL statement
	trimmed := strings.TrimSpace(sanitized)
	if trimmed == "" {
		return nil, fmt.Errorf("PartiQL statement cannot be empty or contain only whitespace")
	}

	// Check for basic SQL-like structure
	upperStatement := strings.ToUpper(trimmed)
	if !strings.HasPrefix(upperStatement, "SELECT ") &&
		!strings.HasPrefix(upperStatement, "INSERT ") &&
		!strings.HasPrefix(upperStatement, "UPDATE ") &&
		!strings.HasPrefix(upperStatement, "DELETE ") {
		return nil, fmt.Errorf("PartiQL statement must start with SELECT, INSERT, UPDATE, or DELETE")
	}

	// Check for dangerous operations
	if strings.Contains(upperStatement, "DROP ") ||
		strings.Contains(upperStatement, "CREATE ") ||
		strings.Contains(upperStatement, "ALTER ") {
		return nil, fmt.Errorf("DROP, CREATE, and ALTER operations are not supported in PartiQL queries")
	}

	// Check for LIMIT clause
	if strings.Contains(upperStatement, " LIMIT ") {
		return nil, fmt.Errorf("LIMIT clauses are not supported in PartiQL queries. Use the limit parameter instead")
	}

	// Check for properly quoted table names
	if strings.Contains(upperStatement, " FROM ") ||
		strings.Contains(upperStatement, " INTO ") ||
		strings.Contains(upperStatement, " UPDATE ") {
		if !strings.Contains(trimmed, `"`) && !strings.Contains(trimmed, "'") {
			return nil, fmt.Errorf("table names must be quoted with double quotes in PartiQL queries")
		}
	}

	input := &dynamodb.ExecuteStatementInput{
		Statement: aws.String(trimmed),
	}
	if limit > 0 {
		input.Limit = aws.Int64(int64(limit))
	}

	out, err := d.client.ExecuteStatement(input)
	if err != nil {
		// Provide more detailed error information
		backend.Logger.Error("PartiQL execution failed", "error", err.Error(), "statement", trimmed)

		// Check for common PartiQL errors and provide helpful messages
		errMsg := err.Error()
		if strings.Contains(errMsg, "ValidationException") {
			if strings.Contains(errMsg, "table") {
				return nil, fmt.Errorf("PartiQL error: Invalid table name or table does not exist. Please check your table name and ensure it's properly quoted")
			}
			if strings.Contains(errMsg, "syntax") {
				return nil, fmt.Errorf("PartiQL syntax error: %s", errMsg)
			}
		}
		if strings.Contains(errMsg, "ResourceNotFoundException") {
			return nil, fmt.Errorf("PartiQL error: Table not found. Please verify the table exists in your DynamoDB")
		}
		if strings.Contains(errMsg, "AccessDeniedException") {
			return nil, fmt.Errorf("PartiQL error: Access denied. Please check your AWS credentials and IAM permissions")
		}

		return nil, fmt.Errorf("PartiQL execution failed: %s", errMsg)
	}

	backend.Logger.Info("PartiQL execution succeeded", "itemsReturned", len(out.Items))
	return out.Items, nil
}

func sanitizePartiQLStatement(statement string, tr *backend.TimeRange, q *DynamoQuery) (string, error) {
	sanitized := strings.TrimSpace(statement)
	if sanitized == "" {
		return "", fmt.Errorf("PartiQL statement cannot be empty or contain only whitespace")
	}

	var fromUnix, toUnix int64
	if q != nil {
		if t, err := parseFlexibleTime(q.TimeFrom); err == nil {
			fromUnix = t.Unix()
		}
		if t, err := parseFlexibleTime(q.TimeTo); err == nil {
			toUnix = t.Unix()
		}
	}
	if tr != nil {
		if fromUnix == 0 {
			fromUnix = tr.From.Unix()
		}
		if toUnix == 0 {
			toUnix = tr.To.Unix()
		}
	}

	now := time.Now()
	if fromUnix == 0 {
		fromUnix = now.Add(-24 * time.Hour).Unix()
	}
	if toUnix == 0 {
		toUnix = now.Unix()
	}

	replacements := map[string]string{
		"${__from:unix}":       strconv.FormatInt(fromUnix, 10),
		"${__to:unix}":         strconv.FormatInt(toUnix, 10),
		"${__unixEpochFrom()}": strconv.FormatInt(fromUnix, 10),
		"${__unixEpochTo()}":   strconv.FormatInt(toUnix, 10),
	}

	for macro, value := range replacements {
		quotedMacro := fmt.Sprintf("'%s'", macro)
		quotedValue := fmt.Sprintf("'%s'", value)
		sanitized = strings.ReplaceAll(sanitized, quotedMacro, quotedValue)
		sanitized = strings.ReplaceAll(sanitized, macro, value)
	}

	castRegex := regexp.MustCompile(`(?i)CAST\(\s*("[^"]+"|'[^']+'|[A-Za-z0-9_.#-]+)\s+AS\s+BIGINT\s*\)`)
	if castRegex.MatchString(sanitized) {
		backend.Logger.Warn("Removing unsupported CAST() from PartiQL statement")
		sanitized = castRegex.ReplaceAllStringFunc(sanitized, func(match string) string {
			sub := castRegex.FindStringSubmatch(match)
			if len(sub) > 1 {
				return strings.TrimSpace(sub[1])
			}
			return match
		})
	}

	if strings.Contains(strings.ToUpper(sanitized), " CAST(") {
		return "", fmt.Errorf("PartiQL CAST() is not supported by DynamoDB. Remove CAST() calls and try again")
	}

	betweenRegex := regexp.MustCompile(`(?i)(BETWEEN\s+)(-?\d+)(\s+AND\s+)(-?\d+)`)
	sanitized = betweenRegex.ReplaceAllString(sanitized, "${1}'${2}'${3}'${4}'")

	return sanitized, nil
}

func (d *DataSource) executeKeyQuery(q *DynamoQuery) ([]map[string]*dynamodb.AttributeValue, error) {
	// Build key condition expression
	if q.Table == "" || q.PartitionKeyName == "" || q.PartitionKeyValue == "" {
		return nil, fmt.Errorf("table and partition key name/value are required")
	}

	// Debug logging
	backend.Logger.Info("executeKeyQuery called",
		"table", q.Table,
		"partitionKeyName", q.PartitionKeyName,
		"partitionKeyValue", q.PartitionKeyValue,
		"sortKeyName", q.SortKeyName,
		"sortKeyValue", q.SortKeyValue,
		"limit", q.Limit)

	exprAttrVals := map[string]*dynamodb.AttributeValue{
		":pk": {S: aws.String(q.PartitionKeyValue)},
	}
	keyCondition := fmt.Sprintf("%s = :pk", q.PartitionKeyName)
	if q.SortKeyName != "" && q.SortKeyValue != "" {
		exprAttrVals[":sk"] = &dynamodb.AttributeValue{S: aws.String(q.SortKeyValue)}
		keyCondition += fmt.Sprintf(" AND %s = :sk", q.SortKeyName)
	}

	backend.Logger.Info("DynamoDB query details",
		"keyCondition", keyCondition,
		"expressionAttributeValues", exprAttrVals)

	input := &dynamodb.QueryInput{
		TableName:                 aws.String(q.Table),
		KeyConditionExpression:    aws.String(keyCondition),
		ExpressionAttributeValues: exprAttrVals,
	}
	if q.Limit > 0 {
		input.Limit = aws.Int64(int64(q.Limit))
	}

	// Add time filtering if enabled
	if q.TimeFilterEnabled && q.TimestampField != "" && q.TimeFrom != "" && q.TimeTo != "" {
		timestampField := q.TimestampField
		if timestampField == "" {
			timestampField = "timestamp"
		}

		backend.Logger.Info("Adding time filter to key query", "timestampField", timestampField, "timeFrom", q.TimeFrom, "timeTo", q.TimeTo)

		// Parse timestamps in a flexible manner (supports ISO-8601 and unix epoch formats)
		timeFrom, err := parseFlexibleTime(q.TimeFrom)
		if err != nil {
			backend.Logger.Error("Failed to parse timeFrom in key query", "error", err.Error(), "timeFrom", q.TimeFrom)
			return nil, fmt.Errorf("invalid timeFrom value: %w", err)
		}

		timeTo, err := parseFlexibleTime(q.TimeTo)
		if err != nil {
			backend.Logger.Error("Failed to parse timeTo in key query", "error", err.Error(), "timeTo", q.TimeTo)
			return nil, fmt.Errorf("invalid timeTo value: %w", err)
		}

		// Convert to Unix timestamps (seconds)
		unixFrom := timeFrom.Unix()
		unixTo := timeTo.Unix()

		backend.Logger.Info("Time filter conversion for key query", "unixFrom", unixFrom, "unixTo", unixTo)

		// Create filter expression for time range
		// Support number, ISO string, and numeric-string timestamp formats
		filterExpr := strings.Join([]string{
			"(#ts BETWEEN :timeFromNum AND :timeToNum)",
			"(#ts BETWEEN :timeFromIso AND :timeToIso)",
			"(#ts BETWEEN :timeFromEpochStr AND :timeToEpochStr)",
		}, " OR ")

		input.FilterExpression = aws.String(filterExpr)

		// Initialize expression attribute names if not already set
		if input.ExpressionAttributeNames == nil {
			input.ExpressionAttributeNames = make(map[string]*string)
		}
		input.ExpressionAttributeNames["#ts"] = aws.String(timestampField)

		// Add time filter values to existing expression attribute values
		exprAttrVals[":timeFromNum"] = &dynamodb.AttributeValue{
			N: aws.String(strconv.FormatInt(unixFrom, 10)),
		}
		exprAttrVals[":timeToNum"] = &dynamodb.AttributeValue{
			N: aws.String(strconv.FormatInt(unixTo, 10)),
		}
		exprAttrVals[":timeFromIso"] = &dynamodb.AttributeValue{
			S: aws.String(q.TimeFrom),
		}
		exprAttrVals[":timeToIso"] = &dynamodb.AttributeValue{
			S: aws.String(q.TimeTo),
		}
		exprAttrVals[":timeFromEpochStr"] = &dynamodb.AttributeValue{
			S: aws.String(strconv.FormatInt(unixFrom, 10)),
		}
		exprAttrVals[":timeToEpochStr"] = &dynamodb.AttributeValue{
			S: aws.String(strconv.FormatInt(unixTo, 10)),
		}

		backend.Logger.Info("Time filter applied to key query", "filterExpression", filterExpr)
	}

	backend.Logger.Info("Executing DynamoDB Query", "input", input)

	out, err := d.client.Query(input)
	if err != nil {
		backend.Logger.Error("DynamoDB Query failed", "error", err.Error())
		return nil, err
	}

	backend.Logger.Info("DynamoDB Query succeeded",
		"itemsReturned", len(out.Items),
		"scannedCount", out.ScannedCount,
		"count", out.Count)

	return out.Items, nil
}

func (d *DataSource) executeScanWithFilter(q *DynamoQuery) ([]map[string]*dynamodb.AttributeValue, error) {
	backend.Logger.Info("executeScanWithFilter called", "table", q.Table, "limit", q.Limit, "timeFilterEnabled", q.TimeFilterEnabled)

	// Validate table name
	if q.Table == "" {
		backend.Logger.Error("Empty table name provided")
		return nil, fmt.Errorf("table name cannot be empty")
	}

	input := &dynamodb.ScanInput{
		TableName: aws.String(q.Table),
	}
	if q.Limit > 0 {
		input.Limit = aws.Int64(int64(q.Limit))
	}

	// Add time filtering if enabled
	if q.TimeFilterEnabled && q.TimestampField != "" && q.TimeFrom != "" && q.TimeTo != "" {
		timestampField := q.TimestampField
		if timestampField == "" {
			timestampField = "timestamp"
		}

		backend.Logger.Info("Adding time filter", "timestampField", timestampField, "timeFrom", q.TimeFrom, "timeTo", q.TimeTo)

		// Parse timestamps and convert to Unix timestamps for comparison
		timeFrom, err := parseFlexibleTime(q.TimeFrom)
		if err != nil {
			backend.Logger.Error("Failed to parse timeFrom", "error", err.Error(), "timeFrom", q.TimeFrom)
			return nil, fmt.Errorf("invalid timeFrom value: %w", err)
		}

		timeTo, err := parseFlexibleTime(q.TimeTo)
		if err != nil {
			backend.Logger.Error("Failed to parse timeTo", "error", err.Error(), "timeTo", q.TimeTo)
			return nil, fmt.Errorf("invalid timeTo value: %w", err)
		}

		// Convert to Unix timestamps (seconds)
		unixFrom := timeFrom.Unix()
		unixTo := timeTo.Unix()

		backend.Logger.Info("Time filter conversion", "unixFrom", unixFrom, "unixTo", unixTo)

		// Create filter expression for time range
		// Support both string and number timestamp formats
		filterExpr := "(#ts BETWEEN :timeFrom AND :timeTo) OR (#ts BETWEEN :timeFromStr AND :timeToStr)"

		input.FilterExpression = aws.String(filterExpr)
		input.ExpressionAttributeNames = map[string]*string{
			"#ts": aws.String(timestampField),
		}
		input.ExpressionAttributeValues = map[string]*dynamodb.AttributeValue{
			":timeFrom": {
				N: aws.String(strconv.FormatInt(unixFrom, 10)),
			},
			":timeTo": {
				N: aws.String(strconv.FormatInt(unixTo, 10)),
			},
			":timeFromStr": {
				S: aws.String(q.TimeFrom),
			},
			":timeToStr": {
				S: aws.String(q.TimeTo),
			},
		}

		backend.Logger.Info("Time filter applied", "filterExpression", filterExpr)
	}

	backend.Logger.Info("Executing DynamoDB Scan with filter", "tableName", q.Table, "limit", q.Limit)

	out, err := d.client.Scan(input)
	if err != nil {
		backend.Logger.Error("DynamoDB Scan failed", "error", err.Error(), "table", q.Table)
		return nil, fmt.Errorf("DynamoDB scan failed for table '%s': %w", q.Table, err)
	}

	backend.Logger.Info("DynamoDB Scan succeeded",
		"table", q.Table,
		"itemsReturned", len(out.Items),
		"scannedCount", aws.Int64Value(out.ScannedCount),
		"count", aws.Int64Value(out.Count))

	return out.Items, nil
}

func (d *DataSource) executeScan(tableName string, limit int) ([]map[string]*dynamodb.AttributeValue, error) {
	// Debug logging
	backend.Logger.Info("executeScan called", "table", tableName, "limit", limit)

	// Validate table name
	tableName = strings.TrimSpace(tableName)
	if tableName == "" {
		backend.Logger.Error("Empty table name provided")
		return nil, fmt.Errorf("table name cannot be empty")
	}

	input := &dynamodb.ScanInput{
		TableName: aws.String(tableName),
	}
	if limit > 0 {
		input.Limit = aws.Int64(int64(limit))
	}

	backend.Logger.Info("Executing DynamoDB Scan", "tableName", tableName, "limit", limit)

	out, err := d.client.Scan(input)
	if err != nil {
		backend.Logger.Error("DynamoDB Scan failed", "error", err.Error(), "table", tableName)
		return nil, fmt.Errorf("DynamoDB scan failed for table '%s': %w", tableName, err)
	}

	backend.Logger.Info("DynamoDB Scan succeeded",
		"table", tableName,
		"itemsReturned", len(out.Items),
		"scannedCount", aws.Int64Value(out.ScannedCount),
		"count", aws.Int64Value(out.Count))

	return out.Items, nil
}

// CheckHealth verifies AWS credentials by calling ListTables
func (d *DataSource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	// Debug logging
	backend.Logger.Info("CheckHealth called", "region", d.cfg.Region, "hasAccessKey", d.cfg.AccessKey != "", "hasSecretKey", d.cfg.SecretKey != "")

	result, err := d.client.ListTables(&dynamodb.ListTablesInput{Limit: aws.Int64(1)})
	if err != nil {
		backend.Logger.Error("ListTables failed", "error", err.Error())
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("Connection failed: %s", err.Error()),
		}, nil
	}

	backend.Logger.Info("ListTables succeeded", "tableCount", len(result.TableNames))
	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: fmt.Sprintf("Successfully connected to AWS DynamoDB. Found %d tables.", len(result.TableNames)),
	}, nil
}

// CallResource handles custom resource paths (e.g. /query, /health).  Register this in main.go.
func (d *DataSource) callResourceHandler(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	switch req.Path {
	case "query":
		// Not used because queries go through QueryData
		return nil
	case "health":
		res := map[string]string{"message": "OK"}
		return sender.Send(&backend.CallResourceResponse{
			Status: int(backend.StatusOK),
			Body:   mustMarshalJSON(res),
		})
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: int(backend.StatusNotFound),
			Body:   []byte("not found"),
		})
	}
}

// addTimeFilterToPartiQL automatically adds time filtering WHERE clause to PartiQL SELECT statements
func (d *DataSource) addTimeFilterToPartiQL(statement string, q *DynamoQuery) (string, error) {
	statement = strings.TrimSpace(statement)
	upperStatement := strings.ToUpper(statement)

	// Only add time filtering to SELECT statements
	if !strings.HasPrefix(upperStatement, "SELECT ") {
		backend.Logger.Info("Skipping automatic time filtering for non-SELECT PartiQL statement")
		return statement, nil
	}

	// Check if WHERE clause already exists (basic check)
	hasWhere := strings.Contains(upperStatement, " WHERE ")

	// Parse time values in a flexible manner (ISO-8601 or unix epoch strings)
	timeFrom, err := parseFlexibleTime(q.TimeFrom)
	if err != nil {
		return "", fmt.Errorf("invalid timeFrom value: %w", err)
	}

	timeTo, err := parseFlexibleTime(q.TimeTo)
	if err != nil {
		return "", fmt.Errorf("invalid timeTo value: %w", err)
	}

	// Convert to Unix timestamps
	unixFrom := timeFrom.Unix()
	unixTo := timeTo.Unix()

	// Build time filter condition
	timestampField := q.TimestampField
	if timestampField == "" {
		timestampField = "timestamp"
	}

	// Quote the timestamp field name properly
	quotedField := fmt.Sprintf(`"%s"`, strings.Trim(timestampField, `"`))

	// Create a comprehensive time filter that handles multiple timestamp formats
	timeFilter := fmt.Sprintf(`((%s BETWEEN %d AND %d) OR (%s BETWEEN '%s' AND '%s') OR (%s BETWEEN '%d' AND '%d'))`,
		quotedField, unixFrom, unixTo, // Numeric timestamps
		quotedField, q.TimeFrom, q.TimeTo, // ISO string timestamps
		quotedField, unixFrom, unixTo) // String numeric timestamps

	var result string
	if hasWhere {
		// Add to existing WHERE clause with AND
		result = strings.ReplaceAll(statement, " WHERE ", fmt.Sprintf(" WHERE %s AND ", timeFilter))
		backend.Logger.Info("Added time filter to existing WHERE clause", "timeFilter", timeFilter)
	} else {
		// Add new WHERE clause
		result = fmt.Sprintf("%s WHERE %s", statement, timeFilter)
		backend.Logger.Info("Added new WHERE clause with time filter", "timeFilter", timeFilter)
	}

	return result, nil
}

// Utility to marshal JSON safely
func mustMarshalJSON(v interface{}) []byte {
	b, _ := json.Marshal(v)
	return b
}
