#!/bin/bash
set -e

echo "===== ApplicationStart: Starting Grafana ====="
echo "Timestamp: $(date)"

cd /home/ec2-user/metrics-dashboard/metrics-dashboard-dev

# Check if Grafana binary exists
if [ ! -f "bin/grafana-server" ]; then
    echo "ERROR: Grafana binary not found at bin/grafana-server"
    exit 1
fi

# Set environment variables
export GF_PATHS_DATA=/home/ec2-user/metrics-dashboard/metrics-dashboard-dev/data
export GF_PATHS_LOGS=/home/ec2-user/metrics-dashboard/metrics-dashboard-dev/data/log
export GF_PATHS_PLUGINS=/home/ec2-user/metrics-dashboard/metrics-dashboard-dev/data/plugins
export GF_PATHS_PROVISIONING=/home/ec2-user/metrics-dashboard/metrics-dashboard-dev/conf/provisioning

# Use custom config if available
if [ -f "/home/ec2-user/metrics-dashboard/conf/dev.ini" ]; then
    CONFIG_FILE="/home/ec2-user/metrics-dashboard/conf/dev.ini"
    echo "Using custom configuration: $CONFIG_FILE"
else
    CONFIG_FILE="conf/defaults.ini"
    echo "Using default configuration: $CONFIG_FILE"
fi

# Start Grafana in the background
echo "Starting Grafana server..."
nohup ./bin/grafana-server \
    --config="$CONFIG_FILE" \
    web > /home/ec2-user/grafana.log 2>&1 &

GRAFANA_PID=$!
echo "Grafana started with PID: $GRAFANA_PID"

# Wait a moment for startup
sleep 3

# Verify process is still running
if ps -p $GRAFANA_PID > /dev/null; then
    echo "✓ Grafana is running successfully"
    echo "  Log file: /home/ec2-user/grafana.log"
    echo "  PID: $GRAFANA_PID"
else
    echo "✗ Grafana failed to start. Check logs at /home/ec2-user/grafana.log"
    tail -n 50 /home/ec2-user/grafana.log
    exit 1
fi

echo "ApplicationStart completed"

