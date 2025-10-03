# AWS Permanent Access Keys Setup Guide

This guide explains how to create permanent AWS access keys for use with the Fluvio DynamoDB DataSource plugin.

## 🎯 Overview

The Fluvio DynamoDB plugin is optimized for **permanent IAM user credentials** (not temporary STS tokens). Permanent access keys:
- Start with `AKIA*` (not `ASIA*` which are temporary)
- Don't expire automatically 
- Are ideal for persistent monitoring and dashboards
- Provide consistent access without token refresh

## 🔐 Creating Permanent Access Keys

### Method 1: AWS Management Console (Recommended)

1. **Sign in to AWS Console**
   - Go to [AWS Management Console](https://console.aws.amazon.com/)
   - Sign in with your AWS account

2. **Navigate to IAM**
   - In the search bar, type "IAM" and select **IAM**
   - Or go directly to: https://console.aws.amazon.com/iam/

3. **Create or Select IAM User**
   
   **Option A: Create New User**
   - Click **Users** in the left sidebar
   - Click **Add users**
   - Enter username (e.g., `grafana-dynamodb-user`)
   - Select **Programmatic access** (not console access)
   - Click **Next: Permissions**

   **Option B: Use Existing User**
   - Click **Users** in the left sidebar
   - Select an existing user
   - Go to **Security credentials** tab

4. **Set Permissions**
   - Choose **Attach existing policies directly**
   - Search for and select one of these policies:
     - `AmazonDynamoDBReadOnlyAccess` (read-only access)
     - `AmazonDynamoDBFullAccess` (full access - use cautiously)
     - Or create a custom policy (see below)

5. **Create Access Key**
   - Go to **Security credentials** tab
   - In **Access keys** section, click **Create access key**
   - Choose **Third-party service** as the use case
   - Add description: "Grafana DynamoDB Plugin"
   - Click **Create access key**

6. **Download Credentials**
   - ⚠️ **IMPORTANT**: This is the only time you'll see the secret key
   - Download the CSV file or copy both:
     - Access key ID (starts with `AKIA`)
     - Secret access key
   - Store them securely (password manager recommended)

### Method 2: AWS CLI

```bash
# Create IAM user
aws iam create-user --user-name grafana-dynamodb-user

# Attach DynamoDB policy
aws iam attach-user-policy \
    --user-name grafana-dynamodb-user \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess

# Create access key
aws iam create-access-key --user-name grafana-dynamodb-user
```

The output will contain your access key ID and secret access key.

## 🛡️ Recommended IAM Policy (Custom)

For better security, create a custom policy with minimal required permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:ExecuteStatement",
                "dynamodb:DescribeTable",
                "dynamodb:ListTables"
            ],
            "Resource": [
                "arn:aws:dynamodb:*:*:table/*"
            ]
        }
    ]
}
```

### Creating Custom Policy:

1. In IAM Console, go to **Policies**
2. Click **Create policy**
3. Choose **JSON** tab
4. Paste the policy above
5. Name it: `GrafanaDynamoDBAccess`
6. Attach this policy to your user

## ⚙️ Plugin Configuration

Once you have your permanent access keys:

1. **Open Grafana**
2. **Add Data Source**
   - Go to Configuration > Data Sources
   - Click **Add data source**
   - Select **Fluvio DynamoDB**

3. **Configure Connection**
   - **AWS Region**: Select your DynamoDB region
   - **Access Key ID**: Paste your `AKIA*` key
   - **Secret Access Key**: Paste your secret key
   - **Custom Endpoint**: Leave empty (unless using local DynamoDB)

4. **Test Connection**
   - Click **Save & Test**
   - Should show: "Successfully connected to AWS DynamoDB"

## 🔒 Security Best Practices

### ✅ Do's
- **Use least privilege**: Only grant necessary permissions
- **Store securely**: Use password managers or secure vaults
- **Rotate regularly**: Change keys every 90 days
- **Monitor usage**: Check AWS CloudTrail for access logs
- **Use specific resource ARNs**: Limit access to specific tables if possible

### ❌ Don'ts
- **Never hardcode**: Don't put keys in code or config files
- **Don't share**: Each service should have its own keys
- **Don't use root keys**: Always use IAM user keys
- **Don't ignore warnings**: Monitor for unauthorized access

## 🔄 Key Rotation

To rotate your access keys safely:

1. **Create second key**: Each user can have 2 active keys
2. **Update plugin**: Configure new key in Grafana
3. **Test thoroughly**: Ensure everything works
4. **Delete old key**: Remove the old key from AWS

## 🚨 Troubleshooting

### Common Issues:

**"Access Denied" Error**
- Check IAM permissions
- Ensure policy includes required DynamoDB actions
- Verify table-level permissions

**"Invalid Access Key" Error**
- Confirm key starts with `AKIA` (not `ASIA`)
- Check for typos in key or secret
- Ensure key is active (not deleted)

**"Region Not Found" Error**
- Verify AWS region matches DynamoDB table location
- Check region spelling (e.g., `us-east-1`)

### Debug Steps:
1. Test credentials with AWS CLI: `aws dynamodb list-tables`
2. Check CloudTrail logs for access attempts
3. Verify IAM user has correct policies attached
4. Ensure keys haven't expired or been rotated

## 📚 Additional Resources

- [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- [DynamoDB IAM Permissions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/using-identity-based-policies.html)
- [AWS Security Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

## 🆘 Support

If you encounter issues:
1. Check the plugin logs in Grafana
2. Verify AWS credentials with AWS CLI
3. Review IAM permissions in AWS Console
4. Test DynamoDB access directly

---

**Note**: This plugin is optimized for permanent credentials. While temporary STS tokens may work, they're not recommended for production monitoring systems due to expiration issues.
