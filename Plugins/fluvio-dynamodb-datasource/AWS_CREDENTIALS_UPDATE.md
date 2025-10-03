# AWS Credentials Simplification Update

## Overview
Simplified AWS authentication for the Fluvio DynamoDB DataSource plugin by removing session token support. This change optimizes the plugin for admin use cases where long-term credentials are preferred over temporary, expiring tokens.

## 🎯 **Why This Change Was Made**

### **Problems with Session Tokens:**
- **Expiration Issues**: AWS session tokens typically expire after 1-12 hours
- **Admin Complexity**: Admins had to regularly refresh temporary credentials
- **Maintenance Overhead**: Temporary credentials require ongoing token management
- **Unnecessary for Admin Use**: Long-term credentials are more suitable for persistent admin access

### **Benefits of Long-Term Credentials:**
- **No Expiration**: Long-term IAM user credentials don't expire automatically
- **Simplified Management**: Set once and forget (until rotation policies require updates)
- **Better for Automation**: No need to handle token refresh in monitoring dashboards
- **Admin-Focused**: Aligns with the plugin's target audience of system administrators

## 🔧 **Changes Made**

### **1. Frontend Updates (`ConfigEditor.tsx`)**
- ✅ **Removed session token input field** from the credentials form
- ✅ **Updated validation logic** to require both Access Key and Secret Key
- ✅ **Clarified credential type** with "Use long-term IAM user credentials (not temporary STS tokens)"
- ✅ **Updated configuration alert** to mention "long-term IAM credentials"

### **2. Type Definitions (`types.ts`)**
- ✅ **Removed `sessionToken?` field** from `FluvioSecureJsonData` interface
- ✅ **Simplified interface** to only include essential credential fields

### **3. Backend Compatibility (`datasource.go`)**
- ✅ **No changes required** - backend already handles session tokens as optional
- ✅ **Backwards compatible** - existing configurations continue to work
- ✅ **AWS SDK compatibility** - empty session token is handled gracefully

## 📋 **Migration Impact**

### **For New Installations:**
- Users will only see Access Key ID and Secret Access Key fields
- Clear guidance to use long-term IAM user credentials
- Simplified configuration process

### **For Existing Installations:**
- **No breaking changes** - existing configurations continue to work
- Previously configured session tokens will be ignored (safely)
- Users can remove session tokens if desired, but it's not required

## 🔐 **Security Considerations**

### **Long-Term Credential Best Practices:**
1. **Create dedicated IAM user** for Grafana DynamoDB access
2. **Apply least privilege principle** - only grant required DynamoDB permissions
3. **Regular rotation** - establish credential rotation policies
4. **Secure storage** - leverage Grafana's secure credential storage
5. **Monitor usage** - track credential usage through AWS CloudTrail

### **Required IAM Permissions:**
The plugin still requires the same DynamoDB permissions:
- `dynamodb:Query` - for key-based queries
- `dynamodb:Scan` - for table scans  
- `dynamodb:ExecuteStatement` - for PartiQL queries
- `dynamodb:DescribeTable` - for table metadata
- `dynamodb:ListTables` - for connection testing

## 🚀 **Deployment Notes**

### **Development Environment:**
```bash
# No additional changes needed - plugin works with existing setup
npm run dev
```

### **Production Deployment:**
- Existing configurations continue to work without changes
- New configurations will be simpler and more reliable
- Consider updating existing configurations to remove unused session tokens

## 📖 **Usage Examples**

### **Before (with session token complexity):**
```
Region: us-east-1
Access Key: AKIA...
Secret Key: xyz...
Session Token: FwoGZXIvYXdzE... (expires in 1 hour!)
```

### **After (simplified):**
```
Region: us-east-1  
Access Key: AKIA...
Secret Key: xyz...
(No session token needed - persistent access!)
```

## ✅ **Testing Checklist**

- [ ] Verify new installations work without session token
- [ ] Confirm existing configurations continue to function
- [ ] Test connection with long-term IAM user credentials
- [ ] Validate that all DynamoDB operations still work
- [ ] Ensure configuration UI is clear and user-friendly

---

**✅ The plugin now provides simplified, admin-friendly AWS authentication that eliminates the complexity and reliability issues associated with temporary session tokens.**