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
	case UploadOperationSelect, UploadOperationUpdate, UploadOperationDelete:
		if strings.TrimSpace(p.PartiQLTemplate) == "" {
			return "", nil, "", errors.New("partiqlTemplate is required for this operation")
		}
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
	default:
		return "", nil, "", fmt.Errorf("operation %q not supported", p.Operation)
	}
}

func buildInsertStatement(p UploadPreset, item map[string]interface{}) (string, []*dynamodb.AttributeValue, string, error) {
	if len(item) == 0 {
		return "", nil, "", errors.New("payload is empty")
	}
	marshaled, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		return "", nil, "", fmt.Errorf("failed to marshal item: %w", err)
	}

	statement := fmt.Sprintf("INSERT INTO %s VALUE ?", quoteIdentifier(p.Table))
	params := []*dynamodb.AttributeValue{
		{M: marshaled},
	}

	return statement, params, fmt.Sprintf("%s -- item keys: %v", statement, sortedKeys(item)), nil
}

func convertValueToAttributeValue(field UploadField, value interface{}) (*dynamodb.AttributeValue, error) {
	if value == nil {
		return &dynamodb.AttributeValue{NULL: aws.Bool(true)}, nil
	}

	switch field.Type {
	case "", "auto", "any":
		return dynamodbattribute.Marshal(value)
	case "string":
		str, err := toString(value)
		if err != nil {
			return nil, err
		}
		return &dynamodb.AttributeValue{S: aws.String(str)}, nil
	case "number", "numeric":
		num, err := toNumberString(value)
		if err != nil {
			return nil, err
		}
		return &dynamodb.AttributeValue{N: aws.String(num)}, nil
	case "boolean", "bool":
		b, err := toBool(value)
		if err != nil {
			return nil, err
		}
		return &dynamodb.AttributeValue{BOOL: aws.Bool(b)}, nil
	case "json", "map", "object":
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
