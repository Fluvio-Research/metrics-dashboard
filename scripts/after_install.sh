#!/bin/bash
set -e

echo "===== AfterInstall: Configuring deployment ====="
echo "Timestamp: $(date)"

cd /home/ec2-user/metrics-dashboard

# Set proper permissions
echo "Setting file permissions..."
chmod +x metrics-dashboard-dev/bin/grafana-server 2>/dev/null || true
chmod +x metrics-dashboard-dev/bin/grafana-cli 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

# Set executable permissions for Go plugin binaries
echo "Setting plugin binary permissions..."
chmod +x metrics-dashboard-dev/data/plugins/fluvio-connect-dynamodb/gpx_dynamodb_datasource_linux_amd64 2>/dev/null || true

# Verify plugin installation
echo "Verifying plugin installation..."
echo "Plugins directory contents:"
ls -lah metrics-dashboard-dev/data/plugins/ || echo "Plugins directory not found"

if [ -d "metrics-dashboard-dev/data/plugins/fluvio-connect-dynamodb" ]; then
    echo "✓ DynamoDB datasource plugin installed"
    ls -lah metrics-dashboard-dev/data/plugins/fluvio-connect-dynamodb/
else
    echo "✗ DynamoDB datasource plugin NOT found"
fi

if [ -d "metrics-dashboard-dev/data/plugins/fluvio-fluviodynamodbupload-panel" ]; then
    echo "✓ Upload panel plugin installed"
else
    echo "✗ Upload panel plugin NOT found"
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p metrics-dashboard-dev/data/log
mkdir -p metrics-dashboard-dev/data/plugins

# Check if custom config exists, otherwise use default
if [ -f "/home/ec2-user/metrics-dashboard/conf/dev.ini" ]; then
    echo "Using custom configuration from conf/dev.ini"
else
    echo "No custom configuration found, will use defaults"
fi

echo "AfterInstall completed successfully"

