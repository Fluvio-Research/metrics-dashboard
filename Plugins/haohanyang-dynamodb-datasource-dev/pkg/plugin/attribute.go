package plugin

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

type Attribute struct {
	Name     string
	Value    *data.Field
	TsFormat string
}

func (c *Attribute) Type() data.FieldType {
	return c.Value.Type()
}

func NewAttribute(rowIndex int, name string, value *dynamodb.AttributeValue, datetimeFormat string) (*Attribute, error) {
	var field *data.Field

	if value.S != nil {
		// string
		if datetimeFormat != "" && datetimeFormat != UnixTimestampMiniseconds && datetimeFormat != UnixTimestampSeconds {
			t, err := time.Parse(datetimeFormat, *value.S)
			if err != nil {
				return nil, err
			}

			field = data.NewField(name, nil, make([]*time.Time, rowIndex+1))
			field.Set(rowIndex, &t)

		} else {
			field = data.NewField(name, nil, make([]*string, rowIndex+1))
			field.Set(rowIndex, value.S)
		}

	} else if value.N != nil {
		i, f, err := parseNumber(*value.N)
		if err != nil {
			return nil, err
		} else if i != nil {
			// int64
			if datetimeFormat == UnixTimestampSeconds {
				t := time.Unix(*i, 0)
				field = data.NewField(name, nil, make([]*time.Time, rowIndex+1))
				field.Set(rowIndex, &t)
			} else if datetimeFormat == UnixTimestampMiniseconds {
				seconds := *i / 1000
				nanoseconds := (*i % 1000) * 1000000
				t := time.Unix(seconds, nanoseconds)
				field = data.NewField(name, nil, make([]*time.Time, rowIndex+1))
				field.Set(rowIndex, &t)
			} else if datetimeFormat != "" {
				return nil, errors.New("invalid datetime format")
			} else {
				field = data.NewField(name, nil, make([]*int64, rowIndex+1))
				field.Set(rowIndex, i)
			}

		} else {
			// float64
			field = data.NewField(name, nil, make([]*float64, rowIndex+1))
			field.Set(rowIndex, f)
		}

	} else if value.B != nil {
		field = data.NewField(name, nil, make([]*string, rowIndex+1))
		field.Set(rowIndex, aws.String("[B]"))
	} else if value.BOOL != nil {
		field = data.NewField(name, nil, make([]*bool, rowIndex+1))
		field.Set(rowIndex, value.BOOL)
	} else if value.NULL != nil {
		return nil, nil
	} else if value.M != nil {
		v, err := mapToJson(value)
		if err != nil {
			return nil, err
		}
		field = data.NewField(name, nil, make([]*json.RawMessage, rowIndex+1))
		field.Set(rowIndex, v)
	} else if value.L != nil {
		v, err := listToJson(value)
		if err != nil {
			return nil, err
		}
		field = data.NewField(name, nil, make([]*json.RawMessage, rowIndex+1))
		field.Set(rowIndex, v)
	} else if value.SS != nil {
		v, err := stringSetToJson(value)
		if err != nil {
			return nil, err
		}
		field = data.NewField(name, nil, make([]*json.RawMessage, rowIndex+1))
		field.Set(rowIndex, v)
	} else if value.NS != nil {
		v, err := numberSetToJson(value)
		if err != nil {
			return nil, err
		}
		field = data.NewField(name, nil, make([]*json.RawMessage, rowIndex+1))
		field.Set(rowIndex, v)
	} else if value.BS != nil {
		field = data.NewField(name, nil, make([]*string, rowIndex+1))
		field.Set(rowIndex, aws.String("[BS]"))
	}
	return &Attribute{Name: name, Value: field, TsFormat: datetimeFormat}, nil
}

func (c *Attribute) Size() int {
	return c.Value.Len()
}

