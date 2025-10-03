# Fluvio DynamoDB Plugin - Quick Start Guide

## Your Deployment Details

**EC2 Server**: 13.236.111.35 (GrafanaFluvio)  
**AWS Region**: ap-southeast-2 (Sydney)  
**AWS Account**: 381491939154_AdministratorAccess  

## One-Command Deployment

Run this single command to deploy the plugin to your EC2 server:

```bash
./deploy-to-your-ec2.sh
```

This script will:
1. ✅ Test SSH connection to your EC2 server
2. ✅ Upload the plugin package
3. ✅ Configure Grafana to allow unsigned plugins
4. ✅ Install the plugin files
5. ✅ Set correct permissions
6. ✅ Restart Grafana service
7. ✅ Verify the installation

## AWS Credentials Configuration

When setting up the data source in Grafana, use these credentials:

**Region**: `ap-southeast-2`  
**Access Key ID**: `ASIAVRUVRA5JGRRD3KY7`  
**Secret Access Key**: `yS/cefco3hpfwF6donwKVN5h2GFX83XqSGq/1vrd`  
**Session Token**: `IQoJb3JpZ2luX2VjEDoaDmFwLXNvdXRoZWFzdC0yIkYwRAIgNu+0oq6oOcip5Vk76vccSmevMj+QYGWJtxF9SgTN/SMCIDOs47G5w0OU/tIVTd6yEQG0Ryodw4GqBkB9oTg24If9KvcCCLP//////////wEQABoMMzgxNDkxOTM5MTU0Igz0aQL5Vg3FBVw7GJgqywIfG0ISbhEOtv8ojnH8BTnThDcYcGPAd7Em2rdH6AGmVHnV/fXdlIJxge/4lxiqwL36D17Ea+HXd24X+GI6+TWb7GiZ3KMpUgZHuPT5b1TfxvGvKa7yeM8n6UbKZi77XINqtRgA0iFM2vilyj/CiUWv1EjZWwCo5pzDU91PkeKnXbo7ZTQZmxEWXLHaEios/SQxUHR63i+Ri57veIO2JZ9+0IpaxmLUTDUpEIIRsL06JZpB0ZLpOJshTJit4B1AeU8INO5J2U3i9/v6KuC4UZjB36o/QsNIWr/emPbtTsz7UcFEtRHuPhI6E7dxSbaNQvkDYrQ8SviiP7m7KoupC5otkHCbkAD6JHNuOuXQRYPrm6plTXK1Ctp/CHXF8ZX8o5rxlyHa0Qzj9MMF/bfhFn8o93N+EyhHJsylm3K3bXxQbU7hXh5cWhmdocGiMPfJrcYGOqgBZmTxjoLTZuV8DfaRsSaSMeH2d+yG2kUHDIdUeq6CrGbXJPMGCRcoRCmUmtjpwXbY3NMvFylLnBNBO51G6u0Lr1sHiUioORkFe9sGJlU5yjxTpdrZjTaf3s/RhGMwUHyPMckNQ+e5ld9JbwhehKUuc03038dkQyK4wuFCcS+uyM0YjWaFcuWi9ocyDEWOLeGpoGAuBsEtiOtwrJlg29Uj6r+nA7cetGTA`

> **Note**: These are temporary AWS credentials with a session token. They will expire and you may need to refresh them.

## Quick Access

After deployment, access your Grafana instance at:
**http://13.236.111.35:3000**

Default login: `admin` / `admin` (change on first login)

## Step-by-Step Setup

1. **Deploy the plugin**:
   ```bash
   ./deploy-to-your-ec2.sh
   ```

2. **Access Grafana**: Open http://13.236.111.35:3000

3. **Add Data Source**:
   - Go to Configuration → Data Sources
   - Click "Add data source"
   - Select "Fluvio DynamoDB"

4. **Configure AWS Settings**:
   - Fill in the credentials from above
   - Click "Save & Test"

5. **Start building dashboards** with your DynamoDB data!

## Troubleshooting

If you encounter issues:

1. **SSH Connection Problems**:
   ```bash
   chmod 400 "/Users/muhammadimran/Desktop/Mubashir/Security Items/Fluvio/fluvio-telemetry-key-pair.pem"
   ssh -i "/Users/muhammadimran/Desktop/Mubashir/Security Items/Fluvio/fluvio-telemetry-key-pair.pem" ec2-user@13.236.111.35
   ```

2. **Plugin Not Visible**:
   ```bash
   ssh -i "/Users/muhammadimran/Desktop/Mubashir/Security Items/Fluvio/fluvio-telemetry-key-pair.pem" ec2-user@13.236.111.35
   sudo journalctl -u grafana-server -f
   ```

3. **AWS Connection Issues**:
   - Verify the session token hasn't expired
   - Check that your EC2 instance can reach AWS services
   - Ensure DynamoDB permissions are correctly set

## Security Notes

- The provided AWS credentials are temporary and will expire
- Consider setting up permanent IAM user credentials for production use
- Ensure your EC2 security group only allows necessary access

## Files Included

- `deploy-to-your-ec2.sh` - Automated deployment script
- `configure-grafana.sh` - Grafana configuration script
- `deploy-to-ec2.sh` - Generic deployment script
- `verify-deployment.sh` - Installation verification script
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `fluvio-dynamodb-datasource/` - Plugin files

## Need Help?

Check the detailed `DEPLOYMENT_GUIDE.md` for comprehensive troubleshooting and configuration options.
