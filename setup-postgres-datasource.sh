#!/bin/bash

# PostgreSQL Datasource Setup Script
# This script configures the PostgreSQL datasource with your password

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DATASOURCE_FILE="grafana-dev/conf/provisioning/datasources/postgres-wrd.yaml"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}PostgreSQL Datasource Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if datasource file exists
if [ ! -f "$DATASOURCE_FILE" ]; then
    echo -e "${YELLOW}Error: Datasource configuration file not found at $DATASOURCE_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}This script will configure the PostgreSQL datasource for Grafana.${NC}"
echo ""
echo "Database Details:"
echo "  Host:     localhost:5432"
echo "  Database: WRD"
echo "  User:     muhammadimran"
echo ""

# Prompt for password (using -r to prevent backslash escaping)
echo -n "Enter PostgreSQL password for user 'muhammadimran': "
read -rs POSTGRES_PASSWORD
echo ""

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${YELLOW}Error: Password cannot be empty${NC}"
    exit 1
fi

# Remove any control characters that might have been entered
POSTGRES_PASSWORD=$(echo "$POSTGRES_PASSWORD" | tr -d '[:cntrl:]')

# Test the connection
echo -e "${GREEN}Testing PostgreSQL connection...${NC}"
if PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U muhammadimran -d WRD -c "\conninfo" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connection successful!${NC}"
else
    echo -e "${YELLOW}✗ Connection failed. Please check your password and try again.${NC}"
    exit 1
fi

# Update the datasource configuration with the password
echo -e "${GREEN}Updating datasource configuration...${NC}"

# Escape single quotes in password for YAML
ESCAPED_PASSWORD=$(echo "$POSTGRES_PASSWORD" | sed "s/'/''/g")

# Use sed to replace the password
sed -i.bak "s/password: 'your_password_here'/password: '$ESCAPED_PASSWORD'/" "$DATASOURCE_FILE"

echo -e "${GREEN}✓ Configuration updated successfully!${NC}"
echo ""

# Ask if user wants to restart Grafana
read -p "Would you like to restart Grafana now to load the datasource? (y/n): " RESTART_CHOICE

if [[ "$RESTART_CHOICE" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Restarting Grafana...${NC}"
    ./dev.sh restart
    echo ""
    echo -e "${GREEN}✓ Grafana restarted successfully!${NC}"
    echo ""
    echo -e "${BLUE}PostgreSQL datasource 'PostgreSQL-WRD' is now available in Grafana.${NC}"
    echo -e "${BLUE}Access Grafana at: http://localhost:3000${NC}"
    echo -e "${BLUE}Username: admin | Password: admin${NC}"
else
    echo ""
    echo -e "${YELLOW}Please restart Grafana manually when ready:${NC}"
    echo -e "  ${GREEN}./dev.sh restart${NC}"
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