// convertToStringField converts the current field to a string field, preserving existing values
func (c *Attribute) convertToStringField() *data.Field {
	stringValues := make([]*string, c.Value.Len())

	for i := 0; i < c.Value.Len(); i++ {
		cv, ok := c.Value.ConcreteAt(i)
		if ok && cv != nil {
			switch c.Type() {
			case data.FieldTypeNullableInt64:
				stringValues[i] = aws.String(strconv.FormatInt(cv.(int64), 10))
			case data.FieldTypeNullableFloat64:
				stringValues[i] = aws.String(strconv.FormatFloat(cv.(float64), 'f', -1, 64))
			case data.FieldTypeNullableTime:
				stringValues[i] = aws.String(cv.(time.Time).Format(time.RFC3339))
			case data.FieldTypeNullableBool:
				stringValues[i] = aws.String(strconv.FormatBool(cv.(bool)))
			case data.FieldTypeNullableJSON:
				rm := cv.(json.RawMessage)
				stringValues[i] = aws.String(string(rm))
			default:
				// Already a string or other type
				stringValues[i] = aws.String(fmt.Sprintf("%v", cv))
			}
		}
		// nil values remain nil
	}

	return data.NewField(c.Name, nil, stringValues)
}

func (c *Attribute) Append(value *dynamodb.AttributeValue) error {
	if value.S != nil {
		if c.TsFormat != "" && c.TsFormat != UnixTimestampMiniseconds && c.TsFormat != UnixTimestampSeconds {
			if c.Type() != data.FieldTypeNullableTime {
				// Type mismatch: convert to string and log warning
				backend.Logger.Warn("Type mismatch for datetime field, converting to string", "field", c.Name, "expected", "time", "got", "string")
				c.Value = c.convertToStringField()
			} else {
				t, err := time.Parse(c.TsFormat, *value.S)
				if err != nil {
					return err
				}
				c.Value.Append(&t)
				return nil
			}
		}

		// Handle string values
		if c.Type() == data.FieldTypeNullableString {
			c.Value.Append(value.S)
		} else {
			// Type mismatch: convert existing field to string type
			backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "string")
			c.Value = c.convertToStringField()
			c.Value.Append(value.S)
		}

	} else if value.N != nil {
		i, f, err := parseNumber(*value.N)
		if err != nil {
			return err
		} else if i != nil {
			// int64
			if c.TsFormat == UnixTimestampSeconds {
				if c.Type() != data.FieldTypeNullableTime {
					// Type mismatch: convert to string and log warning
					backend.Logger.Warn("Type mismatch for timestamp field, converting to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "number")
					c.Value = c.convertToStringField()
					c.Value.Append(aws.String(strconv.FormatInt(*i, 10)))
				} else {
					t := time.Unix(*i, 0)
					c.Value.Append(&t)
				}
			} else if c.TsFormat == UnixTimestampMiniseconds {
				if c.Type() != data.FieldTypeNullableTime {
					// Type mismatch: convert to string and log warning
					backend.Logger.Warn("Type mismatch for timestamp field, converting to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "number")
					c.Value = c.convertToStringField()
					c.Value.Append(aws.String(strconv.FormatInt(*i, 10)))
				} else {
					seconds := *i / 1000
					nanoseconds := (*i % 1000) * 1000000
					t := time.Unix(seconds, nanoseconds)
					c.Value.Append(&t)
				}
			} else if c.TsFormat != "" {
				return errors.New("invalid datetime format")
			} else {
				// Handle numeric values with type flexibility
				if c.Type() == data.FieldTypeNullableInt64 {
					c.Value.Append(i)
				} else if c.Type() == data.FieldTypeNullableFloat64 {
					c.Value.Append(aws.Float64(float64(*i)))
				} else if c.Type() == data.FieldTypeNullableString {
					// Convert number to string
					c.Value.Append(aws.String(strconv.FormatInt(*i, 10)))
				} else {
					// Type mismatch: convert to string
					backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "number")
					c.Value = c.convertToStringField()
					c.Value.Append(aws.String(strconv.FormatInt(*i, 10)))
				}
			}

		} else {
			// float64
			if c.Type() == data.FieldTypeNullableFloat64 {
				c.Value.Append(f)
			} else if c.Type() == data.FieldTypeNullableInt64 {
				// Convert all previous *int64 values to *float64
				float64Values := make([]*float64, c.Value.Len()+1)
				for i := 0; i < c.Value.Len(); i++ {
					cv, ok := c.Value.ConcreteAt(i)
					if ok {
						float64Values[i] = aws.Float64(float64(cv.(int64)))
					}
				}
				float64Values[c.Value.Len()] = f
				c.Value = data.NewField(c.Name, nil, float64Values)
			} else if c.Type() == data.FieldTypeNullableString {
				// Convert float to string
				c.Value.Append(aws.String(strconv.FormatFloat(*f, 'f', -1, 64)))
			} else {
				// Type mismatch: convert to string
				backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "float")
				c.Value = c.convertToStringField()
				c.Value.Append(aws.String(strconv.FormatFloat(*f, 'f', -1, 64)))
			}
		}
	} else if value.B != nil {
		if c.Type() != data.FieldTypeNullableString {
			backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "binary")
			c.Value = c.convertToStringField()
		}
		if value.B != nil {
			c.Value.Append(aws.String("[B]"))
		} else {
			c.Value.Append(nil)
		}
	} else if value.BOOL != nil {
		if c.Type() == data.FieldTypeNullableBool {
			c.Value.Append(value.BOOL)
		} else {
			backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "bool")
			c.Value = c.convertToStringField()
			c.Value.Append(aws.String(strconv.FormatBool(*value.BOOL)))
		}
	} else if value.NULL != nil {
		c.Value.Append(nil)
	} else if value.M != nil {
		v, err := mapToJson(value)
		if err != nil {
			// If JSON conversion fails, convert to string representation
			backend.Logger.Warn("JSON conversion failed for map, converting to string", "field", c.Name, "error", err.Error())
			c.Value = c.convertToStringField()
			c.Value.Append(aws.String("[M]"))
			return nil
		}
		if c.Type() == data.FieldTypeNullableJSON {
			c.Value.Append(v)
		} else {
			backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "map")
			c.Value = c.convertToStringField()
			s := string(*v)
			c.Value.Append(aws.String(s))
		}
	} else if value.L != nil {
		v, err := listToJson(value)
		if err != nil {
			// If JSON conversion fails, convert to string representation
			backend.Logger.Warn("JSON conversion failed for list, converting to string", "field", c.Name, "error", err.Error())
			c.Value = c.convertToStringField()
			c.Value.Append(aws.String("[L]"))
			return nil
		}
		if c.Type() == data.FieldTypeNullableJSON {
			c.Value.Append(v)
		} else {
			backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "list")
			c.Value = c.convertToStringField()
			s := string(*v)
			c.Value.Append(aws.String(s))
		}
	} else if value.SS != nil {
		v, err := stringSetToJson(value)
		if err != nil {
			// If JSON conversion fails, convert to string representation
			backend.Logger.Warn("JSON conversion failed for string set, converting to string", "field", c.Name, "error", err.Error())
			c.Value = c.convertToStringField()
			c.Value.Append(aws.String("[SS]"))
			return nil
		}
		if c.Type() == data.FieldTypeNullableJSON {
			c.Value.Append(v)
		} else {
			backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "string_set")
			c.Value = c.convertToStringField()
			s := string(*v)
			c.Value.Append(aws.String(s))
		}
	} else if value.NS != nil {
		v, err := numberSetToJson(value)
		if err != nil {
			// If JSON conversion fails, convert to string representation
			backend.Logger.Warn("JSON conversion failed for number set, converting to string", "field", c.Name, "error", err.Error())
			c.Value = c.convertToStringField()
			c.Value.Append(aws.String("[NS]"))
			return nil
		}
		if c.Type() == data.FieldTypeNullableJSON {
			c.Value.Append(v)
		} else {
			backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "number_set")
			c.Value = c.convertToStringField()
			s := string(*v)
			c.Value.Append(aws.String(s))
		}
	} else if value.BS != nil {
		if c.Type() != data.FieldTypeNullableString {
			backend.Logger.Warn("Type mismatch, converting field to string", "field", c.Name, "expected", c.Type().ItemTypeString(), "got", "binary_set")
			c.Value = c.convertToStringField()
		}
		c.Value.Append(aws.String("[BS]"))
	}

	return nil
}
