package plugin

import "github.com/aws/aws-sdk-go/service/dynamodb"

type QueryModel struct {
	QueryText          string
	Limit              int64
	DatetimeAttributes []DatetimeAttribute
	SortBy             string `json:"sortBy"`           // Field name to sort by (client-side)
	SortDirection      string `json:"sortDirection"`    // "asc" or "desc" (client-side)
	SortKey            string `json:"sortKey"`          // Sort key attribute for DynamoDB native sorting
	ScanIndexForward   *bool  `json:"scanIndexForward"` // DynamoDB native sort order (Query API only)
}

type DatetimeAttribute struct {
	Name   string
	Format string
}

var (
	UnixTimestampSeconds     = "1"
	UnixTimestampMiniseconds = "2"
)

type DynamoDBDataType int

type DataRow map[string]*dynamodb.AttributeValue

// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html#HowItWorks.DataTypeDescriptors
const (
	S DynamoDBDataType = iota
	N
	B
	BOOL
	NULL
	M
	L
	SS
	NS
	BS
)

type ExtraPluginSettings struct {
	ConnectionTestTable string         `json:"connectionTestTable"`
	UploadPresets       []UploadPreset `json:"uploadPresets"`
	MaxUploadPayloadKB  int64          `json:"maxUploadPayloadKB"`
}

type UploadPreset struct {
	ID               string          `json:"id"`
	Name             string          `json:"name"`
	Description      string          `json:"description,omitempty"`
	Table            string          `json:"table"`
	Index            string          `json:"index,omitempty"`
	Operation        UploadOperation `json:"operation"`
	Schema           []UploadField   `json:"schema,omitempty"`
	PartiQLTemplate  string          `json:"partiqlTemplate,omitempty"`
	AllowAdHocFields bool            `json:"allowAdHocFields,omitempty"`
	AllowDryRun      bool            `json:"allowDryRun,omitempty"`
	MaxPayloadKB     int64           `json:"maxPayloadKB,omitempty"`
	ResponsePreview  bool            `json:"responsePreview,omitempty"`
	HelpText         string          `json:"helpText,omitempty"`
	Category         string          `json:"category,omitempty"`
}

type UploadOperation string

const (
	UploadOperationInsert UploadOperation = "insert"
	UploadOperationUpdate UploadOperation = "update"
	UploadOperationDelete UploadOperation = "delete"
	UploadOperationSelect UploadOperation = "select"
)

type FieldValidation struct {
	Pattern       string `json:"pattern,omitempty"`
	MinLength     *int   `json:"minLength,omitempty"`
	MaxLength     *int   `json:"maxLength,omitempty"`
	Min           *int   `json:"min,omitempty"`
	Max           *int   `json:"max,omitempty"`
	CustomMessage string `json:"customMessage,omitempty"`
}

type FieldTransformation struct {
	Type   string            `json:"type"`
	Params map[string]string `json:"params,omitempty"`
}

type UploadField struct {
	Name           string               `json:"name"`
	Type           string               `json:"type"`
	Required       bool                 `json:"required,omitempty"`
	Description    string               `json:"description,omitempty"`
	DefaultValue   string               `json:"defaultValue,omitempty"`
	Validation     *FieldValidation     `json:"validation,omitempty"`
	Transformation *FieldTransformation `json:"transformation,omitempty"`
	DynamoType     string               `json:"dynamoType,omitempty"`
}
