# Fluvio DynamoDB DataSource Plugin - Installation Guide

This guide explains how to install and deploy the Fluvio DynamoDB DataSource plugin on different environments (development and production).

## 📋 Prerequisites

- Grafana server (v8.0+ recommended)
- AWS DynamoDB access with permanent credentials
- Administrative access to the Grafana server

## 🚀 Production Installation

### Method 1: Plugin Directory Installation (Recommended)

1. **Locate Grafana Plugin Directory**
   ```bash
   # Default locations:
   # Linux: /var/lib/grafana/plugins/
   # Windows: C:\Program Files\GrafanaLabs\grafana\data\plugins\
   # Docker: /var/lib/grafana/plugins/
   
   # Find your actual plugin directory:
   grep "plugins" /etc/grafana/grafana.ini
   # or check Grafana config
   ```

2. **Copy Plugin Files**
   ```bash
   # On source machine, create plugin package
   cd /path/to/your/plugin/source
   tar -czf fluvio-dynamodb-datasource.tar.gz \
     --exclude=node_modules \
     --exclude=.git \
     --exclude=src \
     --exclude=*.log \
     dist/ \
     plugin.json \
     README.md \
     LICENSE \
     AWS_PERMANENT_CREDENTIALS_GUIDE.md
   
   # Transfer to target machine
   scp fluvio-dynamodb-datasource.tar.gz user@target-server:/tmp/
   ```

3. **Install on Target Server**
   ```bash
   # On target server
   sudo mkdir -p /var/lib/grafana/plugins/fluvio-dynamodb-datasource
   cd /var/lib/grafana/plugins/fluvio-dynamodb-datasource
   sudo tar -xzf /tmp/fluvio-dynamodb-datasource.tar.gz
   sudo chown -R grafana:grafana /var/lib/grafana/plugins/fluvio-dynamodb-datasource
   ```

4. **Restart Grafana**
   ```bash
   # SystemD (most Linux distributions)
   sudo systemctl restart grafana-server
   
   # Or if using service command
   sudo service grafana-server restart
   
   # Docker
   docker restart grafana-container-name
   ```

### Method 2: Docker Installation

1. **Create Dockerfile Extension**
   ```dockerfile
   FROM grafana/grafana:latest
   
   # Copy plugin files
   COPY dist/ /var/lib/grafana/plugins/fluvio-dynamodb-datasource/dist/
   COPY plugin.json /var/lib/grafana/plugins/fluvio-dynamodb-datasource/
   COPY README.md /var/lib/grafana/plugins/fluvio-dynamodb-datasource/
   COPY LICENSE /var/lib/grafana/plugins/fluvio-dynamodb-datasource/
   COPY AWS_PERMANENT_CREDENTIALS_GUIDE.md /var/lib/grafana/plugins/fluvio-dynamodb-datasource/
   
   # Set proper permissions
   USER root
   RUN chown -R grafana:grafana /var/lib/grafana/plugins/fluvio-dynamodb-datasource
   USER grafana
   ```

2. **Build and Run**
   ```bash
   docker build -t grafana-with-dynamodb .
   docker run -d -p 3000:3000 grafana-with-dynamodb
   ```

### Method 3: Volume Mount (Docker)

```bash
# Create plugin directory on host
mkdir -p ./grafana-plugins/fluvio-dynamodb-datasource
cp -r dist/ plugin.json README.md LICENSE AWS_PERMANENT_CREDENTIALS_GUIDE.md \
  ./grafana-plugins/fluvio-dynamodb-datasource/

# Run Grafana with volume mount
docker run -d \
  -p 3000:3000 \
  -v ./grafana-plugins:/var/lib/grafana/plugins \
  grafana/grafana:latest
```

## 🛠️ Development Installation

### Local Development Setup

1. **Clone/Copy Source Code**
   ```bash
   # On development machine
   git clone <your-repo> fluvio-dynamodb-datasource
   cd fluvio-dynamodb-datasource
   ```

2. **Install Dependencies**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Go dependencies (if needed)
   go mod tidy
   ```

3. **Build Plugin**
   ```bash
   # Build frontend
   npm run build
   
   # Build backend
   mage -v
   # or if mage not available:
   # go build -o dist/fluvio-dynamodb-datasource_linux_amd64 ./pkg
   ```

4. **Link to Grafana Dev Server**
   ```bash
   # Option A: Symlink to Grafana plugins directory
   ln -s $(pwd) /var/lib/grafana/plugins/fluvio-dynamodb-datasource
   
   # Option B: Copy to Grafana dev environment
   cp -r . /path/to/grafana-dev/data/plugins/fluvio-dynamodb-datasource
   ```

5. **Start Grafana Dev Server**
   ```bash
   # If using Grafana source code
   cd /path/to/grafana-dev
   ./dev.sh start
   
   # Or regular Grafana with dev mode
   grafana-server --config=/etc/grafana/grafana.ini --homepath=/usr/share/grafana
   ```

## 📁 File Structure After Installation

```
/var/lib/grafana/plugins/fluvio-dynamodb-datasource/
├── dist/
│   ├── module.js                    # Frontend bundle
│   ├── plugin.json                  # Plugin metadata
│   ├── fluvio-dynamodb-datasource_linux_amd64  # Backend binary (Linux)
│   ├── fluvio-dynamodb-datasource_darwin_arm64 # Backend binary (macOS)
│   ├── fluvio-dynamodb-datasource_windows_amd64.exe # Backend binary (Windows)
│   └── ...
├── plugin.json                     # Plugin configuration
├── README.md                       # Plugin documentation
├── LICENSE                         # License file
└── AWS_PERMANENT_CREDENTIALS_GUIDE.md # AWS setup guide
```

## 🔧 Configuration

### 1. Enable Plugin in Grafana

1. **Access Grafana Admin Panel**
   - Go to `http://your-grafana-server:3000`
   - Login as admin
   - Navigate to **Configuration** → **Plugins**

