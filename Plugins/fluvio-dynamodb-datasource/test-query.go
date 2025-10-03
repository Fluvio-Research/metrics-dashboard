package main

import (
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

func main() {
	// Load AWS credentials from environment variables
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	sessionToken := os.Getenv("AWS_SESSION_TOKEN")
	region := "ap-southeast-2"

	if accessKey == "" || secretKey == "" {
		log.Fatalf("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables must be set.")
	}

	fmt.Printf("Using credentials: AccessKey=%s, SecretKey=%s, SessionToken=%s\n",
		accessKey[:10]+"...",
		secretKey[:10]+"...",
		sessionToken[:10]+"...")

	// Create AWS config
	awsConfig := &aws.Config{
		Region: aws.String(region),
		Credentials: credentials.NewStaticCredentials(
			accessKey,
			secretKey,
			sessionToken,
		),
	}

	// Create AWS session
	sess, err := session.NewSession(awsConfig)
	if err != nil {
		log.Fatalf("Failed to create AWS session: %v", err)
	}

	// Create DynamoDB client
	client := dynamodb.New(sess)

	// Test 1: List all tables
	fmt.Println("=== Testing ListTables ===")
	result, err := client.ListTables(&dynamodb.ListTablesInput{})
	if err != nil {
		log.Fatalf("ListTables failed: %v", err)
	}

	fmt.Println("Available tables:")
	for _, tableName := range result.TableNames {
		fmt.Printf("  - %s\n", *tableName)
	}

	// Test 2: Try to scan the table to see what data exists
	fmt.Println("\n=== Testing Scan ===")
	scanInput := &dynamodb.ScanInput{
		TableName: aws.String("datastore-Test-TelemetryTable"),
		Limit:     aws.Int64(5),
	}

	scanResult, err := client.Scan(scanInput)
	if err != nil {
		log.Printf("Scan failed: %v", err)
	} else {
		fmt.Printf("Scan succeeded. Found %d items:\n", len(scanResult.Items))
		for i, item := range scanResult.Items {
			fmt.Printf("  Item %d: %+v\n", i+1, item)
		}
	}

	// Test 3: Try the exact query that the plugin is doing
	fmt.Println("\n=== Testing Query with id = '009' ===")
	queryInput := &dynamodb.QueryInput{
		TableName:              aws.String("datastore-Test-TelemetryTable"),
		KeyConditionExpression: aws.String("id = :pk"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":pk": {S: aws.String("009")},
		},
		Limit: aws.Int64(10),
	}

	queryResult, err := client.Query(queryInput)
	if err != nil {
		log.Printf("Query failed: %v", err)
	} else {
		fmt.Printf("Query succeeded. Found %d items, scanned %d items:\n",
			*queryResult.Count, *queryResult.ScannedCount)
		for i, item := range queryResult.Items {
			fmt.Printf("  Item %d: %+v\n", i+1, item)
		}
	}

	// Test 4: Try with "0009" (4 digits)
	fmt.Println("\n=== Testing Query with id = '0009' ===")
	queryInput2 := &dynamodb.QueryInput{
		TableName:              aws.String("datastore-Test-TelemetryTable"),
		KeyConditionExpression: aws.String("id = :pk"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":pk": {S: aws.String("0009")},
		},
		Limit: aws.Int64(10),
	}

	queryResult2, err := client.Query(queryInput2)
	if err != nil {
		log.Printf("Query with '0009' failed: %v", err)
	} else {
		fmt.Printf("Query with '0009' succeeded. Found %d items, scanned %d items:\n",
			*queryResult2.Count, *queryResult2.ScannedCount)
		for i, item := range queryResult2.Items {
			fmt.Printf("  Item %d: %+v\n", i+1, item)
		}
	}
}
