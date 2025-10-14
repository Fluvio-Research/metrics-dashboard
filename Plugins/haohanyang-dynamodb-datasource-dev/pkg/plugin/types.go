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
	ConnectionTestTable string `json:"connectionTestTable"`
}
