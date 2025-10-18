#!/bin/bash
set -e

echo "===== ApplicationStop: Stopping Grafana ====="
echo "Timestamp: $(date)"

# Find and stop all Grafana processes
if pgrep -f grafana-server > /dev/null; then
    echo "Stopping Grafana server processes..."
    pkill -f grafana-server || true
    
    # Wait for graceful shutdown
    echo "Waiting for processes to stop..."
    sleep 3
    
    # Force kill if still running
    if pgrep -f grafana-server > /dev/null; then
        echo "Force stopping remaining processes..."
        pkill -9 -f grafana-server || true
    fi
    
    echo "Grafana stopped successfully"
else
    echo "No Grafana processes found running"
fi

echo "ApplicationStop completed"

