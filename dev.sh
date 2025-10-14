#!/bin/bash

# Grafana Development Environment Management Script
# This script provides easy commands for managing Grafana development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GRAFANA_BIN="./metrics-dashboard-dev/bin/darwin-arm64/grafana"
CONFIG_FILE="metrics-dashboard-dev/conf/dev.ini"
DATA_DIR="data"
PID_FILE="data/grafana.pid"
LOG_FILE="data/grafana.log"

# Function to print colored output
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
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Development Manager${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if  is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Function to get  process PID
get_grafana_pid() {
    ps aux | grep "grafana server" | grep -v grep | awk '{print $2}' | head -1
}

# Function to create necessary directories
setup_directories() {
    mkdir -p "$DATA_DIR"
    mkdir -p "$DATA_DIR/logs"
    mkdir -p "$DATA_DIR/plugins"
}

# Function to build 
build_grafana() {
    print_status "Building ..."
    
    # Change to metrics-dashboard-dev directory
    cd metrics-dashboard-dev
    
    # Install dependencies
    print_status "Installing dependencies..."
    make deps
    
    # Build backend and frontend
    print_status "Building backend and frontend..."
    make build
    
    # Return to root directory
    cd ..
    
    print_status "Build completed successfully!"
}

# Function to start 
start_grafana() {
    print_status "Starting development server..."
    
    if is_running; then
        print_warning "is already running!"
        return 1
    fi
    
    # Setup directories
    setup_directories
    
    # Check if binary exists
    if [ ! -f "$GRAFANA_BIN" ]; then
        print_error "binary not found. Run './dev.sh build' first."
        return 1
    fi
    
    # Start in background
    print_status "Starting  server on http://localhost:3000"
    print_status "Username: admin, Password: admin"
    
    # Pass AWS environment variables to  if they exist
    if [ -n "$AWS_ACCESS_KEY_ID" ]; then
        print_status "Using AWS credentials from environment variables"
        AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN" AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION" nohup "$GRAFANA_BIN" server --config="$CONFIG_FILE" --homepath="./metrics-dashboard-dev" > "$LOG_FILE" 2>&1 &
    else
        print_status "No AWS credentials found in environment variables"
        nohup "$GRAFANA_BIN" server --config="$CONFIG_FILE" --homepath="./metrics-dashboard-dev" > "$LOG_FILE" 2>&1 &
    fi
    local pid=$!
    echo $pid > "$PID_FILE"
    
    print_status "started with PID: $pid"
    print_status "Logs are being written to: $LOG_FILE"
    print_status "Access at: http://localhost:3000"
}

# Function to stop 
stop_grafana() {
    print_status "Stopping ..."
    
    if is_running; then
        local pid=$(cat "$PID_FILE")
        print_status "Stopping  process (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        
        # Wait for process to stop
        local count=0
        while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if ps -p "$pid" > /dev/null 2>&1; then
            print_warning "Force killing  process..."
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        rm -f "$PID_FILE"
        print_status "stopped successfully!"
    else
        # Try to find and kill any Grafana processes
        local grafana_pid=$(get_grafana_pid)
        if [ -n "$grafana_pid" ]; then
            print_status "Found  process (PID: $grafana_pid), stopping..."
            kill "$grafana_pid" 2>/dev/null || true
            print_status "stopped successfully!"
        else
            print_warning "No  process found running."
        fi
    fi
}

# Function to restart 
restart_grafana() {
    print_status "Restarting ..."
    stop_grafana
    sleep 2
    start_grafana
}

# Function to show  status
status_grafana() {
    print_status "Checking  status..."
    
    if is_running; then
        local pid=$(cat "$PID_FILE")
        print_status " is running (PID: $pid)"
        print_status "Access URL: http://localhost:3000"
        
        # Check if port is listening
        if lsof -i :3000 > /dev/null 2>&1; then
            print_status "Port 3000 is listening"
        else
            print_warning "Port 3000 is not listening"
        fi
    else
        print_warning "is not running"
    fi
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_status "Showing logs (press Ctrl+C to exit)..."
        tail -f "$LOG_FILE"
    else
        print_warning "No log file found at $LOG_FILE"
    fi
}

# Function to clean build artifacts
clean_grafana() {
    print_status "Cleaning build artifacts..."
    
    # Stop  if running
    if is_running; then
        stop_grafana
    fi
    
    # Clean build directories
    cd metrics-dashboard-dev
    rm -rf bin/
    rm -rf public/build/
    rm -rf node_modules/.cache/
    cd ..
    
    print_status "Build artifacts cleaned!"
}

# Function to install dependencies
install_deps() {
    print_status "Installing dependencies..."
    cd metrics-dashboard-dev
    make deps
    cd ..
    print_status "Dependencies installed!"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    cd metrics-dashboard-dev
    yarn test
    cd ..
}

# Function to run frontend development server
dev_frontend() {
    print_status "Starting frontend development server..."
    cd metrics-dashboard-dev
    yarn dev
    cd ..
}

# Function to show help
show_help() {
    print_header
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build         - Build (backend + frontend)"
    echo "  start         - Start development server"
    echo "  stop          - Stop development server"
    echo "  restart       - Restart development server"
    echo "  status        - Show  status"
    echo "  logs          - Show  logs (follow mode)"
    echo "  clean         - Clean build artifacts"
    echo "  deps          - Install dependencies"
    echo "  test          - Run tests"
    echo "  dev           - Start frontend development server"
    echo "  help          - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build      - Build "
    echo "  $0 start      - Start  server"
    echo "  $0 logs       - View logs"
    echo "  $0 status     - Check if running"
}

# Main script logic
case "${1:-help}" in
    build)
        build_grafana
        ;;
    start)
        start_grafana
        ;;
    stop)
        stop_grafana
        ;;
    restart)
        restart_grafana
        ;;
    status)
        status_grafana
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_grafana
        ;;
    deps)
        install_deps
        ;;
    test)
        run_tests
        ;;
    dev)
        dev_frontend
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 