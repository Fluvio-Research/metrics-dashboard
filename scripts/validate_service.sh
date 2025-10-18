#!/bin/bash
set -e

echo "===== ValidateService: Verifying deployment ====="
echo "Timestamp: $(date)"

# Check if Grafana process is running
if pgrep -f grafana-server > /dev/null; then
    echo "✓ Grafana process is running"
    pgrep -f grafana-server | xargs ps -p
else
    echo "✗ Grafana process not found"
    echo "Recent log output:"
    tail -n 50 /home/ec2-user/grafana.log 2>/dev/null || echo "No log file found"
    exit 1
fi

# Wait for Grafana to be responsive (default port 3000)
echo "Checking if Grafana is responsive on port 3000..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✓ Grafana is responding on port 3000"
        HEALTH_STATUS=$(curl -s http://localhost:3000/api/health)
        echo "  Health status: $HEALTH_STATUS"
        break
    else
        ATTEMPT=$((ATTEMPT + 1))
        echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting for Grafana..."
        sleep 2
    fi
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "✗ Grafana did not become responsive within timeout"
    echo "Recent log output:"
    tail -n 50 /home/ec2-user/grafana.log 2>/dev/null || echo "No log file found"
    exit 1
fi

# Verify plugins are loaded
echo "Verifying custom plugins..."
PLUGIN_DIR="/home/ec2-user/metrics-dashboard/metrics-dashboard-dev/data/plugins"

if [ -d "$PLUGIN_DIR/fluvio-connect-dynamodb" ]; then
    echo "✓ DynamoDB datasource plugin present"
else
    echo "⚠ DynamoDB datasource plugin not found"
fi

if [ -d "$PLUGIN_DIR/fluvio-fluviodynamodbupload-panel" ]; then
    echo "✓ Upload panel plugin present"
else
    echo "⚠ Upload panel plugin not found"
fi

echo "===== Deployment Validation Successful ====="
echo "Grafana is running and accessible"
echo "Log file: /home/ec2-user/grafana.log"
echo "ValidateService completed"

