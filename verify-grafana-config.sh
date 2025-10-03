#!/bin/bash

# Grafana Configuration Verification Script
echo "🔍 VERIFYING GRAFANA IFRAME CONFIGURATION..."
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test if Grafana is running
echo "1. Testing Grafana connectivity..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Grafana is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Grafana is not running. Please start Grafana first.${NC}"
    exit 1
fi

echo

# Check for X-Frame-Options header
echo "2. Checking X-Frame-Options header..."
FRAME_OPTIONS=$(curl -I "http://localhost:3000/d/fe6gvk235v5s0f?orgId=1&kiosk=true" 2>/dev/null | grep -i "x-frame-options" | tr -d '\r')

if [ -z "$FRAME_OPTIONS" ]; then
    echo -e "${GREEN}✅ No X-Frame-Options header found - iframe embedding allowed${NC}"
    IFRAME_OK=true
elif echo "$FRAME_OPTIONS" | grep -qi "deny"; then
    echo -e "${RED}❌ X-Frame-Options: deny found - iframe embedding blocked${NC}"
    echo -e "${YELLOW}   Configuration changes not applied. Restart Grafana!${NC}"
    IFRAME_OK=false
else
    echo -e "${YELLOW}⚠️  X-Frame-Options found: $FRAME_OPTIONS${NC}"
    IFRAME_OK=false
fi

echo

# Check anonymous access
echo "3. Testing anonymous access..."
ANON_TEST=$(curl -s "http://localhost:3000/api/org" 2>/dev/null)
if echo "$ANON_TEST" | grep -q '"name"'; then
    echo -e "${GREEN}✅ Anonymous access working${NC}"
else
    echo -e "${RED}❌ Anonymous access not working${NC}"
    echo -e "${YELLOW}   Check [auth.anonymous] enabled = true in config${NC}"
fi

echo

# Test dashboard direct access
echo "4. Testing dashboard direct access..."
DASHBOARD_TEST=$(curl -s -w "%{http_code}" "http://localhost:3000/d/fe6gvk235v5s0f?orgId=1&kiosk=true" -o /dev/null)
if [ "$DASHBOARD_TEST" = "200" ]; then
    echo -e "${GREEN}✅ Dashboard accessible at: http://localhost:3000/d/fe6gvk235v5s0f?orgId=1&kiosk=true${NC}"
else
    echo -e "${RED}❌ Dashboard returned HTTP $DASHBOARD_TEST${NC}"
fi

echo

# Final verdict
echo "📊 CONFIGURATION STATUS:"
if [ "$IFRAME_OK" = true ]; then
    echo -e "${GREEN}🎉 IFRAME EMBEDDING READY!${NC}"
    echo
    echo "✅ Your Laravel developer can now use iframes with:"
    echo "   http://localhost:3000/d/{dashboard-uid}?orgId=1&kiosk=true&theme=light"
    echo
    echo "✅ Test iframe HTML:"
    echo '   <iframe src="http://localhost:3000/d/fe6gvk235v5s0f?orgId=1&kiosk=true" width="100%" height="600"></iframe>'
else
    echo -e "${RED}❌ IFRAME EMBEDDING BLOCKED${NC}"
    echo
    echo -e "${YELLOW}REQUIRED ACTIONS:${NC}"
    echo "1. Restart Grafana completely:"
    echo "   pkill -f grafana-server"
    echo "   ./dev.sh"
    echo
    echo "2. Verify these settings in conf/dev.ini:"
    echo "   [security]"
    echo "   allow_embedding = true"
    echo "   cookie_samesite = none"
    echo "   content_security_policy = false"
    echo
    echo "   [auth.anonymous]" 
    echo "   enabled = true"
    echo "   org_role = Viewer"
    echo
    echo "3. Run this script again after restart"
fi

echo 