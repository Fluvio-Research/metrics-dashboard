# Fluvio DynamoDB DataSource Plugin - EC2 Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Fluvio DynamoDB DataSource plugin to a production Grafana server running on AWS EC2.

## Prerequisites

### EC2 Server Requirements
- **Operating System**: Linux (Ubuntu 20.04+ or Amazon Linux 2 recommended)
- **Architecture**: x86_64 (AMD64)
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Grafana Version**: 10.4.0 or higher
- **Root/sudo access**: Required for installation

### AWS Configuration
- **IAM User**: With DynamoDB read permissions
- **AWS Region**: ap-southeast-2 (Sydney) - as per project configuration
- **Credentials**: Permanent AWS access keys (AKIA*) recommended over temporary tokens

## Quick Deployment

### Option 1: Automated Script (Recommended)

1. **Upload the deployment package to your EC2 server:**
   ```bash
   # On your local machine
   scp -r deployment/ ec2-user@your-ec2-ip:/tmp/
   ```

2. **Connect to your EC2 server:**
   ```bash
   ssh ec2-user@your-ec2-ip
   ```

3. **Run the deployment script:**
   ```bash
   cd /tmp/deployment/
   sudo chmod +x deploy-to-ec2.sh
   sudo ./deploy-to-ec2.sh
   ```

### Option 2: Manual Installation

1. **Stop Grafana service:**
   ```bash
   sudo systemctl stop grafana-server
   ```

2. **Create plugins directory (if needed):**
   ```bash
   sudo mkdir -p /var/lib/grafana/plugins
   ```

3. **Copy plugin files:**
   ```bash
   sudo cp -r fluvio-dynamodb-datasource /var/lib/grafana/plugins/
   ```

4. **Set permissions:**
   ```bash
   sudo chown -R grafana:grafana /var/lib/grafana/plugins/fluvio-dynamodb-datasource
   sudo chmod +x /var/lib/grafana/plugins/fluvio-dynamodb-datasource/fluvio-dynamodb-datasource
   ```

5. **Start Grafana service:**
   ```bash
   sudo systemctl start grafana-server
   sudo systemctl enable grafana-server
   ```

## Configuration

### 1. Access Grafana Web Interface
- Open browser: `http://your-ec2-ip:3000`
- Default credentials: admin/admin (change on first login)

### 2. Add DynamoDB Data Source
1. Navigate to **Configuration** → **Data Sources**
2. Click **Add data source**
3. Select **Fluvio DynamoDB** from the list
4. Configure the following:

#### Basic Settings
- **Name**: Your preferred data source name
- **Default**: Check if this should be the default data source

#### AWS Configuration
- **Region**: `ap-southeast-2` (Sydney)
- **Access Key ID**: Your AWS access key (AKIA*)
- **Secret Access Key**: Your AWS secret key
- **Session Token**: Leave empty for permanent credentials

#### Advanced Settings
- **Endpoint**: Leave empty for default AWS endpoints
- **Profile**: Leave empty unless using AWS profiles
- **Assume Role ARN**: Optional for cross-account access

### 3. Test Connection
1. Click **Save & Test**
2. Verify successful connection message
3. If errors occur, check the troubleshooting section below

## Security Considerations

### AWS IAM Permissions
Create an IAM user with minimal required permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:DescribeTable",
                "dynamodb:ListTables",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem",
                "dynamodb:BatchGetItem"
            ],
            "Resource": "*"
        }
    ]
}
```

### EC2 Security Groups
Ensure your EC2 security group allows:
- **Inbound**: Port 3000 (HTTP) from your IP/network
- **Outbound**: Port 443 (HTTPS) to AWS services

## Troubleshooting

### Plugin Not Loading
```bash
# Check plugin directory
ls -la /var/lib/grafana/plugins/fluvio-dynamodb-datasource/

# Verify binary permissions
sudo -u grafana /var/lib/grafana/plugins/fluvio-dynamodb-datasource/fluvio-dynamodb-datasource --help
```

### Grafana Service Issues
```bash
# Check service status
sudo systemctl status grafana-server

# View logs
sudo journalctl -u grafana-server -f

# Restart service
sudo systemctl restart grafana-server
```

### AWS Connection Issues
1. **Verify credentials**: Use AWS CLI to test
   ```bash
   aws dynamodb list-tables --region ap-southeast-2
   ```

2. **Check IAM permissions**: Ensure user has DynamoDB access

3. **Network connectivity**: Verify EC2 can reach AWS services
   ```bash
   curl -I https://dynamodb.ap-southeast-2.amazonaws.com
   ```

### Common Error Messages

| Error | Solution |
|-------|----------|
| "Plugin not found" | Verify plugin files are in correct location |
| "Permission denied" | Check file ownership and executable permissions |
| "AWS credentials not found" | Verify AWS configuration in data source settings |
| "Region not supported" | Ensure region is correctly set to ap-southeast-2 |

## Monitoring and Maintenance

### Log Monitoring
```bash
# Monitor Grafana logs
sudo tail -f /var/log/grafana/grafana.log

# Monitor system logs
sudo journalctl -u grafana-server -f
```

### Plugin Updates
To update the plugin:
1. Stop Grafana service
2. Replace plugin files
3. Restart Grafana service
4. Clear browser cache

### Performance Optimization
- Monitor DynamoDB read capacity usage
- Use appropriate query filters to reduce data transfer
- Consider using DynamoDB Global Secondary Indexes for complex queries

## Support

For issues related to:
- **Plugin functionality**: Check Grafana logs and plugin documentation
- **AWS connectivity**: Verify IAM permissions and network configuration
- **Performance**: Review DynamoDB query patterns and indexing

## File Structure

```
/var/lib/grafana/plugins/fluvio-dynamodb-datasource/
├── plugin.json                    # Plugin metadata
├── fluvio-dynamodb-datasource     # Linux binary (executable)
├── module.js                      # Frontend code
├── module.js.map                  # Source map
├── img/
│   └── logo.webp                  # Plugin logo
├── LICENSE                        # License file
├── README.md                      # Plugin documentation
└── CHANGELOG.md                   # Version history
```

## Next Steps

After successful deployment:
1. Create DynamoDB dashboards in Grafana
2. Set up monitoring and alerting rules
3. Configure user access and permissions
4. Implement backup strategies for Grafana configuration
