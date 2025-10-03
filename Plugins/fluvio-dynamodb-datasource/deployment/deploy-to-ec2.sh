#!/bin/bash

# Fluvio DynamoDB DataSource Plugin Deployment Script for EC2
# This script deploys the plugin to a production Grafana server on EC2

set -e

# Configuration
PLUGIN_ID="fluvio-dynamodb-datasource"
PLUGIN_VERSION="1.0.0"
GRAFANA_PLUGINS_DIR="/var/lib/grafana/plugins"
GRAFANA_USER="grafana"
GRAFANA_SERVICE="grafana-server"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Fluvio DynamoDB DataSource Plugin Deployment${NC}"
echo "=================================================="
echo "Plugin ID: $PLUGIN_ID"
echo "Version: $PLUGIN_VERSION"
echo "Target: $GRAFANA_PLUGINS_DIR"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Check if Grafana is installed
if ! systemctl list-units --full -all | grep -Fq "$GRAFANA_SERVICE"; then
    echo -e "${RED}❌ Grafana service not found. Please install Grafana first.${NC}"
    exit 1
fi

# Create plugins directory if it doesn't exist
if [ ! -d "$GRAFANA_PLUGINS_DIR" ]; then
    echo -e "${YELLOW}📁 Creating plugins directory: $GRAFANA_PLUGINS_DIR${NC}"
    mkdir -p "$GRAFANA_PLUGINS_DIR"
    chown $GRAFANA_USER:$GRAFANA_USER "$GRAFANA_PLUGINS_DIR"
fi

# Stop Grafana service
echo -e "${YELLOW}⏹️  Stopping Grafana service...${NC}"
systemctl stop $GRAFANA_SERVICE

# Remove existing plugin if it exists
if [ -d "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID" ]; then
    echo -e "${YELLOW}🗑️  Removing existing plugin installation...${NC}"
    rm -rf "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID"
fi

# Copy plugin files
echo -e "${YELLOW}📋 Installing plugin files...${NC}"
cp -r "$PLUGIN_ID" "$GRAFANA_PLUGINS_DIR/"

# Set correct permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
chown -R $GRAFANA_USER:$GRAFANA_USER "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID"
chmod +x "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID/fluvio-dynamodb-datasource"

# Verify installation
if [ -f "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID/plugin.json" ] && [ -x "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID/fluvio-dynamodb-datasource" ]; then
    echo -e "${GREEN}✅ Plugin files installed successfully${NC}"
else
    echo -e "${RED}❌ Plugin installation failed - missing files${NC}"
    exit 1
fi

# Start Grafana service
echo -e "${YELLOW}▶️  Starting Grafana service...${NC}"
systemctl start $GRAFANA_SERVICE

# Wait for Grafana to start
echo -e "${YELLOW}⏳ Waiting for Grafana to start...${NC}"
sleep 5

# Check if Grafana is running
if systemctl is-active --quiet $GRAFANA_SERVICE; then
    echo -e "${GREEN}✅ Grafana service is running${NC}"
else
    echo -e "${RED}❌ Grafana service failed to start${NC}"
    systemctl status $GRAFANA_SERVICE
    exit 1
fi

# Enable Grafana service to start on boot
systemctl enable $GRAFANA_SERVICE

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================================="
echo "✅ Plugin installed: $PLUGIN_ID v$PLUGIN_VERSION"
echo "✅ Grafana service: Running and enabled"
echo "✅ Plugin location: $GRAFANA_PLUGINS_DIR/$PLUGIN_ID"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Access Grafana web interface"
echo "2. Go to Configuration > Data Sources"
echo "3. Add new data source and select 'Fluvio DynamoDB'"
echo "4. Configure AWS credentials and region"
echo ""
echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
echo "- Check Grafana logs: sudo journalctl -u grafana-server -f"
echo "- Verify plugin: ls -la $GRAFANA_PLUGINS_DIR/$PLUGIN_ID"
echo "- Test binary: sudo -u grafana $GRAFANA_PLUGINS_DIR/$PLUGIN_ID/fluvio-dynamodb-datasource --help"
