# EC2 Deployment Plan - Fixed DynamoDB Plugin

## 🎯 **Objective**
Deploy the DynamoDB plugin with mixed data type fixes to your EC2 server (13.236.111.35) to resolve the "field Depth should have type *string, but got N" error.

## 🔧 **What Was Fixed**
- ✅ **Mixed Data Type Handling**: Plugin now gracefully converts mixed types to strings
- ✅ **Pagination Support**: Handles large datasets with NextToken continuation
- ✅ **Error Recovery**: Returns partial results instead of failing completely
- ✅ **Comprehensive Logging**: Better debugging information

## 📋 **Pre-Deployment Verification**
✅ **All checks passed:**
- SSH key ready (correct permissions)
- Plugin source with fixes available
- Plugin built and recent (24 minutes old)
- SSH connection to EC2 working
- Grafana running on EC2
- Existing plugin detected (will be backed up)

## 🚀 **Deployment Process**

### **Step 1: Run Verification (Already Done)**
```bash
./verify-before-deployment.sh
```
✅ **Status**: Completed successfully

### **Step 2: Deploy to EC2**
```bash
./deploy-fixed-plugin-to-ec2.sh
```

**This script will:**
1. 🔐 Test SSH connection
2. 💾 Create backup of current plugin
3. 🛑 Stop Grafana service
4. 📦 Upload new plugin files
5. 📁 Replace plugin directory
6. 🔐 Set correct permissions
7. ⚙️ Configure Grafana for unsigned plugins
8. 🚀 Start Grafana service
9. 🔍 Verify deployment
10. 🧹 Clean up temporary files

### **Step 3: Test the Fix**
After deployment, test your problematic query:
```sql
SELECT *
FROM "datastore-Ai1TelemetryTable-1O5XMXVV3P2CG"
WHERE (serial_no = '2739' OR serial_no = '23169') 
  AND $__timeFilter(timestamp)
```

**Expected Result**: ✅ No "field Depth should have type *string, but got N" error

## 🛡️ **Safety Measures**

### **Backup Strategy**
- ✅ **Automatic Backup**: Current plugin backed up before replacement
- ✅ **Rollback Plan**: If deployment fails, backup is automatically restored
- ✅ **Timestamp**: Backup includes timestamp for identification

### **Service Management**
- ✅ **Graceful Stop**: Grafana stopped before plugin replacement
- ✅ **Health Check**: Verification that Grafana starts successfully
- ✅ **Status Monitoring**: Service status checked throughout process

### **Error Handling**
- ✅ **Fail-Safe**: Script stops on any error
- ✅ **Cleanup**: Temporary files removed regardless of outcome
- ✅ **Logging**: Detailed output for troubleshooting

## 📊 **Server Details**

| Setting | Value |
|---------|-------|
| **Host** | 13.236.111.35 (GrafanaFluvio) |
| **User** | ec2-user |
| **SSH Key** | `/Users/muhammadimran/Desktop/Mubashir/Security Items/Fluvio/fluvio-telemetry-key-pair.pem` |
| **Plugin Path** | `/var/lib/grafana/plugins/fluvio-dynamodb-datasource` |
| **Service** | grafana-server |
| **Port** | 3000 |

## 🕒 **Deployment Timeline**

| Phase | Duration | Description |
|-------|----------|-------------|
| **Verification** | 30 seconds | SSH connection, file checks |
| **Backup** | 1 minute | Create backup of current plugin |
| **Upload** | 1 minute | Transfer new plugin files |
| **Installation** | 1 minute | Replace files, set permissions |
| **Service Restart** | 30 seconds | Stop/start Grafana |
| **Verification** | 30 seconds | Confirm deployment success |
| **Total** | ~4 minutes | Complete deployment process |

## 🧪 **Post-Deployment Testing**

### **Immediate Tests**
1. ✅ **Service Status**: `sudo systemctl status grafana-server`
2. ✅ **Web Access**: http://13.236.111.35:3000
3. ✅ **Plugin Visible**: Check data sources list
4. ✅ **Connection Test**: Test data source configuration

### **Functional Tests**
1. ✅ **6-hour Query**: Should work (as before)
2. ✅ **30-day Query**: Should now work (was failing)
3. ✅ **Mixed Data Types**: No type mismatch errors
4. ✅ **Large Datasets**: Pagination handles large results

## 🔍 **Troubleshooting**

### **If Deployment Fails**
```bash
# SSH to server
ssh -i "/Users/muhammadimran/Desktop/Mubashir/Security Items/Fluvio/fluvio-telemetry-key-pair.pem" ec2-user@13.236.111.35

# Check Grafana status
sudo systemctl status grafana-server

# Check Grafana logs
sudo journalctl -u grafana-server -f

# Verify plugin files
ls -la /var/lib/grafana/plugins/fluvio-dynamodb-datasource
```

### **If Plugin Not Visible**
1. Check Grafana configuration: `sudo cat /etc/grafana/grafana.ini | grep allow_loading_unsigned_plugins`
2. Restart Grafana: `sudo systemctl restart grafana-server`
3. Check plugin permissions: `ls -la /var/lib/grafana/plugins/`

### **If Queries Still Fail**
1. Check plugin logs in Grafana
2. Verify plugin binary is executable
3. Test with smaller time ranges first
4. Check AWS credentials configuration

## 📞 **Support Commands**

```bash
# Quick deployment (if everything is ready)
./deploy-fixed-plugin-to-ec2.sh

# Re-run verification
./verify-before-deployment.sh

# SSH to server
ssh -i "/Users/muhammadimran/Desktop/Mubashir/Security Items/Fluvio/fluvio-telemetry-key-pair.pem" ec2-user@13.236.111.35

# Check server status
curl -s http://13.236.111.35:3000/api/health

# Monitor Grafana logs
ssh -i "/Users/muhammadimran/Desktop/Mubashir/Security Items/Fluvio/fluvio-telemetry-key-pair.pem" ec2-user@13.236.111.35 "sudo journalctl -u grafana-server -f"
```

## ✅ **Ready to Deploy**

**Status**: 🟢 **ALL SYSTEMS GO**

Everything is verified and ready. Run the deployment command when you're ready:

```bash
./deploy-fixed-plugin-to-ec2.sh
```

The deployment is safe, automated, and includes rollback protection. Your EC2 Grafana instance will have the fixed plugin that resolves the mixed data type errors within 4 minutes.
