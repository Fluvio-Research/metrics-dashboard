import React, { ChangeEvent } from 'react';
import { Input, SecretInput, Select, Alert, Button, useTheme2 } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, SelectableValue, GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { FluvioDataSourceOptions, FluvioSecureJsonData } from '../types';

const AWS_REGIONS = [
  { label: 'US East (N. Virginia) - us-east-1', value: 'us-east-1' },
  { label: 'US East (Ohio) - us-east-2', value: 'us-east-2' },
  { label: 'US West (N. California) - us-west-1', value: 'us-west-1' },
  { label: 'US West (Oregon) - us-west-2', value: 'us-west-2' },
  { label: 'Asia Pacific (Sydney) - ap-southeast-2', value: 'ap-southeast-2' },
  { label: 'Asia Pacific (Singapore) - ap-southeast-1', value: 'ap-southeast-1' },
  { label: 'Asia Pacific (Tokyo) - ap-northeast-1', value: 'ap-northeast-1' },
  { label: 'Asia Pacific (Seoul) - ap-northeast-2', value: 'ap-northeast-2' },
  { label: 'Asia Pacific (Mumbai) - ap-south-1', value: 'ap-south-1' },
  { label: 'Europe (Ireland) - eu-west-1', value: 'eu-west-1' },
  { label: 'Europe (London) - eu-west-2', value: 'eu-west-2' },
  { label: 'Europe (Frankfurt) - eu-central-1', value: 'eu-central-1' },
  { label: 'Europe (Stockholm) - eu-north-1', value: 'eu-north-1' },
  { label: 'Canada (Central) - ca-central-1', value: 'ca-central-1' },
  { label: 'South America (São Paulo) - sa-east-1', value: 'sa-east-1' },
];

// Responsive styling functions for ConfigEditor
const getConfigStyles = (theme: GrafanaTheme2) => ({
  container: css`
    max-width: 100%;
    overflow: hidden;
  `,
  
  configSection: css`
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
    padding: ${theme.spacing(2)};
    margin: ${theme.spacing(1)} 0;
  `,
  
  formRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(2)};
    align-items: flex-start;
    width: 100%;
    margin-bottom: ${theme.spacing(2)};
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      gap: ${theme.spacing(1)};
    }
  `,
  
  fieldContainer: css`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 250px;
    
    @media (max-width: 768px) {
      min-width: 100%;
      margin-bottom: ${theme.spacing(1)};
    }
  `,
  
  fieldLabel: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.primary};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  
  alertSection: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  
  sectionHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(2)};
    font-size: ${theme.typography.h5.fontSize};
    font-weight: ${theme.typography.h5.fontWeight};
    color: ${theme.colors.text.primary};
  `,
  
  credentialsInfo: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing(2)};
  `,
  
  permissionsInfo: css`
    background: ${theme.colors.info.transparent};
    border: 1px solid ${theme.colors.info.border};
    border-radius: ${theme.shape.borderRadius()};
    padding: ${theme.spacing(2)};
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.primary};
    
    code {
      background: ${theme.colors.background.canvas};
      padding: 2px 4px;
      border-radius: 2px;
      font-family: ${theme.typography.fontFamilyMonospace};
    }
  `
});

type Props = DataSourcePluginOptionsEditorProps<FluvioDataSourceOptions, FluvioSecureJsonData>;

export function ConfigEditor({ options, onOptionsChange }: Props) {
  const theme = useTheme2();
  const styles = getConfigStyles(theme);
  const { jsonData, secureJsonFields, secureJsonData } = options;

  const onChange = (field: keyof FluvioDataSourceOptions) => (e: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        [field]: e.target.value,
      },
    });
  };

  const onRegionChange = (value: SelectableValue<string>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        region: value.value || '',
      },
    });
  };

  const fillExampleValues = () => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        region: 'ap-southeast-2',
      },
    });
  };

  const onSecretChange = (field: keyof FluvioSecureJsonData) => (e: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...secureJsonData,
        [field]: e.target.value,
      },
    });
  };

  const onResetSecret = (field: keyof FluvioSecureJsonData) => () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...secureJsonFields,
        [field]: false,
      },
      secureJsonData: {
        ...secureJsonData,
        [field]: '',
      },
    });
  };

  const isConfigured = jsonData?.region && secureJsonFields?.accessKey && secureJsonFields?.secretKey;

  return (
    <div className={styles.container}>
      {!isConfigured && (
        <div className={styles.alertSection}>
          <Alert severity="info" title="Configuration Required">
            Configure your AWS region and permanent IAM credentials to connect to DynamoDB. Use long-term access keys for reliable access.
            <div style={{ marginTop: '8px' }}>
              <Button variant="secondary" size="sm" onClick={fillExampleValues}>
                Use Example Region (ap-southeast-2)
              </Button>
            </div>
          </Alert>
        </div>
      )}
      
      <div className={styles.configSection}>
        <div className={styles.sectionHeader}>
          🌍 AWS Configuration
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.fieldContainer}>
            <label className={styles.fieldLabel} title="Select the AWS region where your DynamoDB tables are located">
              AWS Region
            </label>
            <Select
              placeholder="Select AWS region"
              value={AWS_REGIONS.find(r => r.value === jsonData?.region)}
              options={AWS_REGIONS}
              onChange={onRegionChange}
            />
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.fieldContainer}>
            <label className={styles.fieldLabel} title="Optional: Custom DynamoDB endpoint URL for local development or VPC endpoints">
              Custom Endpoint
            </label>
            <Input
              placeholder="https://dynamodb.ap-southeast-2.amazonaws.com (leave empty for default)"
              value={jsonData?.endpoint || ''}
              onChange={onChange('endpoint')}
            />
          </div>
        </div>
      </div>

      <div className={styles.configSection}>
        <div className={styles.sectionHeader}>
          🔐 AWS Credentials
        </div>
        
        <div className={styles.credentialsInfo}>
          Use permanent IAM user credentials (Access Key ID starting with AKIA*). 
          This plugin is optimized for long-term credentials that don't expire. 
          All credentials are stored securely and never visible in plain text.
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.fieldContainer}>
            <label className={styles.fieldLabel}>Access Key ID</label>
            <SecretInput
              isConfigured={secureJsonFields?.accessKey}
              value={secureJsonData?.accessKey || ''}
              placeholder="AKIA**************** (permanent access key)"
              onChange={onSecretChange('accessKey')}
              onReset={onResetSecret('accessKey')}
            />
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.fieldContainer}>
            <label className={styles.fieldLabel}>Secret Access Key</label>
            <SecretInput
              isConfigured={secureJsonFields?.secretKey}
              value={secureJsonData?.secretKey || ''}
              placeholder="Your AWS secret access key"
              onChange={onSecretChange('secretKey')}
              onReset={onResetSecret('secretKey')}
            />
          </div>
        </div>
        
        {/* Session token field removed - optimized for permanent credentials only */}

      </div>

      <div className={styles.permissionsInfo}>
        💡 <strong>IAM Permissions Required:</strong><br/>
        Your AWS user/role needs these DynamoDB permissions:<br/>
        • <code>dynamodb:Query</code> - for key-based queries<br/>
        • <code>dynamodb:Scan</code> - for table scans<br/>
        • <code>dynamodb:ExecuteStatement</code> - for PartiQL queries<br/>
        • <code>dynamodb:DescribeTable</code> - for table metadata<br/>
        • <code>dynamodb:ListTables</code> - for connection testing
      </div>
    </div>
  );
}
