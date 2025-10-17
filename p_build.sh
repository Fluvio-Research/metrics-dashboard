#!/bin/bash

# Plugin Build and Deploy Script
# This script builds both the DynamoDB datasource and upload panel plugins
# and deploys them to the Grafana data/plugins directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATASOURCE_DIR="$WORKSPACE_ROOT/Plugins/fluvio-connect-dynamodb"
UPLOAD_PANEL_DIR="$WORKSPACE_ROOT/Plugins/fluvio-fluviodynamodbupload-panel"
TARGET_PLUGINS_DIR="$WORKSPACE_ROOT/metrics-dashboard-dev/data/plugins"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}>>> $1${NC}"
}

# Function to check if a directory exists
check_dir() {
    if [ ! -d "$1" ]; then
        print_error "Directory not found: $1"
        exit 1
    fi
}

# Function to build upload panel plugin
build_upload_panel() {
    print_section "Building Upload Panel Plugin"
    
    cd "$UPLOAD_PANEL_DIR"
    
    print_status "Building plugin..."
    npm run build
    
    print_status "Upload panel build complete!"
}

# Function to build datasource plugin
build_datasource() {
    print_section "Building DynamoDB Datasource Plugin"
    
    cd "$DATASOURCE_DIR"
    
    print_status "Installing frontend dependencies..."
    npm install --silent
    
    print_status "Building frontend..."
    npm run build
    
    print_status "Building backend with mage..."
    mage -v
    
    print_status "Datasource plugin build complete!"
}

# Function to deploy upload panel
deploy_upload_panel() {
    print_section "Deploying Upload Panel Plugin"
    
    local target_dir="$TARGET_PLUGINS_DIR/fluvio-fluviodynamodbupload-panel"
    
    # Create target directory if it doesn't exist
    mkdir -p "$target_dir"
    
    # Copy new version (copy contents, not the dist folder itself)
    print_status "Copying to $target_dir..."
    cp -r "$UPLOAD_PANEL_DIR/dist/"* "$target_dir/"
    
    print_status "Upload panel deployed!"
}

# Function to deploy datasource plugin
deploy_datasource() {
    print_section "Deploying DynamoDB Datasource Plugin"
    
    local target_dir="$TARGET_PLUGINS_DIR/fluvio-connect-dynamodb"
    
    # Create target directory if it doesn't exist
    mkdir -p "$target_dir"
    
    # Copy new version (copy contents, not the dist folder itself)
    print_status "Copying to $target_dir..."
    cp -r "$DATASOURCE_DIR/dist/"* "$target_dir/"
    
    print_status "Datasource plugin deployed!"
}

# Function to show build summary
show_summary() {
    print_section "Build Summary"
    
    echo ""
    echo "Plugin locations:"
    echo "  • Upload Panel:  $TARGET_PLUGINS_DIR/fluvio-fluviodynamodbupload-panel"
    echo "  • Datasource:    $TARGET_PLUGINS_DIR/fluvio-connect-dynamodb"
    echo ""
    
    print_status "All plugins built and deployed successfully!"
    print_warning "Restart Grafana to load the updated plugins:"
    echo "  ./dev.sh restart"
}

# Main execution
main() {
    print_header "Plugin Build & Deploy"
    
    # Check if required directories exist
    check_dir "$DATASOURCE_DIR"
    check_dir "$UPLOAD_PANEL_DIR"
    check_dir "$TARGET_PLUGINS_DIR"
    
    # Parse command line arguments
    BUILD_DATASOURCE=true
    BUILD_UPLOAD=true
    SKIP_DEPLOY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --datasource-only)
                BUILD_UPLOAD=false
                shift
                ;;
            --upload-only)
                BUILD_DATASOURCE=false
                shift
                ;;
            --no-deploy)
                SKIP_DEPLOY=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --datasource-only    Build only the datasource plugin"
                echo "  --upload-only        Build only the upload panel plugin"
                echo "  --no-deploy          Build but don't deploy to data/plugins"
                echo "  --help, -h           Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                          # Build and deploy both plugins"
                echo "  $0 --datasource-only        # Build and deploy only datasource"
                echo "  $0 --upload-only            # Build and deploy only upload panel"
                echo "  $0 --no-deploy              # Build both but don't deploy"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Build plugins
    if [ "$BUILD_DATASOURCE" = true ]; then
        build_datasource
    fi
    
    if [ "$BUILD_UPLOAD" = true ]; then
        build_upload_panel
    fi
    
    # Deploy plugins (unless --no-deploy is specified)
    if [ "$SKIP_DEPLOY" = false ]; then
        if [ "$BUILD_DATASOURCE" = true ]; then
            deploy_datasource
        fi
        
        if [ "$BUILD_UPLOAD" = true ]; then
            deploy_upload_panel
        fi
        
        show_summary
        
        # Restart Grafana automatically
        print_section "Restarting Grafana"
        cd "$WORKSPACE_ROOT"
        ./dev.sh restart
    else
        print_section "Skipping Deployment"
        print_status "Plugins built but not deployed (--no-deploy flag used)"
        
        # Return to workspace root
        cd "$WORKSPACE_ROOT"
    fi
}

# Run main function
main "$@"

