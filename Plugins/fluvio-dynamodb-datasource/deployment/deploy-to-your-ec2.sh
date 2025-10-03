#!/bin/bash

# Fluvio DynamoDB Plugin - Automated Deployment to Your EC2 Server
# Server: 13.236.111.35 (GrafanaFluvio)
# This script uploads and installs the plugin on your specific EC2 server

set -e

# Configuration
EC2_HOST="13.236.111.35"
EC2_USER="ec2-user"
SSH_KEY="/Users/muhammadimran/Desktop/Mubashir/Security Items/Fluvio/fluvio-telemetry-key-pair.pem"
PLUGIN_ID="fluvio-dynamodb-datasource"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Fluvio DynamoDB Plugin - EC2 Deployment${NC}"
echo "=================================================="
echo "Target Server: $EC2_HOST"
echo "Plugin: $PLUGIN_ID"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key not found: $SSH_KEY${NC}"
    echo "Please ensure the SSH key path is correct."
    exit 1
fi

# Check if deployment files exist
if [ ! -d "$PLUGIN_ID" ]; then
    echo -e "${RED}❌ Plugin directory not found: $PLUGIN_ID${NC}"
    echo "Please run this script from the deployment directory."
    exit 1
fi

# Test SSH connection
echo -e "${YELLOW}🔐 Testing SSH connection...${NC}"
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    echo "Please check:"
    echo "- SSH key permissions: chmod 400 '$SSH_KEY'"
    echo "- EC2 instance is running"
    echo "- Security group allows SSH (port 22)"
    exit 1
fi

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
tar -czf fluvio-dynamodb-deployment.tar.gz $PLUGIN_ID/ *.sh DEPLOYMENT_GUIDE.md

# Upload deployment package to EC2
echo -e "${YELLOW}⬆️  Uploading deployment package to EC2...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no fluvio-dynamodb-deployment.tar.gz "$EC2_USER@$EC2_HOST:/tmp/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Upload successful${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

# Execute deployment on EC2
echo -e "${YELLOW}🔧 Executing deployment on EC2 server...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << 'ENDSSH'
    set -e
    
    echo "🔄 Extracting deployment package..."
    cd /tmp
    tar -xzf fluvio-dynamodb-deployment.tar.gz
    
    echo "⚙️  Configuring Grafana..."
    sudo ./configure-grafana.sh
    
    echo "📋 Installing plugin..."
    sudo ./deploy-to-ec2.sh
    
    echo "🔍 Verifying installation..."
    sudo ./verify-deployment.sh
    
    echo "🧹 Cleaning up..."
    rm -f /tmp/fluvio-dynamodb-deployment.tar.gz
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Clean up local files
rm -f fluvio-dynamodb-deployment.tar.gz

echo ""
echo -e "${GREEN}✅ Plugin deployed successfully to your EC2 server!${NC}"
echo "=================================================="
echo -e "${YELLOW}🌐 Access your Grafana instance:${NC}"
echo "   http://$EC2_HOST:3000"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Login to Grafana (default: admin/admin)"
echo "2. Go to Configuration → Data Sources"
echo "3. Add new data source → Select 'Fluvio DynamoDB'"
echo "4. Configure with your AWS credentials:"
echo "   - Region: ap-southeast-2"
echo "   - Access Key ID: ASIAVRUVRA5JGRRD3KY7"
echo "   - Secret Access Key: [your secret key]"
echo "   - Session Token: [your session token]"
echo ""
echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
echo "- SSH to server: ssh -i '$SSH_KEY' $EC2_USER@$EC2_HOST"
echo "- Check Grafana logs: sudo journalctl -u grafana-server -f"
echo "- Verify plugin: ls -la /var/lib/grafana/plugins/fluvio-dynamodb-datasource"
