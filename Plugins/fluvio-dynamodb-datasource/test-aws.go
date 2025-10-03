package main

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

func main() {
	// Load AWS config - let it use environment variables automatically
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatalf("Failed to load AWS config: %v", err)
	}

	// Create DynamoDB client with explicit region
	client := dynamodb.NewFromConfig(cfg, func(o *dynamodb.Options) {
		o.Region = "ap-southeast-2"
	})

	// Test ListTables
	fmt.Println("Testing ListTables...")
	result, err := client.ListTables(context.Background(), &dynamodb.ListTablesInput{
		Limit: aws.Int32(5),
	})
	if err != nil {
		log.Fatalf("ListTables failed: %v", err)
	}

	fmt.Printf("Success! Found %d tables:\n", len(result.TableNames))
	for _, table := range result.TableNames {
		fmt.Printf("  - %s\n", table)
	}
}
