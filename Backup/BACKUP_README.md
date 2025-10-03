# Grafana Backup Documentation

## Backup Summary

**Backup Location:** `/usr/share/grafana/Backup/`  
**Backup Date:** Mon Jul 28 06:18:44 UTC 2025  
**Total Backup Size:** ~61MB

---

## Successfully Backed Up Files

| **Item** | **Size** | **Source Location** | **Description** |
|----------|----------|---------------------|-----------------|
| **grafana.ini** | 68K | `/etc/grafana/grafana.ini` | Main Grafana configuration file |
| **plugins/** | 33M | `/var/lib/grafana/plugins/` | All installed Grafana plugins |
| **grafana.db** | 28M | `/var/lib/grafana/grafana.db` | Main database file (contains dashboards, users, data sources) |

---

## Backed Up Plugins

- **grafana-timestream-datasource** - AWS Timestream data source plugin
- **volkovlabs-form-panel** - Form panel plugin

---

## Commands Executed

```bash
# Create backup directory
sudo mkdir -p /usr/share/grafana/Backup

# Backup configuration file
sudo cp /etc/grafana/grafana.ini /usr/share/grafana/Backup/

# Backup plugins directory
sudo cp -r /var/lib/grafana/plugins /usr/share/grafana/Backup/

# Backup database (contains all dashboards, users, data sources)
sudo cp /var/lib/grafana/grafana.db /usr/share/grafana/Backup/

# Set proper ownership
sudo chown -R ec2-user:grafana /usr/share/grafana/Backup/
```

---

## Important Notes

### Dashboards Location
⚠️ **Note:** The command `cp -r /var/lib/grafana/dashboards /usr/share/grafana/Backup/` was attempted but the directory `/var/lib/grafana/dashboards` doesn't exist.

**This is normal behavior** - Grafana typically stores dashboards in the database (`grafana.db`) rather than as separate files.

**✅ Your dashboards are safely backed up in the `grafana.db` file!**

### Permissions
- Backup directory is owned by `ec2-user:grafana`
- ec2-user has full read/write access to all backup files
- Proper group permissions maintained for Grafana service compatibility

---

## Restoration Instructions

To restore from this backup:

1. **Stop Grafana service:**
   ```bash
   sudo systemctl stop grafana-server
   ```

2. **Restore configuration:**
   ```bash
   sudo cp /usr/share/grafana/Backup/grafana.ini /etc/grafana/
   ```

3. **Restore database:**
   ```bash
   sudo cp /usr/share/grafana/Backup/grafana.db /var/lib/grafana/
   ```

4. **Restore plugins:**
   ```bash
   sudo cp -r /usr/share/grafana/Backup/plugins/* /var/lib/grafana/plugins/
   ```

5. **Fix permissions:**
   ```bash
   sudo chown -R grafana:grafana /var/lib/grafana/
   sudo chown grafana:grafana /etc/grafana/grafana.ini
   ```

6. **Start Grafana service:**
   ```bash
   sudo systemctl start grafana-server
   ```

---

## Backup Verification

```bash
# Verify backup contents
ls -la /usr/share/grafana/Backup/

# Check sizes
du -sh /usr/share/grafana/Backup/*

# Verify plugins backup
ls -la /usr/share/grafana/Backup/plugins/
```

---

## Transferring Backup to Local Server

To create a copy of this Grafana instance on your local server with the same users and data:

### Method 1: Direct Transfer with SCP

```bash
# Transfer entire backup directory to local server
scp -r /usr/share/grafana/Backup/ username@your-local-server:/path/to/destination/

# Or transfer individual files
scp /usr/share/grafana/Backup/grafana.db username@your-local-server:/path/to/grafana/
scp /usr/share/grafana/Backup/grafana.ini username@your-local-server:/path/to/grafana/
scp -r /usr/share/grafana/Backup/plugins/ username@your-local-server:/path/to/grafana/
```

### Method 2: Compressed Archive Transfer

```bash
# Create compressed archive (reduces transfer time)
cd /usr/share/grafana/
tar -czf grafana_backup_$(date +%Y%m%d_%H%M%S).tar.gz Backup/

# Transfer compressed archive
scp grafana_backup_*.tar.gz username@your-local-server:/path/to/destination/

# On local server - extract the archive
tar -xzf grafana_backup_*.tar.gz
```

### Method 3: Using Rsync (Efficient for Large Files)

```bash
# Sync backup directory to local server
rsync -avz --progress /usr/share/grafana/Backup/ username@your-local-server:/path/to/destination/

# Rsync with compression (good for slower connections)
rsync -avz --compress --progress /usr/share/grafana/Backup/ username@your-local-server:/path/to/destination/
```

### Setting up Local Server

1. **Install Grafana on local server:**
   ```bash
   # For Ubuntu/Debian
   sudo apt-get install -y grafana
   
   # For CentOS/RHEL
   sudo yum install grafana
   ```

2. **Stop Grafana service on local server:**
   ```bash
   sudo systemctl stop grafana-server
   ```

3. **Apply the backup (after transfer):**
   ```bash
   # Restore configuration
   sudo cp /path/to/backup/grafana.ini /etc/grafana/
   
   # Restore database (this contains all users, dashboards, data sources)
   sudo cp /path/to/backup/grafana.db /var/lib/grafana/
   
   # Restore plugins
   sudo cp -r /path/to/backup/plugins/* /var/lib/grafana/plugins/
   
   # Fix permissions
   sudo chown -R grafana:grafana /var/lib/grafana/
   sudo chown grafana:grafana /etc/grafana/grafana.ini
   ```

4. **Start Grafana on local server:**
   ```bash
   sudo systemctl start grafana-server
   sudo systemctl enable grafana-server
   ```

### Important Notes for Local Server Setup

- **Same Version:** Ensure your local server runs the same Grafana version for compatibility
- **Database:** The `grafana.db` file contains ALL user accounts, passwords, dashboards, and settings
- **Data Sources:** You may need to update data source connections if they point to different endpoints
- **Plugins:** All custom plugins will be restored automatically
- **SSL Certificates:** Update any SSL/TLS certificate paths in the configuration if different on local server

### Verification on Local Server

```bash
# Check Grafana service status
sudo systemctl status grafana-server

# Verify database
ls -la /var/lib/grafana/grafana.db

# Check plugins
ls -la /var/lib/grafana/plugins/

# View logs
sudo journalctl -u grafana-server -f
```

---

## Additional Backup Recommendations

For a complete Grafana backup strategy, consider also backing up:

- `/var/lib/grafana/alerting/` - Alert rules and configurations
- `/var/lib/grafana/csv/` - CSV files
- `/var/lib/grafana/pdf/` - PDF exports
- `/var/lib/grafana/png/` - PNG exports
- `/usr/share/grafana/conf/provisioning/` - Provisioning configurations

---

**Backup Created By:** ec2-user  
**System:** Linux 4.14.336-257.562.amzn2.x86_64  
**Grafana Installation Path:** /usr/share/grafana 