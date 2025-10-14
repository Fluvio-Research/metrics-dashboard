# Fluvio DynamoDB Plugin - Production Deployment Guide

## 📦 Deployment Package
- **File**: `fluvio-dynamodb-plugin-v0.4.0-production.tar.gz`
- **Size**: ~66MB
- **Version**: 0.4.0
- **Location**: `/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/Plugins/`

## 🚀 Production Deployment Steps

### Step 1: Transfer Plugin to Production Server
```bash
# Upload the deployment package to your production server
scp fluvio-dynamodb-plugin-v0.4.0-production.tar.gz user@your-server:/tmp/
```

### Step 2: Stop Grafana Service
```bash
# On production server
sudo systemctl stop grafana-server
# or
sudo service grafana-server stop
```

### Step 3: Backup Existing Plugin (if any)
```bash
# On production server
cd /var/lib/grafana/plugins/
sudo mv fluvio-connect-dynamodb fluvio-connect-dynamodb.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
```

### Step 4: Extract New Plugin
```bash
# On production server
cd /var/lib/grafana/plugins/
sudo mkdir -p fluvio-connect-dynamodb
cd fluvio-connect-dynamodb
sudo tar -xzf /tmp/fluvio-dynamodb-plugin-v0.4.0-production.tar.gz
```

### Step 5: Set Correct Permissions
```bash
# On production server
sudo chown -R grafana:grafana /var/lib/grafana/plugins/fluvio-connect-dynamodb
sudo chmod +x /var/lib/grafana/plugins/fluvio-connect-dynamodb/gpx_dynamodb_datasource_linux_amd64
```

### Step 6: Verify Plugin Files
```bash
# On production server
ls -la /var/lib/grafana/plugins/fluvio-connect-dynamodb/
# Should show:
# - plugin.json
# - module.js
# - gpx_dynamodb_datasource_linux_amd64 (executable)
# - img/ directory
# - LICENSE, README.md, CHANGELOG.md
```

### Step 7: Start Grafana Service
```bash
# On production server
sudo systemctl start grafana-server
# or
sudo service grafana-server start
```

### Step 8: Verify Deployment
```bash
# Check Grafana logs for plugin loading
sudo tail -f /var/log/grafana/grafana.log | grep -i "fluvio\|dynamodb"

# Check service status
sudo systemctl status grafana-server
```

## ✅ New Features in v0.4.0

### 🔧 Core Improvements
- ✅ **Fixed Limit functionality** - Now properly limits results after filtering
- ✅ **Enhanced IN operator support** - Works with both partition and sort keys
- ✅ **BETWEEN operator support** - Range queries for numeric/date fields
- ✅ **DynamoDB Native Sorting** - Server-side sorting when possible
- ✅ **Client-side Sorting Fallback** - When DynamoDB native sorting isn't available

### 🎛️ UI Enhancements
- ✅ **Table Dropdown** - Auto-discovery of DynamoDB tables
- ✅ **Sort Key Dropdown** - Dynamic attribute selection
- ✅ **Native Sort Toggle** - Enable/disable DynamoDB-side sorting
- ✅ **Enhanced Query Editor** - Better UX for complex queries

### 🔍 Smart Sorting Logic
- **DynamoDB Native**: Used when query has `WHERE partition_key = 'value'`
- **Client-side Fallback**: Used when:
  - No WHERE clause
  - WHERE clause uses IN, BETWEEN, >, < operators
  - Non-partition key conditions

## 🧪 Testing After Deployment

### 1. Basic Connectivity Test
```sql
SELECT * FROM "your-table-name" LIMIT 5
```

### 2. Test Limit Functionality
```sql
SELECT * FROM "your-table-name" LIMIT 1
```
*Should return exactly 1 result*

### 3. Test IN Operator
```sql
SELECT * FROM "your-table-name" WHERE device IN ('device1', 'device2')
```

### 4. Test DynamoDB Native Sorting
```sql
SELECT * FROM "your-table-name" WHERE device = 'specific-device'
```
*With Sort Key = "timestamp" and Native Sort Order ON*

### 5. Test Client-side Sorting
```sql
SELECT * FROM "your-table-name"
```
*With Sort Key = "any-field" and Native Sort Order ON*

## 📊 Monitoring

### Check Plugin Logs
```bash
# Monitor for sorting behavior
sudo tail -f /var/log/grafana/grafana.log | grep -E "(ORDER BY|Injected|client-side|server-side)"
```

### Expected Log Messages
- `"Injected ORDER BY clause"` - DynamoDB native sorting used
- `"Cannot add ORDER BY without WHERE clause"` - Client-side fallback
- `"Applying client-side sort"` - Client-side sorting active

## 🔧 Troubleshooting

### Plugin Not Loading
```bash
# Check plugin directory permissions
ls -la /var/lib/grafana/plugins/fluvio-connect-dynamodb/

# Check executable permissions
file /var/lib/grafana/plugins/fluvio-connect-dynamodb/gpx_dynamodb_datasource_linux_amd64
```

### AWS Credentials
Ensure your production server has proper AWS credentials:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Or check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_DEFAULT_REGION
```

### Performance Issues
- Use DynamoDB native sorting when possible (requires exact partition key match)
- Limit large result sets
- Consider using indexes for complex queries

## 📞 Support
- Plugin Version: 0.4.0
- Deployment Date: $(date)
- Contact: mubashir@fluvio.com.au
