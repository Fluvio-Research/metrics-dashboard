package plugin

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestConvertDynamoItemToJSON_Simple(t *testing.T) {
	// Test the convertDynamoItemToJSON function with your exact data structure
	item := map[string]*dynamodb.AttributeValue{
		"id": {
			S: aws.String("0009"),
		},
		"Timestamp": {
			S: aws.String("1753765220"),
		},
		"location": {
			M: map[string]*dynamodb.AttributeValue{
				"lat": {
					N: aws.String("-27.4681"),
				},
				"lon": {
					N: aws.String("153.00383"),
				},
			},
		},
	}

	t.Logf("🧪 Testing convertDynamoItemToJSON with your table structure...")

	result, err := convertDynamoItemToJSON(item)
	if err != nil {
		t.Fatalf("❌ convertDynamoItemToJSON failed: %v", err)
	}

	t.Logf("✅ Conversion successful!")
	t.Logf("📊 Converted data: %+v", result)

	// Check if conversion worked
	if result["id"] != "0009" {
		t.Errorf("❌ Expected id '0009', got %v", result["id"])
	} else {
		t.Logf("✅ ID field converted correctly: %v", result["id"])
	}

	if result["Timestamp"] != "1753765220" {
		t.Errorf("❌ Expected Timestamp '1753765220', got %v", result["Timestamp"])
	} else {
		t.Logf("✅ Timestamp field converted correctly: %v", result["Timestamp"])
	}

	// Check nested location
	location, ok := result["location"].(map[string]interface{})
	if !ok {
		t.Fatalf("❌ Location should be a map, got %T", result["location"])
	} else {
		t.Logf("✅ Location field is correctly a map")
	}

	if location["lat"] != -27.4681 {
		t.Errorf("❌ Expected lat -27.4681, got %v", location["lat"])
	} else {
		t.Logf("✅ Latitude converted correctly: %v", location["lat"])
	}

	if location["lon"] != 153.00383 {
		t.Errorf("❌ Expected lon 153.00383, got %v", location["lon"])
	} else {
		t.Logf("✅ Longitude converted correctly: %v", location["lon"])
	}
}

func TestBuildSchemaFrame_WithCleanData(t *testing.T) {
	// Create a test datasource without mocking
	instance, err := NewDatasource(context.Background(), backend.DataSourceInstanceSettings{
		JSONData: []byte(`{
			"region": "ap-southeast-2",
			"accessKey": "test-key",
			"secretKey": "test-secret"
		}`),
	})
	if err != nil {
		t.Fatalf("❌ Failed to create datasource: %v", err)
	}

	ds := instance.(*DataSource)

	// Create clean test data that matches your table structure
	testItems := []map[string]interface{}{
		{
			"id":        "0009",
			"Timestamp": "1753765220",
			"location": map[string]interface{}{
				"lat": -27.4681,
				"lon": 153.00383,
			},
		},
		{
			"id":        "0010",
			"Timestamp": "1753765280",
			"location": map[string]interface{}{
				"lat": -27.46835,
				"lon": 153.00405,
			},
		},
	}

	t.Logf("🧪 Testing buildSchemaFrame with %d clean items", len(testItems))

	// Let's first debug what happens in the discovery process
	schemaMap := make(map[string]map[string]int)
	for _, item := range testItems {
		t.Logf("📊 Processing item: %+v", item)
		ds.discoverFieldsRecursive(item, "", schemaMap)
	}

	t.Logf("🔍 Schema map after discovery: %+v", schemaMap)

	if len(schemaMap) == 0 {
		t.Error("❌ Schema discovery found no fields - this is the bug!")
		return
	}

	// Now test buildSchemaFrame
	frame := ds.buildSchemaFrame(testItems)

	if frame == nil {
		t.Fatal("❌ Schema frame is nil")
	}

	t.Logf("✅ Schema frame created: name=%s", frame.Name)
	t.Logf("✅ Schema frame fields: %d", len(frame.Fields))

	// Check if frame has expected fields
	expectedFields := []string{"field_path", "data_type", "sample_value", "frequency"}
	if len(frame.Fields) != len(expectedFields) {
		t.Errorf("❌ Expected %d fields, got %d", len(expectedFields), len(frame.Fields))
	}

	for i, expectedField := range expectedFields {
		if i >= len(frame.Fields) {
			t.Errorf("❌ Missing field: %s", expectedField)
			continue
		}
		if frame.Fields[i].Name != expectedField {
			t.Errorf("❌ Expected field %s, got %s", expectedField, frame.Fields[i].Name)
		} else {
			t.Logf("✅ Found expected field: %s", expectedField)
		}
	}

	// Check frame data
	rowCount := frame.Rows()
	t.Logf("📊 Schema frame has %d rows", rowCount)

	if rowCount == 0 {
		t.Error("❌ Schema frame has no data rows - THIS IS THE BUG!")
		return
	}

	// Print all discovered fields
	if len(frame.Fields) >= 4 {
		fieldPathField := frame.Fields[0]   // field_path column
		dataTypeField := frame.Fields[1]    // data_type column
		sampleValueField := frame.Fields[2] // sample_value column
		frequencyField := frame.Fields[3]   // frequency column

		for i := 0; i < rowCount; i++ {
			path := fieldPathField.At(i)
			dataType := dataTypeField.At(i)
			sample := sampleValueField.At(i)
			freq := frequencyField.At(i)
			t.Logf("📋 Discovered field %d: path='%v', type='%v', sample='%v', freq=%v", i, path, dataType, sample, freq)
		}
	}

	// Verify we found the expected paths
	expectedPaths := []string{"id", "Timestamp", "location.lat", "location.lon"}
	foundPaths := make(map[string]bool)

	if len(frame.Fields) >= 1 {
		fieldPathField := frame.Fields[0]
		for i := 0; i < rowCount; i++ {
			path := fieldPathField.At(i).(string)
			foundPaths[path] = true
		}
	}

	for _, expectedPath := range expectedPaths {
		if foundPaths[expectedPath] {
			t.Logf("✅ Found expected path: %s", expectedPath)
		} else {
			t.Errorf("❌ Missing expected path: %s", expectedPath)
		}
	}
}