2. **Verify Plugin Installation**
   - Search for "Fluvio DynamoDB"
   - Plugin should appear with status "Enabled"
   - If not enabled, click **Enable**

### 2. Create Data Source

1. **Add Data Source**
   - Go to **Configuration** → **Data Sources**
   - Click **Add data source**
   - Select **Fluvio DynamoDB DataSource**

2. **Configure AWS Credentials**
   - **AWS Region**: Select your DynamoDB region
   - **Access Key ID**: Your permanent AWS access key (AKIA*)
   - **Secret Access Key**: Your AWS secret key
   - **Custom Endpoint**: Leave empty (unless using local DynamoDB)

3. **Test Connection**
   - Click **Save & Test**
   - Should show: "Successfully connected to AWS DynamoDB"

## 🔍 Verification

### Check Plugin Status
```bash
# Check Grafana logs
sudo tail -f /var/log/grafana/grafana.log

# Look for plugin loading messages
grep -i "fluvio\|dynamodb" /var/log/grafana/grafana.log

# Check if plugin files exist
ls -la /var/lib/grafana/plugins/fluvio-dynamodb-datasource/
```

### Test Plugin Functionality
1. Create a new dashboard
2. Add a panel
3. Select "Fluvio DynamoDB" as data source
4. Configure a simple query (e.g., table scan)
5. Click "Run Query"
6. Verify data appears

## 🚨 Troubleshooting

### Common Issues

**Plugin Not Appearing**
```bash
# Check plugin directory permissions
sudo chown -R grafana:grafana /var/lib/grafana/plugins/
sudo chmod -R 755 /var/lib/grafana/plugins/

# Restart Grafana
sudo systemctl restart grafana-server
```

**Backend Binary Not Found**
```bash
# Ensure correct binary for your platform exists
ls -la /var/lib/grafana/plugins/fluvio-dynamodb-datasource/dist/

# Make binary executable
chmod +x /var/lib/grafana/plugins/fluvio-dynamodb-datasource/dist/fluvio-dynamodb-datasource_*
```

**AWS Connection Failed**
- Verify AWS credentials are permanent (AKIA* not ASIA*)
- Check IAM permissions (see AWS_PERMANENT_CREDENTIALS_GUIDE.md)
- Ensure DynamoDB region matches configuration
- Test credentials with AWS CLI: `aws dynamodb list-tables`

**Plugin Version Mismatch**
```bash
# Check Grafana version compatibility
grafana-server --version

# Update plugin.json if needed
vim /var/lib/grafana/plugins/fluvio-dynamodb-datasource/plugin.json
```

### Log Analysis
```bash
# Enable debug logging in grafana.ini
[log]
level = debug

# Watch logs during plugin loading
sudo tail -f /var/log/grafana/grafana.log | grep -i plugin

# Check for specific errors
sudo grep -i "error\|failed\|panic" /var/log/grafana/grafana.log
```

## 🔄 Updates

### Updating the Plugin

1. **Backup Current Installation**
   ```bash
   sudo cp -r /var/lib/grafana/plugins/fluvio-dynamodb-datasource \
     /var/lib/grafana/plugins/fluvio-dynamodb-datasource.backup
   ```

2. **Install New Version**
   ```bash
   # Stop Grafana
   sudo systemctl stop grafana-server
   
   # Replace plugin files
   sudo rm -rf /var/lib/grafana/plugins/fluvio-dynamodb-datasource/dist/
   sudo cp -r new-version/dist/ /var/lib/grafana/plugins/fluvio-dynamodb-datasource/
   sudo cp new-version/plugin.json /var/lib/grafana/plugins/fluvio-dynamodb-datasource/
   
   # Fix permissions
   sudo chown -R grafana:grafana /var/lib/grafana/plugins/fluvio-dynamodb-datasource
   
   # Start Grafana
   sudo systemctl start grafana-server
   ```

## 📚 Additional Resources

- [AWS Permanent Credentials Setup Guide](./AWS_PERMANENT_CREDENTIALS_GUIDE.md)
- [Plugin README](./README.md)
- [Grafana Plugin Development](https://grafana.com/docs/grafana/latest/developers/plugins/)
- [DynamoDB IAM Permissions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/using-identity-based-policies.html)

## 🆘 Support

If you encounter issues:

1. **Check Logs**: Review Grafana logs for error messages
2. **Verify Installation**: Ensure all files are in correct locations with proper permissions
3. **Test AWS Access**: Verify AWS credentials work with AWS CLI
4. **Plugin Compatibility**: Confirm Grafana version compatibility

---

**Note**: This plugin requires permanent AWS credentials (AKIA*) for optimal performance. Temporary credentials (ASIA*) may work but are not recommended for production environments.
