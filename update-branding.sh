#!/bin/bash

# 🎨 Fluvio Cascade Grafana Branding Update Script
# This script allows you to quickly update ALL logos, icons, and branding across Grafana

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎨 Fluvio Cascade Grafana Branding Updater${NC}"
echo "========================================="

# Function to update ALL logo and icon files
update_all_branding_files() {
    local new_logo="$1"
    
    if [ ! -f "$new_logo" ]; then
        echo -e "${YELLOW}❌ Logo file not found: $new_logo${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}📁 Updating ALL branding files...${NC}"
    
    # Get file extension
    local extension="${new_logo##*.}"
    local file_type=$(file "$new_logo" | cut -d: -f2)
    
    echo -e "${BLUE}🔍 Detected file type: $file_type${NC}"
    
    # Handle different file formats for main logos
    if [[ "$file_type" == *"PNG"* ]]; then
        echo -e "${BLUE}📷 Processing PNG image...${NC}"
        # Copy as PNG files
        cp "$new_logo" "grafana-dev/public/img/grafana_icon.png"
        cp "$new_logo" "grafana-dev/public/img/fluvio_icon.png"
        
        # Update Branding.tsx to use PNG imports
        sed -i.bak 's/grafana_icon\.svg/grafana_icon.png/g' grafana-dev/public/app/core/components/Branding/Branding.tsx
        sed -i.bak 's/fluvio_icon\.svg/fluvio_icon.png/g' grafana-dev/public/app/core/components/Branding/Branding.tsx
        sed -i.bak 's/grafanaIconSvg/grafanaIconPng/g' grafana-dev/public/app/core/components/Branding/Branding.tsx
        sed -i.bak 's/fluvioIconSvg/fluvioIconPng/g' grafana-dev/public/app/core/components/Branding/Branding.tsx
        
    elif [[ "$file_type" == *"SVG"* ]]; then
        echo -e "${BLUE}🎨 Processing SVG image...${NC}"
        # Copy as SVG files
        cp "$new_logo" "grafana-dev/public/img/grafana_icon.svg"
        cp "$new_logo" "grafana-dev/public/img/fluvio_icon.svg"
        
        # Update Branding.tsx to use SVG imports
        sed -i.bak 's/grafana_icon\.png/grafana_icon.svg/g' grafana-dev/public/app/core/components/Branding/Branding.tsx
        sed -i.bak 's/fluvio_icon\.png/fluvio_icon.svg/g' grafana-dev/public/app/core/components/Branding/Branding.tsx
        sed -i.bak 's/grafanaIconPng/grafanaIconSvg/g' grafana-dev/public/app/core/components/Branding/Branding.tsx
        sed -i.bak 's/fluvioIconPng/fluvioIconSvg/g' grafana-dev/public/app/core/components/Branding/Branding.tsx
    else
        echo -e "${YELLOW}⚠️  Unsupported file format. Converting to PNG...${NC}"
        # Copy as PNG (default fallback)
        cp "$new_logo" "grafana-dev/public/img/grafana_icon.png"
        cp "$new_logo" "grafana-dev/public/img/fluvio_icon.png"
    fi
    
    # Update ALL icon types for complete branding
    echo -e "${PURPLE}🔄 Updating favicon and app icons...${NC}"
    
    # Favicon (32x32 PNG used by browsers)
    cp "$new_logo" "grafana-dev/public/img/fav32.png"
    echo -e "${GREEN}  ✅ Updated fav32.png (browser favicon)${NC}"
    
    # Apple Touch Icon (for iOS/mobile bookmarks)
    cp "$new_logo" "grafana-dev/public/img/apple-touch-icon.png"
    echo -e "${GREEN}  ✅ Updated apple-touch-icon.png (mobile bookmarks)${NC}"
    
    # Favicon.ico (legacy browser support)
    cp "$new_logo" "grafana-dev/public/favicon.ico"
    echo -e "${GREEN}  ✅ Updated favicon.ico (legacy browsers)${NC}"
    
    # Additional icon locations that might be used
    if [ -f "grafana-dev/public/img/grafana_com_auth_icon.svg" ]; then
        cp "$new_logo" "grafana-dev/public/img/fluvio_com_auth_icon.svg" 2>/dev/null || true
        echo -e "${GREEN}  ✅ Updated auth icon${NC}"
    fi
    
    # Clean up backup files
    rm -f grafana-dev/public/app/core/components/Branding/Branding.tsx.bak
    
    echo -e "${GREEN}✅ ALL branding files updated!${NC}"
}

# Function to rebuild and restart
rebuild_and_restart() {
    echo -e "${GREEN}🔨 Rebuilding frontend...${NC}"
    cd grafana-dev
    yarn build
    
    echo -e "${GREEN}🔄 Restarting Grafana...${NC}"
    ./dev.sh restart
    cd ..
    echo -e "${GREEN}✅ Grafana restarted!${NC}"
}

# Function to show current branding status
show_branding_status() {
    echo -e "${BLUE}📊 Current Branding Status:${NC}"
    echo "=================================="
    echo -e "${PURPLE}Main Logos:${NC}"
    ls -la grafana-dev/public/img/grafana_icon.* grafana-dev/public/img/fluvio_icon.* 2>/dev/null | sed 's/^/  /'
    
    echo -e "${PURPLE}Favicon & Icons:${NC}"
    ls -la grafana-dev/public/img/fav32.png grafana-dev/public/img/apple-touch-icon.png grafana-dev/public/favicon.ico 2>/dev/null | sed 's/^/  /'
    
    echo -e "${PURPLE}Configuration:${NC}"
    echo "  - Centralized config: grafana-dev/public/app/core/components/Branding/Branding.tsx"
    echo "  - App Title: Fluvio Cascade"
    echo "  - Login Title: Welcome to Fluvio Cascade"
}

# Main script logic
if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <path-to-new-logo> [--status]"
    echo ""
    echo "🎯 This script updates ALL Fluvio Cascade branding elements:"
    echo "  • Main logos (login, navigation, menus)"
    echo "  • Favicon (browser tab icon)"
    echo "  • Apple Touch Icon (mobile bookmarks)"
    echo "  • Legacy favicon.ico"
    echo "  • App titles and branding text"
    echo ""
    echo "Supported formats: PNG, SVG"
    echo ""
    echo "Examples:"
    echo "  $0 /path/to/my-new-logo.png       # Update all branding"
    echo "  $0 --status                       # Show current status"
    echo ""
    echo "🏢 Current Fluvio Cascade Branding Setup:"
    show_branding_status
    exit 1
fi

# Handle status command
if [ "$1" == "--status" ]; then
    show_branding_status
    exit 0
fi

NEW_LOGO="$1"

echo -e "${BLUE}🚀 Updating ALL Fluvio Cascade branding with: $NEW_LOGO${NC}"
echo ""

update_all_branding_files "$NEW_LOGO"
rebuild_and_restart

echo ""
echo -e "${GREEN}🎉 Complete Fluvio Cascade branding update finished!${NC}"
echo -e "${BLUE}🌐 Access your updated Fluvio Cascade at: http://localhost:3000${NC}"
echo ""
echo -e "${PURPLE}Updated elements:${NC}"
echo "  ✅ Login screen logo"
echo "  ✅ Navigation menu logo" 
echo "  ✅ Browser favicon"
echo "  ✅ Mobile bookmark icon"
echo "  ✅ App titles and text"
echo ""
echo -e "${YELLOW}💡 Tip: Hard refresh your browser (Cmd+Shift+R) to see favicon changes${NC}" 