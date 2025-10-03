#!/bin/bash

# Grafana Configuration Script for Fluvio DynamoDB Plugin
# This script configures Grafana to allow the unsigned plugin

set -e

PLUGIN_ID="fluvio-dynamodb-datasource"
GRAFANA_CONFIG="/etc/grafana/grafana.ini"
GRAFANA_SERVICE="grafana-server"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Configuring Grafana for Fluvio DynamoDB Plugin${NC}"
echo "=================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Check if Grafana config exists
if [ ! -f "$GRAFANA_CONFIG" ]; then
    echo -e "${RED}❌ Grafana configuration file not found: $GRAFANA_CONFIG${NC}"
    exit 1
fi

# Backup original config
echo -e "${YELLOW}💾 Creating backup of Grafana configuration...${NC}"
cp "$GRAFANA_CONFIG" "$GRAFANA_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"

# Check if plugins section exists and configure unsigned plugins
echo -e "${YELLOW}⚙️  Configuring unsigned plugin allowlist...${NC}"

if grep -q "^\[plugins\]" "$GRAFANA_CONFIG"; then
    # Plugins section exists
    if grep -q "^allow_loading_unsigned_plugins" "$GRAFANA_CONFIG"; then
        # Setting exists, check if our plugin is already listed
        if grep "^allow_loading_unsigned_plugins" "$GRAFANA_CONFIG" | grep -q "$PLUGIN_ID"; then
            echo -e "${GREEN}✅ Plugin already configured in allowlist${NC}"
        else
            # Add our plugin to existing list
            sed -i.tmp "s/^allow_loading_unsigned_plugins = \(.*\)/allow_loading_unsigned_plugins = \1,$PLUGIN_ID/" "$GRAFANA_CONFIG"
            echo -e "${GREEN}✅ Added plugin to existing allowlist${NC}"
        fi
    else
        # Add setting under plugins section
        sed -i.tmp "/^\[plugins\]/a allow_loading_unsigned_plugins = $PLUGIN_ID" "$GRAFANA_CONFIG"
        echo -e "${GREEN}✅ Added plugin allowlist setting${NC}"
    fi
else
    # No plugins section, add it
    echo "" >> "$GRAFANA_CONFIG"
    echo "[plugins]" >> "$GRAFANA_CONFIG"
    echo "allow_loading_unsigned_plugins = $PLUGIN_ID" >> "$GRAFANA_CONFIG"
    echo -e "${GREEN}✅ Created plugins section and added allowlist${NC}"
fi

# Remove temporary file if it exists
[ -f "$GRAFANA_CONFIG.tmp" ] && rm "$GRAFANA_CONFIG.tmp"

# Verify configuration
echo -e "${YELLOW}🔍 Verifying configuration...${NC}"
if grep -A 5 "^\[plugins\]" "$GRAFANA_CONFIG" | grep -q "$PLUGIN_ID"; then
    echo -e "${GREEN}✅ Configuration verified successfully${NC}"
    echo ""
    echo "Current plugins configuration:"
    grep -A 10 "^\[plugins\]" "$GRAFANA_CONFIG" | head -5
else
    echo -e "${RED}❌ Configuration verification failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Grafana configuration completed!${NC}"
echo "=================================================="
echo "✅ Backup created: $GRAFANA_CONFIG.backup.*"
echo "✅ Plugin allowlist updated: $PLUGIN_ID"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Restart Grafana service: sudo systemctl restart grafana-server"
echo "2. Deploy the plugin using deploy-to-ec2.sh"
echo "3. Access Grafana web interface to verify plugin loading"
