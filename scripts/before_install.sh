#!/bin/bash
set -e

echo "===== BeforeInstall: Preparing for deployment ====="
echo "Timestamp: $(date)"
echo "User: $(whoami)"
echo "Working directory: $(pwd)"

# Stop any running Grafana instance
echo "Stopping any running Grafana processes..."
pkill -f grafana-server || true
sleep 2

# Backup existing installation if it exists
if [ -d "/home/ec2-user/metrics-dashboard" ]; then
    BACKUP_DIR="/home/ec2-user/metrics-dashboard.backup.$(date +%s)"
    echo "Backing up existing installation to: $BACKUP_DIR"
    mv /home/ec2-user/metrics-dashboard "$BACKUP_DIR" || true
    
    # Keep only last 3 backups
    echo "Cleaning up old backups (keeping last 3)..."
    cd /home/ec2-user
    ls -dt metrics-dashboard.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf || true
fi

echo "BeforeInstall completed successfully"

