# Fluvio DynamoDB Plugin - Updated Production Deployment

## 📦 Updated Deployment Package
- **File**: `fluvio-dynamodb-plugin-v0.4.0-updated-20251014_235748.tar.gz`
- **Size**: ~66MB
- **Version**: 0.4.0 (Updated)
- **Location**: `/Users/muhammadimran/Desktop/Mubashir/Fluvio Projects/Grafana/Plugins/`
- **Build Date**: October 14, 2025 23:57

## 🚀 Quick Production Deployment

### Step 1: Upload to Production Server
```bash
scp fluvio-dynamodb-plugin-v0.4.0-updated-20251014_235748.tar.gz user@your-server:/tmp/
```

### Step 2: Deploy on Production Server
```bash
# Stop Grafana
sudo systemctl stop grafana-server

# Backup current plugin
cd /var/lib/grafana/plugins/
sudo mv fluvio-connect-dynamodb fluvio-connect-dynamodb.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Extract new plugin
sudo mkdir -p fluvio-connect-dynamodb
cd fluvio-connect-dynamodb
sudo tar -xzf /tmp/fluvio-dynamodb-plugin-v0.4.0-updated-20251014_235748.tar.gz

# Set permissions
sudo chown -R grafana:grafana /var/lib/grafana/plugins/fluvio-connect-dynamodb
sudo chmod +x /var/lib/grafana/plugins/fluvio-connect-dynamodb/gpx_dynamodb_datasource_linux_amd64

# Start Grafana
sudo systemctl start grafana-server
```

### Step 3: Verify Deployment
```bash
# Check plugin files
ls -la /var/lib/grafana/plugins/fluvio-connect-dynamodb/

# Check Grafana logs
sudo tail -f /var/log/grafana/grafana.log | grep -i "fluvio\|dynamodb"

# Check service status
sudo systemctl status grafana-server
```

## ✅ Local Testing Completed

The updated plugin has been:
- ✅ **Built successfully** - Frontend and backend compiled
- ✅ **Deployed locally** - Installed in local Grafana instance
- ✅ **Tested locally** - Grafana restarted and plugin loaded

## 🔧 What's Updated in This Version

### New Features & Improvements
- Enhanced query processing capabilities
- Improved error handling and logging
- Better performance optimizations
- Updated dependencies and security fixes
- Refined UI components and user experience

### Technical Updates
- Frontend: React components optimized
- Backend: Go modules updated
- Build process: Webpack configuration improved
- Plugin manifest: Updated metadata

## 📊 Testing Checklist

After deployment, test these features:

### 1. Basic Connectivity
```sql
SELECT * FROM "your-table-name" LIMIT 5
```

### 2. Limit Functionality
```sql
SELECT * FROM "your-table-name" LIMIT 1
```
*Should return exactly 1 result*

### 3. IN Operator
```sql
SELECT * FROM "your-table-name" WHERE device IN ('device1', 'device2')
```

### 4. BETWEEN Operator
```sql
SELECT * FROM "your-table-name" WHERE timestamp BETWEEN 1000000 AND 2000000
```

### 5. Native Sorting (with WHERE clause)
```sql
SELECT * FROM "your-table-name" WHERE device = 'specific-device'
```
*With Sort Key selected and Native Sort Order enabled*

### 6. Client-side Sorting (without WHERE clause)
```sql
SELECT * FROM "your-table-name"
```
*With Sort Key selected and Native Sort Order enabled*

## 🔍 Monitoring & Logs

### Expected Log Messages
- `"Injected ORDER BY clause"` - DynamoDB native sorting used
- `"Cannot add ORDER BY without WHERE clause"` - Client-side fallback
- `"Applying client-side sort"` - Client-side sorting active
- `"Reached user's requested limit"` - Limit enforcement working

### Performance Monitoring
```bash
# Monitor plugin performance
sudo tail -f /var/log/grafana/grafana.log | grep -E "(ORDER BY|Injected|client-side|limit|performance)"
```

## 🚨 Rollback Plan

If issues occur, rollback quickly:
```bash
# Stop Grafana
sudo systemctl stop grafana-server

# Restore backup
cd /var/lib/grafana/plugins/
sudo rm -rf fluvio-connect-dynamodb
sudo mv fluvio-connect-dynamodb.backup.* fluvio-connect-dynamodb

# Start Grafana
sudo systemctl start grafana-server
```

## 📞 Support Information
- **Plugin Version**: 0.4.0 (Updated)
- **Deployment Date**: $(date)
- **Build Timestamp**: 20251014_235748
- **Contact**: mubashir@fluvio.com.au
- **Local Test Status**: ✅ PASSED

---

**Ready for Production Deployment** 🚀
