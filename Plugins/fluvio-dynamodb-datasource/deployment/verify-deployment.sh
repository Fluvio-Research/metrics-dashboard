#!/bin/bash

# Fluvio DynamoDB Plugin Deployment Verification Script
# This script verifies that the plugin is correctly installed and functioning

set -e

PLUGIN_ID="fluvio-dynamodb-datasource"
GRAFANA_PLUGINS_DIR="/var/lib/grafana/plugins"
GRAFANA_CONFIG="/etc/grafana/grafana.ini"
GRAFANA_SERVICE="grafana-server"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Fluvio DynamoDB Plugin Deployment Verification${NC}"
echo "=================================================="

# Test 1: Check if plugin directory exists
echo -e "${YELLOW}1. Checking plugin directory...${NC}"
if [ -d "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID" ]; then
    echo -e "${GREEN}   ✅ Plugin directory exists${NC}"
else
    echo -e "${RED}   ❌ Plugin directory not found: $GRAFANA_PLUGINS_DIR/$PLUGIN_ID${NC}"
    exit 1
fi

# Test 2: Check plugin.json file
echo -e "${YELLOW}2. Verifying plugin.json...${NC}"
if [ -f "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID/plugin.json" ]; then
    echo -e "${GREEN}   ✅ plugin.json exists${NC}"
    # Check if it's valid JSON
    if python3 -m json.tool "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID/plugin.json" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ plugin.json is valid JSON${NC}"
    else
        echo -e "${RED}   ❌ plugin.json is not valid JSON${NC}"
        exit 1
    fi
else
    echo -e "${RED}   ❌ plugin.json not found${NC}"
    exit 1
fi

# Test 3: Check executable binary
echo -e "${YELLOW}3. Verifying plugin binary...${NC}"
if [ -f "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID/fluvio-dynamodb-datasource" ]; then
    echo -e "${GREEN}   ✅ Binary exists${NC}"
    if [ -x "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID/fluvio-dynamodb-datasource" ]; then
        echo -e "${GREEN}   ✅ Binary is executable${NC}"
    else
        echo -e "${RED}   ❌ Binary is not executable${NC}"
        exit 1
    fi
else
    echo -e "${RED}   ❌ Binary not found${NC}"
    exit 1
fi

# Test 4: Check file permissions
echo -e "${YELLOW}4. Checking file permissions...${NC}"
OWNER=$(stat -c '%U' "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID" 2>/dev/null || stat -f '%Su' "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID")
if [ "$OWNER" = "grafana" ]; then
    echo -e "${GREEN}   ✅ Correct file ownership (grafana)${NC}"
else
    echo -e "${RED}   ❌ Incorrect file ownership: $OWNER (should be grafana)${NC}"
fi

# Test 5: Check Grafana configuration
echo -e "${YELLOW}5. Verifying Grafana configuration...${NC}"
if [ -f "$GRAFANA_CONFIG" ]; then
    if grep -q "allow_loading_unsigned_plugins.*$PLUGIN_ID" "$GRAFANA_CONFIG"; then
        echo -e "${GREEN}   ✅ Plugin allowed in Grafana config${NC}"
    else
        echo -e "${RED}   ❌ Plugin not found in unsigned plugins allowlist${NC}"
        echo -e "${YELLOW}   💡 Run: sudo ./configure-grafana.sh${NC}"
    fi
else
    echo -e "${RED}   ❌ Grafana config file not found${NC}"
fi

# Test 6: Check Grafana service status
echo -e "${YELLOW}6. Checking Grafana service...${NC}"
if systemctl is-active --quiet $GRAFANA_SERVICE; then
    echo -e "${GREEN}   ✅ Grafana service is running${NC}"
else
    echo -e "${RED}   ❌ Grafana service is not running${NC}"
    echo -e "${YELLOW}   💡 Run: sudo systemctl start grafana-server${NC}"
fi

# Test 7: Test plugin binary execution
echo -e "${YELLOW}7. Testing plugin binary...${NC}"
if sudo -u grafana timeout 5s "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID/fluvio-dynamodb-datasource" --help >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Plugin binary executes successfully${NC}"
else
    echo -e "${YELLOW}   ⚠️  Plugin binary test inconclusive (timeout or no --help flag)${NC}"
fi

# Test 8: Check required files
echo -e "${YELLOW}8. Checking required plugin files...${NC}"
REQUIRED_FILES=("plugin.json" "module.js" "fluvio-dynamodb-datasource")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$GRAFANA_PLUGINS_DIR/$PLUGIN_ID/$file" ]; then
        echo -e "${GREEN}   ✅ $file exists${NC}"
    else
        echo -e "${RED}   ❌ $file missing${NC}"
    fi
done

# Test 9: Check plugin logs (if available)
echo -e "${YELLOW}9. Checking recent Grafana logs for plugin activity...${NC}"
if command -v journalctl >/dev/null 2>&1; then
    if journalctl -u grafana-server --since "10 minutes ago" | grep -i "$PLUGIN_ID" >/dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Plugin activity found in logs${NC}"
    else
        echo -e "${YELLOW}   ⚠️  No recent plugin activity in logs${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  journalctl not available, skipping log check${NC}"
fi

echo ""
echo -e "${BLUE}📋 Verification Summary${NC}"
echo "=================================================="
echo -e "Plugin ID: ${YELLOW}$PLUGIN_ID${NC}"
echo -e "Plugin Path: ${YELLOW}$GRAFANA_PLUGINS_DIR/$PLUGIN_ID${NC}"
echo -e "Grafana Service: ${YELLOW}$(systemctl is-active $GRAFANA_SERVICE 2>/dev/null || echo 'unknown')${NC}"

echo ""
echo -e "${BLUE}🚀 Next Steps${NC}"
echo "=================================================="
echo "1. Access Grafana: http://your-server-ip:3000"
echo "2. Login with admin credentials"
echo "3. Go to Configuration → Data Sources"
echo "4. Click 'Add data source'"
echo "5. Look for 'Fluvio DynamoDB' in the list"
echo ""
echo -e "${YELLOW}🔧 Troubleshooting Commands:${NC}"
echo "- View Grafana logs: sudo journalctl -u grafana-server -f"
echo "- Restart Grafana: sudo systemctl restart grafana-server"
echo "- Check plugin permissions: ls -la $GRAFANA_PLUGINS_DIR/$PLUGIN_ID"
echo "- Test binary: sudo -u grafana $GRAFANA_PLUGINS_DIR/$PLUGIN_ID/fluvio-dynamodb-datasource"

echo ""
echo -e "${GREEN}🎉 Verification completed!${NC}"
