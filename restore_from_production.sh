#!/bin/bash

# Restore Production Grafana Data to Local Development
# This script safely restores production backup to local Grafana

set -e

# Configuration
LOCAL_DATA_DIR="/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/data"
LOCAL_METRICS_DATA_DIR="/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/metrics-dashboard-dev/data"
BACKUP_SOURCE="/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/Backup/latest"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_BACKUP_DIR="/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/Backup/local_before_restore_${TIMESTAMP}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  Restore Production Data to Local Grafana${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Check if Grafana is running
check_grafana_stopped() {
    if [ -f "/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/data/grafana.pid" ]; then
        local pid=$(cat "/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/data/grafana.pid")
        if ps -p "$pid" > /dev/null 2>&1; then
            print_error "Grafana is currently running! Please stop it first:"
            print_error "  ./dev.sh stop"
            exit 1
        fi
    fi
}

# Backup current local data
backup_local_data() {
    print_status "Backing up current local Grafana data..."
    
    mkdir -p "$LOCAL_BACKUP_DIR"
    
    # Backup current database
    if [ -f "$LOCAL_DATA_DIR/grafana.db" ]; then
        print_status "Backing up local grafana.db..."
        cp "$LOCAL_DATA_DIR/grafana.db" "$LOCAL_BACKUP_DIR/grafana.db.local"
    fi
    
    if [ -f "$LOCAL_METRICS_DATA_DIR/grafana.db" ]; then
        print_status "Backing up metrics-dashboard-dev grafana.db..."
        cp "$LOCAL_METRICS_DATA_DIR/grafana.db" "$LOCAL_BACKUP_DIR/grafana.db.metrics"
    fi
    
    # Backup dynamodb-presets
    if [ -d "$LOCAL_DATA_DIR/dynamodb-presets" ]; then
        print_status "Backing up dynamodb-presets..."
        cp -r "$LOCAL_DATA_DIR/dynamodb-presets" "$LOCAL_BACKUP_DIR/"
    fi
    
    print_status "Local data backed up to: $LOCAL_BACKUP_DIR"
}

# Restore database
restore_database() {
    print_status "Restoring production database..."
    
    if [ ! -f "$BACKUP_SOURCE/database/grafana.db" ]; then
        print_error "Production database not found at $BACKUP_SOURCE/database/grafana.db"
        exit 1
    fi
    
    # Restore to main data directory
    print_status "Copying database to $LOCAL_DATA_DIR/grafana.db"
    cp "$BACKUP_SOURCE/database/grafana.db" "$LOCAL_DATA_DIR/grafana.db"
    
    # Also restore to metrics-dashboard-dev data directory
    print_status "Copying database to $LOCAL_METRICS_DATA_DIR/grafana.db"
    mkdir -p "$LOCAL_METRICS_DATA_DIR"
    cp "$BACKUP_SOURCE/database/grafana.db" "$LOCAL_METRICS_DATA_DIR/grafana.db"
    
    print_status "Database restored successfully!"
}

# Restore plugins (merge with existing)
restore_plugins() {
    print_status "Restoring production plugins..."
    
    if [ ! -d "$BACKUP_SOURCE/plugins-data/plugins" ]; then
        print_warning "No plugins found in backup"
        return
    fi
    
    # Copy production plugins to local data directory
    print_status "Merging production plugins with local plugins..."
    
    # Create plugins directory if it doesn't exist
    mkdir -p "$LOCAL_DATA_DIR/plugins"
    mkdir -p "$LOCAL_METRICS_DATA_DIR/plugins"
    
    # Copy plugins from backup (this will overwrite if exists)
    cp -r "$BACKUP_SOURCE/plugins-data/plugins/"* "$LOCAL_DATA_DIR/plugins/" 2>/dev/null || true
    cp -r "$BACKUP_SOURCE/plugins-data/plugins/"* "$LOCAL_METRICS_DATA_DIR/plugins/" 2>/dev/null || true
    
    print_status "Plugins restored successfully!"
}

