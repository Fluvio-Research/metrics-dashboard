package plugin

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type uploadPresetSummary struct {
	ID               string          `json:"id"`
	Name             string          `json:"name"`
	Description      string          `json:"description,omitempty"`
	Table            string          `json:"table"`
	Index            string          `json:"index,omitempty"`
	Operation        UploadOperation `json:"operation"`
	Schema           []UploadField   `json:"schema,omitempty"`
	AllowAdHocFields bool            `json:"allowAdHocFields,omitempty"`
	AllowDryRun      bool            `json:"allowDryRun,omitempty"`
	MaxPayloadKB     int64           `json:"maxPayloadKB,omitempty"`
	PartiQLTemplate  string          `json:"partiqlTemplate,omitempty"`
	ResponsePreview  bool            `json:"responsePreview,omitempty"`
	HelpText         string          `json:"helpText,omitempty"`
	Category         string          `json:"category,omitempty"`
}

type uploadExecuteRequest struct {
	PresetID string                   `json:"presetId"`
	Items    []map[string]interface{} `json:"items"`
	DryRun   bool                     `json:"dryRun,omitempty"`
	Mode     string                   `json:"mode,omitempty"`
}

type uploadPreviewResponse struct {
	Preset            uploadPresetSummary `json:"preset"`
	ItemCount         int                 `json:"itemCount"`
	Statements        []string            `json:"statements"`
	PayloadSizeBytes  int                 `json:"payloadSizeBytes"`
	EstimatedCapacity float64             `json:"estimatedCapacityUnits,omitempty"`
}

type uploadExecuteResponse struct {
	Preset           uploadPresetSummary       `json:"preset"`
	ItemCount        int                       `json:"itemCount"`
	Statements       []string                  `json:"statements"`
	PayloadSizeBytes int                       `json:"payloadSizeBytes"`
	ConsumedCapacity []consumedCapacitySummary `json:"consumedCapacity,omitempty"`
	Results          []map[string]interface{}  `json:"results,omitempty"`
	Warnings         []string                  `json:"warnings,omitempty"`
}

type consumedCapacitySummary struct {
	TableName      string  `json:"tableName,omitempty"`
	CapacityUnits  float64 `json:"capacityUnits"`
	ReadUnits      float64 `json:"readUnits,omitempty"`
	WriteUnits     float64 `json:"writeUnits,omitempty"`
	ThrottleEvents int64   `json:"throttleEvents,omitempty"`
}

type uploadPlan struct {
	statements        []uploadStatement
	payloadSizeBytes  int
	statementPreviews []string
}

type uploadStatement struct {
	statement string
	params    []*dynamodb.AttributeValue
}

func (settings *ExtraPluginSettings) findPresetByID(id string) (*UploadPreset, error) {
	for i := range settings.UploadPresets {
		p := settings.UploadPresets[i]
		if p.ID == id {
			clone := p // copy to avoid accidental mutation
			if clone.MaxPayloadKB <= 0 {
				clone.MaxPayloadKB = settings.MaxUploadPayloadKB
			}
			return &clone, nil
		}
	}
	return nil, fmt.Errorf("upload preset %q not found", id)
}

func (p UploadPreset) summarize() uploadPresetSummary {
	return uploadPresetSummary{
		ID:               p.ID,
		Name:             p.Name,
		Description:      p.Description,
		Table:            p.Table,
		Index:            p.Index,
		Operation:        p.Operation,
		Schema:           p.Schema,
		AllowAdHocFields: p.AllowAdHocFields,
		AllowDryRun:      p.AllowDryRun,
		MaxPayloadKB:     p.MaxPayloadKB,
		PartiQLTemplate:  p.PartiQLTemplate,
		ResponsePreview:  p.ResponsePreview,
		HelpText:         p.HelpText,
		Category:         p.Category,
	}
}

func (p UploadPreset) effectiveMaxPayloadKB(defaultMax int64) int64 {
	max := p.MaxPayloadKB
	if max <= 0 && defaultMax > 0 {
		max = defaultMax
	}
	if max <= 0 {
		max = 512
	}
	if defaultMax > 0 && max > defaultMax {
		return defaultMax
	}
	return max
}

