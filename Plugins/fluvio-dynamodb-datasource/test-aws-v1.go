package main

import (
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

func main() {
	// Create AWS session with credentials from environment
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String("ap-southeast-2"),
		Credentials: credentials.NewEnvCredentials(),
	})
	if err != nil {
		log.Fatalf("Failed to create AWS session: %v", err)
	}

	// Create DynamoDB client
	client := dynamodb.New(sess)

	// Test ListTables
	fmt.Println("Testing ListTables with AWS SDK v1...")
	result, err := client.ListTables(&dynamodb.ListTablesInput{
		Limit: aws.Int64(5),
	})
	if err != nil {
		log.Fatalf("ListTables failed: %v", err)
	}

	fmt.Printf("Success! Found %d tables:\n", len(result.TableNames))
	for _, table := range result.TableNames {
		fmt.Printf("  - %s\n", *table)
	}
}