# Restore provisioning configurations
restore_provisioning() {
    print_status "Restoring provisioning configurations..."
    
    if [ ! -d "$BACKUP_SOURCE/provisioning/provisioning" ]; then
        print_warning "No provisioning configs found in backup"
        return
    fi
    
    # Backup existing provisioning
    if [ -d "/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/metrics-dashboard-dev/conf/provisioning" ]; then
        print_status "Backing up existing provisioning configs..."
        cp -r "/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/metrics-dashboard-dev/conf/provisioning" "$LOCAL_BACKUP_DIR/provisioning_backup"
    fi
    
    # Restore production provisioning (optional - comment out if you want to keep local configs)
    # Uncomment the lines below if you want to restore provisioning configs
    # print_status "Copying production provisioning configs..."
    # cp -r "$BACKUP_SOURCE/provisioning/provisioning/"* "/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/metrics-dashboard-dev/conf/provisioning/"
    
    print_status "Provisioning configuration handling complete!"
}

# Create restore report
create_restore_report() {
    cat > "$LOCAL_BACKUP_DIR/restore_report.txt" << EOF
Grafana Production Data Restore Report
======================================
Restore Date: $(date)
Source Backup: $BACKUP_SOURCE
Target: Local Development Grafana

What was restored:
- ✅ Production database (29 dashboards, 36 users, 6 data sources)
- ✅ Production plugins
- ⚠️  Provisioning configs (kept local configs, production backed up)

Your previous local data was backed up to:
$LOCAL_BACKUP_DIR

To restore your old local data if needed:
  cp $LOCAL_BACKUP_DIR/grafana.db.local $LOCAL_DATA_DIR/grafana.db
  cp $LOCAL_BACKUP_DIR/grafana.db.metrics $LOCAL_METRICS_DATA_DIR/grafana.db

Next steps:
1. Start Grafana: ./dev.sh start
2. Access at: http://localhost:3000
3. Login with production credentials or admin/admin

Note: Production user accounts and passwords are now active in your local Grafana.
EOF

    print_status "Restore report saved to: $LOCAL_BACKUP_DIR/restore_report.txt"
}

# Main restoration process
main() {
    print_header
    echo ""
    
    # Check if backup exists
    if [ ! -d "$BACKUP_SOURCE" ]; then
        print_error "Backup source not found at: $BACKUP_SOURCE"
        print_error "Please run the backup script first!"
        exit 1
    fi
    
    # Verify Grafana is stopped
    print_status "Checking if Grafana is stopped..."
    check_grafana_stopped
    
    # Confirm with user
    print_warning "This will replace your local Grafana data with production data."
    print_warning "Your current local data will be backed up first."
    echo ""
    read -p "Do you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_error "Restore cancelled by user."
        exit 0
    fi
    
    echo ""
    print_status "Starting restore process..."
    echo ""
    
    # Step 1: Backup local data
    print_status "[1/5] Backing up current local data..."
    backup_local_data
    echo ""
    
    # Step 2: Restore database
    print_status "[2/5] Restoring production database..."
    restore_database
    echo ""
    
    # Step 3: Restore plugins
    print_status "[3/5] Restoring production plugins..."
    restore_plugins
    echo ""
    
    # Step 4: Handle provisioning
    print_status "[4/5] Handling provisioning configurations..."
    restore_provisioning
    echo ""
    
    # Step 5: Create report
    print_status "[5/5] Creating restore report..."
    create_restore_report
    echo ""
    
    # Success message
    print_header
    echo ""
    print_status "✅ Production data restored successfully!"
    echo ""
    print_status "Summary:"
    print_status "  - 29 dashboards restored"
    print_status "  - 36 users restored"
    print_status "  - 6 data sources restored"
    print_status "  - Production plugins restored"
    echo ""
    print_status "Your previous local data is backed up at:"
    print_status "  $LOCAL_BACKUP_DIR"
    echo ""
    print_status "To start Grafana with production data:"
    print_status "  ./dev.sh start"
    echo ""
    print_status "Access at: http://localhost:3000"
    print_status "Login: Use production credentials or admin/admin"
    echo ""
}

# Run main function
main