func buildUploadPlan(p UploadPreset, defaultMaxKB int64, items []map[string]interface{}) (*uploadPlan, error) {
	if p.ID == "" {
		return nil, errors.New("preset.id is required")
	}
	if p.Table == "" {
		return nil, fmt.Errorf("preset %q missing table name", p.ID)
	}
	if len(items) == 0 {
		return nil, errors.New("at least one item is required")
	}

	maxBytes := p.effectiveMaxPayloadKB(defaultMaxKB) * 1024
	statements := make([]uploadStatement, 0, len(items))
	previews := make([]string, 0, len(items))

	totalBytes := 0
	for idx, item := range items {
		if item == nil {
			return nil, fmt.Errorf("item %d is empty", idx+1)
		}

		if err := validateItemAgainstPreset(p, item); err != nil {
			return nil, fmt.Errorf("item %d: %w", idx+1, err)
		}

		payloadBytes, err := json.Marshal(item)
		if err != nil {
			return nil, fmt.Errorf("item %d: failed to marshal payload: %w", idx+1, err)
		}
		totalBytes += len(payloadBytes)
		if maxBytes > 0 && int64(totalBytes) > maxBytes {
			return nil, fmt.Errorf("payload exceeds maximum size of %d KB (item %d pushed total to %d KB)", p.effectiveMaxPayloadKB(defaultMaxKB), idx+1, int(math.Ceil(float64(totalBytes)/1024)))
		}

		stmt, params, preview, err := buildStatementForItem(p, item)
		if err != nil {
			return nil, fmt.Errorf("item %d: %w", idx+1, err)
		}
		statements = append(statements, uploadStatement{statement: stmt, params: params})
		previews = append(previews, preview)
	}

	return &uploadPlan{
		statements:        statements,
		payloadSizeBytes:  totalBytes,
		statementPreviews: previews,
	}, nil
}

func validateItemAgainstPreset(p UploadPreset, item map[string]interface{}) error {
	if len(p.Schema) == 0 {
		return nil
	}

	allowed := map[string]UploadField{}
	for _, field := range p.Schema {
		if field.Name == "" {
			continue
		}
		allowed[field.Name] = field
		if field.Required {
			if _, ok := item[field.Name]; !ok {
				return fmt.Errorf("required field %q missing", field.Name)
			}
		}
	}

	if !p.AllowAdHocFields {
		for key := range item {
			if _, ok := allowed[key]; !ok {
				return fmt.Errorf("field %q is not allowed for preset %q", key, p.ID)
			}
		}
	}

	return nil
}

func buildStatementForItem(p UploadPreset, item map[string]interface{}) (string, []*dynamodb.AttributeValue, string, error) {
	switch p.Operation {
	case UploadOperationInsert:
		return buildInsertStatement(p, item)
	case UploadOperationUpdate:
		return buildUpdateStatement(p, item)
	case UploadOperationDelete:
		return buildDeleteStatement(p, item)
	case UploadOperationSelect:
		return buildSelectStatement(p, item)
	default:
		return "", nil, "", fmt.Errorf("operation %q not supported", p.Operation)
	}
}

func buildInsertStatement(p UploadPreset, item map[string]interface{}) (string, []*dynamodb.AttributeValue, string, error) {
	if len(item) == 0 {
		return "", nil, "", errors.New("payload is empty")
	}

	// Build the field list and parameter placeholders
	keys := sortedKeys(item)
	var fieldPlaceholders []string
	params := make([]*dynamodb.AttributeValue, 0, len(keys))

	for _, key := range keys {
		fieldPlaceholders = append(fieldPlaceholders, fmt.Sprintf("'%s': ?", key))

		// Marshal the value to DynamoDB AttributeValue
		val := item[key]
		av, err := dynamodbattribute.Marshal(val)
		if err != nil {
			return "", nil, "", fmt.Errorf("failed to marshal field %q: %w", key, err)
		}
		params = append(params, av)
	}

	// Build the INSERT statement with struct format: INSERT INTO table VALUE {'field1': ?, 'field2': ?}
	statement := fmt.Sprintf("INSERT INTO %s VALUE {%s}", quoteIdentifier(p.Table), strings.Join(fieldPlaceholders, ", "))

	// Build a preview with actual values for display
	preview := buildPreviewWithValues(statement, item, keys)

	return statement, params, preview, nil
}

