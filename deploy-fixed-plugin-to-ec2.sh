#!/bin/bash

# Deploy Fixed DynamoDB Plugin to EC2 Server
# This script safely deploys the plugin with mixed data type fixes
# Server: 13.236.111.35 (GrafanaFluvio)

set -e

# Configuration
EC2_HOST="13.236.111.35"
EC2_USER="ec2-user"
SSH_KEY="/Users/muhammadimran/Desktop/Mubashir/Security Items/Fluvio/fluvio-telemetry-key-pair.pem"
PLUGIN_ID="haohanyang-dynamodb-datasource-dev"
PLUGIN_NAME="fluvio-connect-dynamodb"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Fixed DynamoDB Plugin to EC2${NC}"
echo "=============================================="
echo "Target Server: $EC2_HOST"
echo "Plugin: $PLUGIN_NAME (with mixed data type fix)"
echo "Source: Plugins/$PLUGIN_ID/"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key not found: $SSH_KEY${NC}"
    echo "Please ensure the SSH key path is correct."
    exit 1
fi

# Check if plugin directory exists
if [ ! -d "Plugins/$PLUGIN_ID" ]; then
    echo -e "${RED}❌ Plugin source directory not found: Plugins/$PLUGIN_ID${NC}"
    echo "Please run this script from the Grafana project root."
    exit 1
fi

# Check if plugin is built
if [ ! -f "Plugins/$PLUGIN_ID/dist/plugin.json" ]; then
    echo -e "${RED}❌ Plugin not built. Building now...${NC}"
    cd "Plugins/$PLUGIN_ID"
    mage -v
    npm run build
    cd ../..
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

# Create backup of current plugin on EC2
echo -e "${YELLOW}💾 Creating backup of current plugin on EC2...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << 'ENDSSH'
    # Create backup directory with timestamp
    BACKUP_DIR="/tmp/grafana-plugin-backup-$(date +%Y%m%d-%H%M%S)"
    sudo mkdir -p "$BACKUP_DIR"
    
    # Backup existing plugin if it exists
    if [ -d "/var/lib/grafana/plugins/fluvio-dynamodb-datasource" ]; then
        echo "📦 Backing up existing plugin..."
        sudo cp -r /var/lib/grafana/plugins/fluvio-dynamodb-datasource "$BACKUP_DIR/"
        echo "✅ Backup created at: $BACKUP_DIR"
    else
        echo "ℹ️  No existing plugin found to backup"
    fi
    
    # Stop Grafana service
    echo "🛑 Stopping Grafana service..."
    sudo systemctl stop grafana-server
    echo "✅ Grafana stopped"
ENDSSH

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
cd "Plugins/$PLUGIN_ID"
tar -czf ../../plugin-deployment.tar.gz dist/
cd ../..

