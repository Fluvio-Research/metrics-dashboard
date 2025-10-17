package plugin

import (
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func QueryResultToDataFrame(dataFrameName string, output *dynamodb.ExecuteStatementOutput, datetimeAttributes map[string]string) (*data.Frame, error) {
	backend.Logger.Info("QueryResultToDataFrame called", "dataFrameName", dataFrameName, "itemCount", len(output.Items))

	attributes := make(map[string]*Attribute)
	for rowIndex, row := range output.Items {
		if rowIndex == 0 {
			backend.Logger.Debug("Processing first row", "attributeCount", len(row))
		}
		for name, value := range row {
			datetimeFormat := ""
			if df, ok := datetimeAttributes[name]; ok {
				datetimeFormat = df
			}

			if a, ok := attributes[name]; ok {
				err := a.Append(value)
				if err != nil {
					backend.Logger.Error("Error appending attribute", "name", name, "rowIndex", rowIndex, "error", err.Error())
					return nil, err
				}
			} else {
				newAttribute, err := NewAttribute(rowIndex, name, value, datetimeFormat)
				if err != nil {
					backend.Logger.Error("Error creating new attribute", "name", name, "rowIndex", rowIndex, "error", err.Error())
					return nil, err
				}
				if newAttribute != nil {
					attributes[name] = newAttribute
				}
			}
		}

		// Make sure all attributes have the same size
		for _, c := range attributes {
			// Pad other attributes with null value
			if c.Size() != rowIndex+1 {
				c.Value.Append(nil)
			}
		}
	}

	backend.Logger.Info("Creating data frame", "attributeCount", len(attributes), "itemCount", len(output.Items))

	frame := data.NewFrame(dataFrameName)
	fieldNames := make([]string, 0, len(attributes))
	for _, c := range attributes {
		frame.Fields = append(frame.Fields, c.Value)
		fieldNames = append(fieldNames, c.Name)
	}

	backend.Logger.Info("Data frame created", "fieldCount", len(frame.Fields), "rows", frame.Rows(), "fieldNames", fieldNames)

	// Log first row sample for debugging
	if frame.Rows() > 0 {
		firstRowSample := make(map[string]interface{})
		for i, field := range frame.Fields {
			if i < 5 { // Only log first 5 fields to avoid spam
				val, ok := field.ConcreteAt(0)
				if ok {
					firstRowSample[field.Name] = val
				}
			}
		}
		backend.Logger.Debug("First row sample", "sample", firstRowSample)
	}

	return frame, nil
}