func buildUpdateStatement(p UploadPreset, item map[string]interface{}) (string, []*dynamodb.AttributeValue, string, error) {
	// If a custom template is provided, use it
	if strings.TrimSpace(p.PartiQLTemplate) != "" {
		return buildTemplatedStatement(p, item)
	}

	if len(item) == 0 {
		return "", nil, "", errors.New("payload is empty")
	}

	// Separate key fields and update fields
	keyFields := make(map[string]interface{})
	updateFields := make(map[string]interface{})

	for key, value := range item {
		// Check if this field is defined in schema
		isKeyField := false
		for _, field := range p.Schema {
			if field.Name == key {
				// Check if it's a key field (you might want to add a flag in UploadField for this)
				// For now, assume PK and SK are key fields
				if key == "PK" || key == "SK" || field.Required {
					isKeyField = true
				}
				break
			}
		}
		if isKeyField {
			keyFields[key] = value
		} else {
			updateFields[key] = value
		}
	}

	if len(keyFields) == 0 {
		return "", nil, "", errors.New("no key fields found for UPDATE (PK/SK required)")
	}
	if len(updateFields) == 0 {
		return "", nil, "", errors.New("no fields to update")
	}

	// Build SET clause: SET 'field1'=?, 'field2'=?
	var setClause []string
	var params []*dynamodb.AttributeValue

	updateKeys := sortedKeys(updateFields)
	for _, key := range updateKeys {
		setClause = append(setClause, fmt.Sprintf("'%s'=?", key))
		av, err := dynamodbattribute.Marshal(updateFields[key])
		if err != nil {
			return "", nil, "", fmt.Errorf("failed to marshal field %q: %w", key, err)
		}
		params = append(params, av)
	}

	// Build WHERE clause: WHERE 'PK'=? AND 'SK'=?
	var whereClause []string
	keyKeys := sortedKeys(keyFields)
	for _, key := range keyKeys {
		whereClause = append(whereClause, fmt.Sprintf("'%s'=?", key))
		av, err := dynamodbattribute.Marshal(keyFields[key])
		if err != nil {
			return "", nil, "", fmt.Errorf("failed to marshal key field %q: %w", key, err)
		}
		params = append(params, av)
	}

	statement := fmt.Sprintf("UPDATE %s SET %s WHERE %s",
		quoteIdentifier(p.Table),
		strings.Join(setClause, ", "),
		strings.Join(whereClause, " AND "))

	// Build preview with actual values
	preview := buildUpdatePreview(statement, updateFields, keyFields, updateKeys, keyKeys)

	return statement, params, preview, nil
}

func buildDeleteStatement(p UploadPreset, item map[string]interface{}) (string, []*dynamodb.AttributeValue, string, error) {
	// If a custom template is provided, use it
	if strings.TrimSpace(p.PartiQLTemplate) != "" {
		return buildTemplatedStatement(p, item)
	}

	if len(item) == 0 {
		return "", nil, "", errors.New("payload is empty")
	}

	// Build WHERE clause from item (should contain key fields)
	var whereClause []string
	var params []*dynamodb.AttributeValue

	keys := sortedKeys(item)
	for _, key := range keys {
		whereClause = append(whereClause, fmt.Sprintf("'%s'=?", key))
		av, err := dynamodbattribute.Marshal(item[key])
		if err != nil {
			return "", nil, "", fmt.Errorf("failed to marshal field %q: %w", key, err)
		}
		params = append(params, av)
	}

	if len(whereClause) == 0 {
		return "", nil, "", errors.New("no key fields provided for DELETE")
	}

	statement := fmt.Sprintf("DELETE FROM %s WHERE %s",
		quoteIdentifier(p.Table),
		strings.Join(whereClause, " AND "))

	// Build preview with actual values
	preview := buildDeletePreview(statement, item, keys)

	return statement, params, preview, nil
}