func TestDiscoverFieldsRecursive_Debug(t *testing.T) {
	// Test the recursive field discovery in isolation
	instance, err := NewDatasource(context.Background(), backend.DataSourceInstanceSettings{
		JSONData: []byte(`{
			"region": "ap-southeast-2",
			"accessKey": "test-key",
			"secretKey": "test-secret"
		}`),
	})
	if err != nil {
		t.Fatalf("❌ Failed to create datasource: %v", err)
	}

	ds := instance.(*DataSource)

	// Test with simple data first
	simpleData := map[string]interface{}{
		"id":        "0009",
		"Timestamp": "1753765220",
	}

	schemaMap := make(map[string]map[string]int)

	t.Logf("🧪 Testing discoverFieldsRecursive with simple data...")
	t.Logf("📊 Input data: %+v", simpleData)

	ds.discoverFieldsRecursive(simpleData, "", schemaMap)

	t.Logf("🔍 Result schema map: %+v", schemaMap)

	if len(schemaMap) == 0 {
		t.Error("❌ No fields discovered from simple data!")
		return
	}

	// Test with nested data
	nestedData := map[string]interface{}{
		"id":        "0009",
		"Timestamp": "1753765220",
		"location": map[string]interface{}{
			"lat": -27.4681,
			"lon": 153.00383,
		},
	}

	schemaMap2 := make(map[string]map[string]int)

	t.Logf("🧪 Testing discoverFieldsRecursive with nested data...")
	t.Logf("📊 Input data: %+v", nestedData)

	ds.discoverFieldsRecursive(nestedData, "", schemaMap2)

	t.Logf("🔍 Result schema map: %+v", schemaMap2)

	expectedFields := []string{"id", "Timestamp", "location.lat", "location.lon"}
	for _, expected := range expectedFields {
		if _, found := schemaMap2[expected]; found {
			t.Logf("✅ Found expected field: %s", expected)
		} else {
			t.Errorf("❌ Missing expected field: %s", expected)
		}
	}
}

func TestEmptyItemsSchemaFrame(t *testing.T) {
	// Test what happens with empty items - this might be the root cause
	instance, err := NewDatasource(context.Background(), backend.DataSourceInstanceSettings{
		JSONData: []byte(`{
			"region": "ap-southeast-2",
			"accessKey": "test-key",
			"secretKey": "test-secret"
		}`),
	})
	if err != nil {
		t.Fatalf("❌ Failed to create datasource: %v", err)
	}

	ds := instance.(*DataSource)

	// Test with empty items array
	emptyItems := []map[string]interface{}{}

	t.Logf("🧪 Testing buildSchemaFrame with empty items...")

	frame := ds.buildSchemaFrame(emptyItems)
	if frame == nil {
		t.Fatal("❌ Schema frame is nil with empty items")
	}

	t.Logf("✅ Empty items handled successfully")
	t.Logf("📊 Frame name: %s", frame.Name)
	t.Logf("📊 Frame fields: %d", len(frame.Fields))

	rowCount := frame.Rows()
	t.Logf("📊 Frame rows: %d", rowCount)

	// This should NOT crash the system
	if rowCount == 0 {
		t.Logf("✅ Empty items correctly result in 0 rows")
	} else {
		t.Errorf("❌ Expected 0 rows for empty items, got %d", rowCount)
	}
}