# Upload deployment package to EC2
echo -e "${YELLOW}⬆️  Uploading plugin to EC2...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no plugin-deployment.tar.gz "$EC2_USER@$EC2_HOST:/tmp/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Upload successful${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

# Deploy plugin on EC2
echo -e "${YELLOW}🔧 Deploying plugin on EC2 server...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << 'ENDSSH'
    set -e
    
    echo "🔄 Extracting plugin package..."
    cd /tmp
    tar -xzf plugin-deployment.tar.gz
    
    echo "📁 Preparing plugin directory..."
    # Remove old plugin directory if it exists
    sudo rm -rf /var/lib/grafana/plugins/fluvio-dynamodb-datasource
    
    # Create new plugin directory
    sudo mkdir -p /var/lib/grafana/plugins/fluvio-dynamodb-datasource
    
    echo "📋 Installing plugin files..."
    # Copy all files from dist/ to plugin directory
    sudo cp -r dist/* /var/lib/grafana/plugins/fluvio-dynamodb-datasource/
    
    echo "🔐 Setting permissions..."
    # Set correct ownership and permissions
    sudo chown -R grafana:grafana /var/lib/grafana/plugins/fluvio-dynamodb-datasource
    sudo chmod +x /var/lib/grafana/plugins/fluvio-dynamodb-datasource/gpx_dynamodb_datasource_*
    
    echo "⚙️  Configuring Grafana for unsigned plugins..."
    # Ensure Grafana allows unsigned plugins
    if ! sudo grep -q "allow_loading_unsigned_plugins.*fluvio-connect-dynamodb" /etc/grafana/grafana.ini; then
        sudo sed -i '/\[plugins\]/a allow_loading_unsigned_plugins = fluvio-connect-dynamodb' /etc/grafana/grafana.ini
        echo "✅ Grafana configured to allow unsigned plugins"
    else
        echo "✅ Grafana already configured for unsigned plugins"
    fi
    
    echo "🚀 Starting Grafana service..."
    sudo systemctl start grafana-server
    
    # Wait for Grafana to start
    echo "⏳ Waiting for Grafana to start..."
    sleep 10
    
    echo "🔍 Verifying Grafana is running..."
    if sudo systemctl is-active --quiet grafana-server; then
        echo "✅ Grafana is running"
    else
        echo "❌ Grafana failed to start"
        echo "📋 Grafana status:"
        sudo systemctl status grafana-server
        exit 1
    fi
    
    echo "🧹 Cleaning up..."
    rm -f /tmp/plugin-deployment.tar.gz
    rm -rf /tmp/dist
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo -e "${YELLOW}🔄 Attempting to restore from backup...${NC}"
    
    # Attempt to restore backup if deployment failed
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << 'ENDSSH'
        BACKUP_DIR=$(ls -td /tmp/grafana-plugin-backup-* 2>/dev/null | head -1)
        if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR/fluvio-dynamodb-datasource" ]; then
            echo "🔄 Restoring backup from: $BACKUP_DIR"
            sudo rm -rf /var/lib/grafana/plugins/fluvio-dynamodb-datasource
            sudo cp -r "$BACKUP_DIR/fluvio-dynamodb-datasource" /var/lib/grafana/plugins/
            sudo chown -R grafana:grafana /var/lib/grafana/plugins/fluvio-dynamodb-datasource
            sudo systemctl restart grafana-server
            echo "✅ Backup restored"
        else
            echo "❌ No backup found to restore"
        fi
ENDSSH
    exit 1
fi

# Clean up local files
rm -f plugin-deployment.tar.gz

echo ""
echo -e "${GREEN}✅ Fixed plugin deployed successfully to EC2!${NC}"
echo "=============================================="
echo -e "${YELLOW}🌐 Access your Grafana instance:${NC}"
echo "   http://$EC2_HOST:3000"
echo ""
echo -e "${YELLOW}🔧 What was fixed:${NC}"
echo "✅ Mixed data type handling (no more 'field Depth should have type *string, but got N' errors)"
echo "✅ Pagination support (handles large datasets with NextToken)"
echo "✅ Graceful error handling (converts mixed types to strings)"
echo "✅ Comprehensive logging for debugging"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Login to Grafana (admin/admin)"
echo "2. Go to Connections → Data Sources"
echo "3. Find 'fluvio-connect-dynamodb' data source"
echo "4. Test your 30-day queries - they should now work!"
echo ""
echo -e "${YELLOW}🧪 Test the Fix:${NC}"
echo "Run your problematic query with 30-day time range:"
echo "SELECT * FROM \"datastore-Ai1TelemetryTable-1O5XMXVV3P2CG\""
echo "WHERE (serial_no = '2739' OR serial_no = '23169') AND \$__timeFilter(timestamp)"
echo ""
echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
echo "- SSH to server: ssh -i '$SSH_KEY' $EC2_USER@$EC2_HOST"
echo "- Check Grafana logs: sudo journalctl -u grafana-server -f"
echo "- Verify plugin: ls -la /var/lib/grafana/plugins/fluvio-dynamodb-datasource"
echo "- Plugin status: sudo systemctl status grafana-server"