func buildSelectStatement(p UploadPreset, item map[string]interface{}) (string, []*dynamodb.AttributeValue, string, error) {
	// If a custom template is provided, use it
	if strings.TrimSpace(p.PartiQLTemplate) != "" {
		return buildTemplatedStatement(p, item)
	}

	// Build WHERE clause from item
	var whereClause []string
	var params []*dynamodb.AttributeValue

	keys := sortedKeys(item)
	for _, key := range keys {
		whereClause = append(whereClause, fmt.Sprintf("'%s'=?", key))
		av, err := dynamodbattribute.Marshal(item[key])
		if err != nil {
			return "", nil, "", fmt.Errorf("failed to marshal field %q: %w", key, err)
		}
		params = append(params, av)
	}

	whereSQL := ""
	if len(whereClause) > 0 {
		whereSQL = " WHERE " + strings.Join(whereClause, " AND ")
	}

	statement := fmt.Sprintf("SELECT * FROM %s%s", quoteIdentifier(p.Table), whereSQL)

	// Build preview with actual values
	preview := buildSelectPreview(statement, item, keys)

	return statement, params, preview, nil
}

func buildTemplatedStatement(p UploadPreset, item map[string]interface{}) (string, []*dynamodb.AttributeValue, string, error) {
	// Use custom PartiQL template with schema-based parameters
	if len(p.Schema) == 0 {
		return "", nil, "", errors.New("schema definition is required to build statement parameters")
	}

	params := make([]*dynamodb.AttributeValue, 0, len(p.Schema))
	for _, field := range p.Schema {
		val, ok := item[field.Name]
		if !ok {
			if field.Required {
				return "", nil, "", fmt.Errorf("required field %q missing", field.Name)
			}
			params = append(params, &dynamodb.AttributeValue{NULL: aws.Bool(true)})
			continue
		}
		av, err := convertValueToAttributeValue(field, val)
		if err != nil {
			return "", nil, "", fmt.Errorf("field %q: %w", field.Name, err)
		}
		params = append(params, av)
	}

	placeholderCount := strings.Count(p.PartiQLTemplate, "?")
	if placeholderCount > 0 && placeholderCount != len(params) {
		return "", nil, "", fmt.Errorf("partiqlTemplate expects %d parameters but schema supplied %d", placeholderCount, len(params))
	}

	return p.PartiQLTemplate, params, fmt.Sprintf("%s -- params: %d", p.PartiQLTemplate, len(params)), nil
}

func resolveUploadFieldType(field UploadField) string {
	configured := strings.ToLower(strings.TrimSpace(field.Type))
	switch configured {
	case "string":
		return "string"
	case "number", "numeric":
		return "number"
	case "boolean", "bool":
		return "boolean"
	case "json", "map", "object":
		return "json"
	case "", "auto", "any":
		// Fall through to Dynamo type detection.
	default:
		return configured
	}

	if field.DynamoType != "" {
		switch strings.ToUpper(strings.TrimSpace(field.DynamoType)) {
		case "N", "NUMBER":
			return "number"
		case "BOOL", "BOOLEAN":
			return "boolean"
		case "M", "MAP", "L", "LIST", "SS", "NS", "BS":
			return "json"
		case "B", "BINARY", "NULL":
			return "string"
		case "S", "STRING":
			return "string"
		}
	}

	return "auto"
}

func convertValueToAttributeValue(field UploadField, value interface{}) (*dynamodb.AttributeValue, error) {
	if value == nil {
		return &dynamodb.AttributeValue{NULL: aws.Bool(true)}, nil
	}

	switch resolveUploadFieldType(field) {
	case "string":
		str, err := toString(value)
		if err != nil {
			return nil, err
		}
		return &dynamodb.AttributeValue{S: aws.String(str)}, nil
	case "number":
		num, err := toNumberString(value)
		if err != nil {
			return nil, err
		}
		return &dynamodb.AttributeValue{N: aws.String(num)}, nil
	case "boolean":
		b, err := toBool(value)
		if err != nil {
			return nil, err
		}
		return &dynamodb.AttributeValue{BOOL: aws.Bool(b)}, nil
	case "json":
		switch v := value.(type) {
		case string:
			if strings.TrimSpace(v) == "" {
				return &dynamodb.AttributeValue{NULL: aws.Bool(true)}, nil
			}
			var decoded interface{}
			if err := json.Unmarshal([]byte(v), &decoded); err != nil {
				return nil, fmt.Errorf("invalid json: %w", err)
			}
			return dynamodbattribute.Marshal(decoded)
		default:
			return dynamodbattribute.Marshal(v)
		}
	default:
		return dynamodbattribute.Marshal(value)
	}
}

func sortedKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	if len(keys) <= 1 {
		return keys
	}
	for i := 1; i < len(keys); i++ {
		for j := i; j > 0 && keys[j] < keys[j-1]; j-- {
			keys[j], keys[j-1] = keys[j-1], keys[j]
		}
	}
	return keys
}

func toString(value interface{}) (string, error) {
	switch v := value.(type) {
	case string:
		return v, nil
	case fmt.Stringer:
		return v.String(), nil
	case float64:
		return trimTrailingZeros(v), nil
	case int:
		return fmt.Sprintf("%d", v), nil
	case int64:
		return fmt.Sprintf("%d", v), nil
	case json.Number:
		return v.String(), nil
	case bool:
		return fmt.Sprintf("%t", v), nil
	default:
		bytes, err := json.Marshal(v)
		if err != nil {
			return "", fmt.Errorf("unable to convert value to string")
		}
		return string(bytes), nil
	}
}

func toNumberString(value interface{}) (string, error) {
	switch v := value.(type) {
	case json.Number:
		return v.String(), nil
	case float32:
		return trimTrailingZeros(float64(v)), nil
	case float64:
		return trimTrailingZeros(v), nil
	case int:
		return fmt.Sprintf("%d", v), nil
	case int64:
		return fmt.Sprintf("%d", v), nil
	case string:
		if strings.TrimSpace(v) == "" {
			return "", errors.New("number field cannot be empty string")
		}
		if _, err := json.Number(v).Float64(); err != nil {
			return "", fmt.Errorf("invalid number string: %w", err)
		}
		return v, nil
	default:
		return "", fmt.Errorf("value %v (%T) cannot be converted to number", value, value)
	}
}

func toBool(value interface{}) (bool, error) {
	switch v := value.(type) {
	case bool:
		return v, nil
	case string:
		switch strings.ToLower(strings.TrimSpace(v)) {
		case "true", "1", "yes":
			return true, nil
		case "false", "0", "no":
			return false, nil
		default:
			return false, fmt.Errorf("invalid boolean string %q", v)
		}
	default:
		return false, fmt.Errorf("value %v (%T) cannot be converted to bool", value, value)
	}
}

func trimTrailingZeros(val float64) string {
	s := fmt.Sprintf("%f", val)
	s = strings.TrimRight(s, "0")
	s = strings.TrimRight(s, ".")
	if s == "" {
		return "0"
	}
	return s
}

// buildPreviewWithValues creates a human-readable preview showing actual values instead of ? placeholders
func buildPreviewWithValues(statement string, item map[string]interface{}, keys []string) string {
	// Build field assignments with actual values for preview
	var fieldValues []string
	for _, key := range keys {
		val := item[key]
		valueStr := formatValueForPreview(val)
		fieldValues = append(fieldValues, fmt.Sprintf("'%s': %s", key, valueStr))
	}

	// Extract the table name and rebuild the statement with actual values
	// Format: INSERT INTO table VALUE {'field': value, ...}
	parts := strings.Split(statement, "VALUE {")
	if len(parts) == 2 {
		tablepart := parts[0]
		return fmt.Sprintf("%sVALUE {%s}", tablepart, strings.Join(fieldValues, ", "))
	}

	// Fallback: just show the field count
	return fmt.Sprintf("%s -- %d fields", statement, len(keys))
}

// formatValueForPreview formats a value for display in the preview
func formatValueForPreview(val interface{}) string {
	if val == nil {
		return "null"
	}

	switch v := val.(type) {
	case string:
		// Escape quotes and limit length for preview
		escaped := strings.ReplaceAll(v, "'", "\\'")
		if len(escaped) > 50 {
			escaped = escaped[:47] + "..."
		}
		return fmt.Sprintf("'%s'", escaped)
	case bool:
		if v {
			return "true"
		}
		return "false"
	case float64:
		return trimTrailingZeros(v)
	case float32:
		return trimTrailingZeros(float64(v))
	case int, int64, int32, int16, int8:
		return fmt.Sprintf("%d", v)
	case uint, uint64, uint32, uint16, uint8:
		return fmt.Sprintf("%d", v)
	default:
		// For complex types, try JSON marshal
		if b, err := json.Marshal(v); err == nil {
			s := string(b)
			if len(s) > 50 {
				s = s[:47] + "..."
			}
			return s
		}
		return fmt.Sprintf("%v", v)
	}
}

// buildUpdatePreview creates a preview for UPDATE statements with actual values
func buildUpdatePreview(statement string, updateFields, keyFields map[string]interface{}, updateKeys, keyKeys []string) string {
	// Replace SET placeholders with actual values
	var setParts []string
	for _, key := range updateKeys {
		val := updateFields[key]
		setParts = append(setParts, fmt.Sprintf("'%s'=%s", key, formatValueForPreview(val)))
	}

	// Replace WHERE placeholders with actual values
	var whereParts []string
	for _, key := range keyKeys {
		val := keyFields[key]
		whereParts = append(whereParts, fmt.Sprintf("'%s'=%s", key, formatValueForPreview(val)))
	}

	// Find table name
	parts := strings.Split(statement, " SET ")
	if len(parts) == 2 {
		tablePart := parts[0] // "UPDATE table"
		return fmt.Sprintf("%s SET %s WHERE %s", tablePart, strings.Join(setParts, ", "), strings.Join(whereParts, " AND "))
	}

	return statement
}

// buildDeletePreview creates a preview for DELETE statements with actual values
func buildDeletePreview(statement string, item map[string]interface{}, keys []string) string {
	var whereParts []string
	for _, key := range keys {
		val := item[key]
		whereParts = append(whereParts, fmt.Sprintf("'%s'=%s", key, formatValueForPreview(val)))
	}

	// Find table name
	parts := strings.Split(statement, " WHERE ")
	if len(parts) == 2 {
		tablePart := parts[0] // "DELETE FROM table"
		return fmt.Sprintf("%s WHERE %s", tablePart, strings.Join(whereParts, " AND "))
	}

	return statement
}

// buildSelectPreview creates a preview for SELECT statements with actual values
func buildSelectPreview(statement string, item map[string]interface{}, keys []string) string {
	if len(keys) == 0 {
		return statement // No WHERE clause
	}

	var whereParts []string
	for _, key := range keys {
		val := item[key]
		whereParts = append(whereParts, fmt.Sprintf("'%s'=%s", key, formatValueForPreview(val)))
	}

	// Find table name
	parts := strings.Split(statement, " WHERE ")
	if len(parts) == 2 {
		tablePart := parts[0] // "SELECT * FROM table"
		return fmt.Sprintf("%s WHERE %s", tablePart, strings.Join(whereParts, " AND "))
	}

	return statement
}

func aggregateConsumedCapacity(outputs []*dynamodb.ConsumedCapacity) []consumedCapacitySummary {
	if len(outputs) == 0 {
		return nil
	}
	summary := map[string]*consumedCapacitySummary{}
	for _, cap := range outputs {
		if cap == nil {
			continue
		}
		key := ""
		if cap.TableName != nil {
			key = *cap.TableName
		}
		if _, exists := summary[key]; !exists {
			summary[key] = &consumedCapacitySummary{
				TableName: key,
			}
		}
		summary[key].CapacityUnits += aws.Float64Value(cap.CapacityUnits)
		summary[key].ReadUnits += aws.Float64Value(cap.ReadCapacityUnits)
		summary[key].WriteUnits += aws.Float64Value(cap.WriteCapacityUnits)
		if cap.CapacityUnits != nil && *cap.CapacityUnits == 0 && cap.TableName != nil {
			summary[key].ThrottleEvents++
		}
	}

	result := make([]consumedCapacitySummary, 0, len(summary))
	for _, val := range summary {
		result = append(result, *val)
	}
	return result
}

func decodeResultItems(items []map[string]*dynamodb.AttributeValue) ([]map[string]interface{}, error) {
	if len(items) == 0 {
		return nil, nil
	}
	decoded := make([]map[string]interface{}, 0, len(items))
	for _, item := range items {
		target := map[string]interface{}{}
		if err := dynamodbattribute.UnmarshalMap(item, &target); err != nil {
			return nil, fmt.Errorf("failed to decode result item: %w", err)
		}
		decoded = append(decoded, target)
	}
	return decoded, nil
}
