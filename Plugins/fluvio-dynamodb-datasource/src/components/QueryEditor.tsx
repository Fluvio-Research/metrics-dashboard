import React, { ChangeEvent, useState } from 'react';
import { Input, RadioButtonGroup, Button, Select, Alert, useTheme2, InlineField, InlineSwitch, DateTimePicker, TextArea } from '@grafana/ui'; 
import { QueryEditorProps, SelectableValue, GrafanaTheme2, DataQueryRequest, DataFrame, CoreApp, TimeRange, dateTime, Field, DateTime } from '@grafana/data';
import { css } from '@emotion/css';
import { DataSource } from '../datasource';
import { FluvioDataSourceOptions, DynamoQuery, FieldMapping } from '../types';
import { firstValueFrom } from 'rxjs';

type Props = QueryEditorProps<DataSource, DynamoQuery, FluvioDataSourceOptions>;

// Responsive styling functions
const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    max-width: 100% !important;
    overflow: hidden !important;
    width: 100% !important;
    box-sizing: border-box !important;
  `,
  
  responsiveGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: ${theme.spacing(2)};
    width: 100%;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `,
  
  formRow: css`
    display: flex !important;
    flex-wrap: wrap !important;
    gap: ${theme.spacing(2)} !important;
    align-items: flex-start !important;
    width: 100% !important;
    margin-bottom: ${theme.spacing(2)} !important;
    box-sizing: border-box !important;
    
    /* Force wrapping on smaller screens */
    @media (max-width: 1200px) {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: ${theme.spacing(1)} !important;
    }
    
    /* Additional breakpoint for tablet */
    @media (max-width: 768px) {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: ${theme.spacing(1)} !important;
    }
  `,
  
  fieldContainer: css`
    display: flex !important;
    flex-direction: column !important;
    flex: 1 !important;
    min-width: 200px !important;
    box-sizing: border-box !important;
    
    @media (max-width: 1200px) {
      min-width: 100% !important;
      margin-bottom: ${theme.spacing(1)} !important;
      flex: none !important;
    }
    
    @media (max-width: 768px) {
      min-width: 100% !important;
      margin-bottom: ${theme.spacing(1)} !important;
      flex: none !important;
    }
  `,
  
  smallFieldContainer: css`
    display: flex;
    flex-direction: column;
    min-width: 150px;
    
    @media (max-width: 1024px) {
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
  
  keyValueRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    align-items: flex-end;
    width: 100%;
    margin-bottom: ${theme.spacing(2)};
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  `,
  
  equalSign: css`
    align-self: flex-end;
    padding: 0 ${theme.spacing(1)};
    margin-bottom: 8px;
    font-weight: bold;
    color: ${theme.colors.text.secondary};
    
    @media (max-width: 768px) {
      align-self: center;
      margin: ${theme.spacing(0.5)} 0;
    }
  `,
  
  
  querySection: css`
    background: ${theme.colors.background.secondary} !important;
    border: 1px solid ${theme.colors.border.weak} !important;
    border-radius: ${theme.shape.borderRadius()} !important;
    padding: ${theme.spacing(2)} !important;
    margin: ${theme.spacing(1)} 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  `,
  
  /* Alternative layout for mobile - force vertical stacking */
  mobileStack: css`
    @media (max-width: 1200px) {
      display: block !important;
      width: 100% !important;
      
      & > * {
        display: block !important;
        width: 100% !important;
        margin-bottom: ${theme.spacing(2)} !important;
        box-sizing: border-box !important;
        float: none !important;
        clear: both !important;
      }
      
      /* Force all nested elements to be full width */
      & input,
      & button,
      & [role="combobox"],
      & [class*="input"],
      & [class*="select"] {
        width: 100% !important;
        max-width: none !important;
        min-width: auto !important;
        box-sizing: border-box !important;
      }
    }
    
    /* Even more aggressive - force on smaller screens */
    @media (max-width: 768px) {
      display: block !important;
      width: 100% !important;
      
      & > * {
        display: block !important;
        width: 100% !important;
        margin-bottom: ${theme.spacing(1)} !important;
        box-sizing: border-box !important;
        float: none !important;
        clear: both !important;
      }
    }
  `,
  
  testQueryButton: css`
    background: ${theme.colors.primary.main};
    color: ${theme.colors.primary.contrastText};
    border: none;
    font-weight: 500;
    
    &:hover {
      background: ${theme.colors.primary.shade};
    }
    
    &:disabled {
      background: ${theme.colors.action.disabledBackground};
      color: ${theme.colors.action.disabledText};
    }
  `,
  
  buttonGroup: css`
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: center;
    margin-top: ${theme.spacing(2)};
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      
      & > button {
        width: 100%;
      }
    }
  `,
  
  successMessage: css`
    background: ${theme.colors.success.transparent};
    border: 1px solid ${theme.colors.success.border};
    border-radius: ${theme.shape.borderRadius()};
    padding: ${theme.spacing(1)};
    color: ${theme.colors.success.text};
    font-size: ${theme.typography.bodySmall.fontSize};
    margin-top: ${theme.spacing(1)};
  `,
  
  advancedSection: css`
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
    padding: ${theme.spacing(2)};
    margin-top: ${theme.spacing(2)};
  `,
  
  fieldMappingCard: css`
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
    padding: ${theme.spacing(2)};
    margin: ${theme.spacing(1)} 0;
  `,
  
  infoText: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
    margin-top: ${theme.spacing(1)};
  `
});

// Helper function to analyze data structure on the frontend
const tryFallbackSchemaAnalysis = async (originalQuery: DynamoQuery, datasource: DataSource): Promise<FieldMapping[]> => {
  console.log('Starting fallback schema analysis...');
  
  // Run a normal query to get raw data
  const dataQuery: DynamoQuery = {
    ...originalQuery,
    discoverSchema: false,
    outputFormat: 'auto',
    limit: originalQuery.limit || 100 // Use user's specified limit or default to 100
  };
  
  const timeRange: TimeRange = {
    from: dateTime().subtract(1, 'hour'),
    to: dateTime(),
    raw: { from: 'now-1h', to: 'now' }
  };
  
  const queryRequest: DataQueryRequest<DynamoQuery> = {
    targets: [dataQuery],
    range: timeRange,
    interval: '1s',
    intervalMs: 1000,
    maxDataPoints: 500,
    scopedVars: {},
    timezone: 'UTC',
    app: CoreApp.Explore,
    requestId: 'fallback_analysis',
    startTime: Date.now()
  };
  
  const response = await firstValueFrom(datasource.query(queryRequest));
  console.log('Fallback query response:', response);
  
  const discoveredFields: FieldMapping[] = [];
  
  if (response.data && response.data.length > 0) {
    const dataFrame = response.data[0] as DataFrame;
    
    // Look for raw_json field
    const rawJsonField = dataFrame.fields.find((f: Field) => f.name === 'raw_json');
    
    if (rawJsonField && rawJsonField.values && rawJsonField.values.length > 0) {
      console.log('Found raw_json field, analyzing structure...');
      
      // Parse the first few raw JSON records
      const sampleSize = Math.min(3, rawJsonField.values.length);
      const allFieldPaths = new Set<string>();
      
      for (let i = 0; i < sampleSize; i++) {
        const rawJson = rawJsonField.values.get(i) as string;
        try {
          const parsedData = JSON.parse(rawJson);
          const paths = extractFieldPaths(parsedData, '');
          paths.forEach(path => allFieldPaths.add(path.path));
        } catch (error) {
          console.error('Failed to parse raw JSON:', error);
        }
      }
      
      // Create field mappings from discovered paths (limit to avoid UI overload)
      const sortedPaths = Array.from(allFieldPaths).sort();
      const maxFields = 40; // Limit to 40 fields to avoid UI overload
      
      sortedPaths.slice(0, maxFields).forEach(path => {
        // Create a clean field name
        const cleanFieldName = path.replace(/\[.*?\]/g, '').replace(/\./g, '_');
        
        // Determine data type by sampling the field
        let dataType: 'string' | 'number' | 'boolean' | 'time' | 'json' = 'string';
        try {
          const firstRecord = JSON.parse(rawJsonField.values.get(0) as string);
          const sampleValue = getValueByPath(firstRecord, path);
          dataType = determineDataType(sampleValue);
        } catch {
          dataType = 'string'; // Default fallback
        }
        
        discoveredFields.push({
          fieldName: cleanFieldName || path.split('.').pop() || 'field',
          sourcePath: path,
          dataType: dataType
        });
      });
      
      if (sortedPaths.length > maxFields) {
        console.log(`Limited field discovery to ${maxFields} out of ${sortedPaths.length} total fields`);
      }
      
      console.log(`Fallback analysis discovered ${discoveredFields.length} fields:`, discoveredFields);
    }
  }
  
  return discoveredFields;
};

// Helper function to extract all field paths from an object
const extractFieldPaths = (obj: any, prefix: string): Array<{path: string, type: string}> => {
  const paths: Array<{path: string, type: string}> = [];
  
  const traverse = (current: any, currentPath: string) => {
    if (current === null || current === undefined) {
      return;
    }
    
    if (typeof current === 'object' && !Array.isArray(current)) {
      // Object - traverse properties
      Object.keys(current).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        // Add this path
        paths.push({
          path: newPath,
          type: determineDataType(current[key])
        });
        
        // Recursively traverse if it's a nested object
        if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key])) {
          traverse(current[key], newPath);
        }
      });
    } else if (Array.isArray(current) && current.length > 0) {
      // Array - analyze first element
      const arrayPath = `${currentPath}[0]`;
      traverse(current[0], arrayPath);
    }
  };
  
  traverse(obj, prefix);
  return paths;
};

// Helper to get value by path
const getValueByPath = (obj: any, path: string): any => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (key.includes('[')) {
      const [arrayKey, indexStr] = key.split('[');
      const index = parseInt(indexStr.replace(']', ''), 10);
      current = current?.[arrayKey]?.[index];
    } else {
      current = current?.[key];
    }
    
    if (current === undefined || current === null) {
      return undefined;
    }
  }
  
  return current;
};

// Helper to determine data type
const determineDataType = (value: any): 'string' | 'number' | 'boolean' | 'time' | 'json' => {
  if (value === null || value === undefined) {
    return 'string';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  
  if (typeof value === 'string') {
    // Check if it looks like a timestamp
    if (/^\d{10}$/.test(value) || /^\d{13}$/.test(value)) {
      return 'time';
    }
    // Check for ISO date strings
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return 'time';
    }
    return 'string';
  }
  
  if (typeof value === 'object' && value !== null) return 'json';
  
  return 'string';
};

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isTestingQuery, setIsTestingQuery] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showTemplateVariableHelp, setShowTemplateVariableHelp] = useState(false);

  // Get available template variables for UI hints
  const availableVariables = React.useMemo(() => {
    try {
      return datasource.getVariables ? datasource.getVariables() : [];
    } catch {
      return [];
    }
  }, [datasource]);

  const queryMode = query.queryMode ?? (query.partiql !== undefined ? 'partiql' : 'key');

  React.useEffect(() => {
    if (!query.queryMode) {
      onChange({ ...query, queryMode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.queryMode, queryMode]);

  // Validate template variables and PartiQL syntax
  const validateTemplateVariables = (queryText: string): { isValid: boolean; warnings: string[] } => {
    const warnings: string[] = [];

    if (!queryText) {
      return { isValid: true, warnings: [] };
    }

    // Validate PartiQL syntax using datasource method
    if (queryMode === 'partiql') {
      const partiqlValidation = (datasource as any).validatePartiQLQuery ? (datasource as any).validatePartiQLQuery(queryText) : { isValid: true };
      if (!partiqlValidation.isValid) {
        warnings.push(`❌ PartiQL Syntax Error: ${partiqlValidation.error}`);
      }
    }

    // Check if $__timeFilter is used without enabling time filtering
    if (queryText.includes('$__timeFilter') && !query.timeFilterEnabled) {
      warnings.push('⚠️ $__timeFilter requires "Enable Time Filtering" to be turned ON. Please enable it below.');
    }

    // Find all variable references in the query
    const variableMatches = queryText.match(/\$[\w_]+|\$\{[\w_]+\}/g) || [];
    const referencedVariables = variableMatches.map(match =>
      match.startsWith('${') ? match.slice(2, -1) : match.slice(1)
    );

    // Check for undefined variables (excluding built-in Grafana variables)
    const builtInVariables = ['__from', '__to', '__timeFilter', '__interval', '__interval_ms', '__rate_interval', '__range'];
    const availableVarNames = availableVariables.map(v => v.replace('$', ''));

    for (const varName of referencedVariables) {
      if (!builtInVariables.includes(varName) && !availableVarNames.includes(varName)) {
        warnings.push(`Variable '$${varName}' is not defined in dashboard variables`);
      }
    }

    return { isValid: warnings.length === 0, warnings };
  };

  const onFieldChange = <T extends keyof DynamoQuery>(field: T) => (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, [field]: e.target.value });
  };

  const onLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, limit: parseInt(e.target.value, 10) || 100 });
  };

  const onOutputFormatChange = (value: SelectableValue<string>) => {
    const outputFormat = value.value as 'auto' | 'table' | 'geomap' | 'timeseries' | undefined;
    onChange({ ...query, outputFormat: outputFormat || 'auto' });
  };

  const onPartitionModeChange = (mode: 'single' | 'in') => {
    if (mode === 'in') {
      const seedValues =
        (partitionKeyValues && partitionKeyValues.length > 0
          ? partitionKeyValues
          : partitionKeyValue
          ? [partitionKeyValue]
          : []) ?? [];
      onChange({
        ...query,
        partitionKeyMode: mode,
        partitionKeyValues: seedValues,
      });
    } else {
      onChange({
        ...query,
        partitionKeyMode: mode,
        partitionKeyValue: partitionKeyValue ?? partitionKeyValues?.[0] ?? '',
      });
    }
  };

  const onPartitionValuesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const raw = event.target.value ?? '';
    const values = raw
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    onChange({
      ...query,
      partitionKeyValues: values,
    });
  };

  const onSortOperatorChange = (selection: SelectableValue<string>) => {
    const nextOperator = (selection.value as DynamoQuery['sortKeyOperator']) ?? 'eq';
    const updated: DynamoQuery = {
      ...query,
      sortKeyOperator: nextOperator,
    };

    if (nextOperator === 'between') {
      updated.sortKeyRangeStart = sortKeyRangeStart ?? sortKeyValue ?? '';
      updated.sortKeyRangeEnd = sortKeyRangeEnd ?? '';
      updated.sortKeyValues = undefined;
    } else if (nextOperator === 'in') {
      // Initialize sortKeyValues for IN operator
      const seedValues = query.sortKeyValues && query.sortKeyValues.length > 0
        ? query.sortKeyValues
        : query.sortKeyValue
        ? [query.sortKeyValue]
        : [];
      updated.sortKeyValues = seedValues;
      updated.sortKeyRangeStart = undefined;
      updated.sortKeyRangeEnd = undefined;
    } else {
      updated.sortKeyRangeStart = undefined;
      updated.sortKeyRangeEnd = undefined;
      updated.sortKeyValues = undefined;
    }

    onChange(updated);
  };

  const onSortKeyValuesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const raw = event.target.value ?? '';
    const values = raw
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    onChange({
      ...query,
      sortKeyValues: values,
    });
  };

  const onSortDirectionChange = (value: 'asc' | 'desc') => {
    onChange({
      ...query,
      sortDirection: value,
    });
  };

  const discoverSchema = async () => {
    if (!query.table) {
      alert('Please enter a table name first');
      return;
    }
    
    setIsDiscovering(true);
    try {
      console.log('Discovering schema for table:', query.table, 'with limit:', query.limit || 100);
      
      // Use backend's schema discovery to analyze table structure
      const discoveryQuery: DynamoQuery = { 
        ...query, 
        discoverSchema: true, // Backend returns schema information
        fieldMappings: undefined, // Clear existing mappings
        outputFormat: 'auto' as const, // Auto-detect best format
        limit: query.limit || 100 // Use user's specified limit or default to 100
      };
      
      console.log('Executing schema discovery for any table type...');
      onChange(discoveryQuery);
      onRunQuery();
      
      // The backend will analyze the actual data structure dynamically
      alert('🔍 Discovering schema... The system is analyzing your table structure to understand the data format.');
      
    } catch (error) {
      console.error('Schema discovery failed:', error);
      alert('Schema discovery failed. Please check your table name and connection settings.');
    } finally {
      setTimeout(() => setIsDiscovering(false), 500);
    }
  };
  
  const generateFieldMappingsFromData = async () => {
    const hasPartiql = Boolean(query.partiql && query.partiql.trim().length > 0);
    const hasTable = Boolean(query.table && query.table.trim().length > 0);

    if (!hasPartiql && !hasTable) {
      alert('Please provide either a PartiQL statement or a table name before discovering the schema.');
      return;
    }

    setIsDiscovering(true);
    try {
      console.log(
        'Starting dynamic schema discovery using',
        hasPartiql ? 'PartiQL statement' : `table: ${query.table}`,
        'with limit:',
        query.limit || 100
      );

      // Step 1: Execute schema discovery query directly to get response
      const schemaQuery: DynamoQuery = { 
        ...query, 
        discoverSchema: true, // Backend will return schema information
        limit: query.limit || 100, // Use user's specified limit or default to 100
        fieldMappings: undefined, // Clear existing mappings
        refId: 'schema_discovery'
      };
      
      console.log('Executing schema discovery query:', schemaQuery);
      
      // Store original query 
      const originalQuery = { ...query };
      
      // Execute the schema discovery query directly to get the response
      const timeRange: TimeRange = {
        from: dateTime().subtract(1, 'hour'),
        to: dateTime(),
        raw: { from: 'now-1h', to: 'now' }
      };
      
      const queryRequest: DataQueryRequest<DynamoQuery> = {
        targets: [schemaQuery],
        range: timeRange,
        interval: '1s',
        intervalMs: 1000,
        maxDataPoints: 500,
        scopedVars: {},
        timezone: 'UTC',
        app: CoreApp.Explore,
        requestId: 'schema_discovery',
        startTime: Date.now()
      };
      
      const queryObservable = datasource.query(queryRequest);
      const response = await firstValueFrom(queryObservable);
      
      console.log('Schema discovery response:', response);
      console.log('Response data length:', response.data?.length || 0);
      if (response.data?.length > 0) {
        console.log('First frame:', response.data[0]);
        console.log('First frame fields:', response.data[0].fields);
      }
      
      if (response.data && response.data.length > 0) {
        const schemaFrame = response.data[0] as DataFrame;
        console.log('Schema frame name:', schemaFrame.name);
        console.log('Schema frame fields count:', schemaFrame.fields?.length || 0);
        
        const discoveredMappings: FieldMapping[] = [];
        
        // Parse schema frame to extract field information
        // The backend returns: field_path, data_type, sample_value, frequency
        if (schemaFrame.fields && schemaFrame.fields.length > 0) {
          const fieldPathField = schemaFrame.fields.find((f: Field) => f.name === 'field_path');
          const dataTypeField = schemaFrame.fields.find((f: Field) => f.name === 'data_type');
          const sampleValueField = schemaFrame.fields.find((f: Field) => f.name === 'sample_value');
          
          console.log('Found fields:', {
            fieldPath: !!fieldPathField,
            dataType: !!dataTypeField,
            sampleValue: !!sampleValueField
          });
          
          if (fieldPathField && dataTypeField && fieldPathField.values) {
            console.log('Processing discovered fields...');
            
            // Extract discovered fields from the response
            for (let i = 0; i < fieldPathField.values.length; i++) {
              const fieldPath = fieldPathField.values.get(i) as string;
              const dataType = dataTypeField.values.get(i) as string;
              const sampleValue = sampleValueField?.values.get(i) as string;
              
              if (fieldPath && dataType) {
                // Create a clean field name from the path
                const cleanFieldName = fieldPath.replace(/\[.*?\]/g, '').replace(/\./g, '_');
                
                discoveredMappings.push({
                  fieldName: cleanFieldName || fieldPath,
                  sourcePath: fieldPath,
                  dataType: dataType as 'string' | 'number' | 'boolean' | 'time' | 'json'
                });
                
                console.log(`Discovered field: ${fieldPath} -> ${dataType} (sample: ${sampleValue})`);
              }
            }
          }
        }
        
        if (discoveredMappings.length > 0) {
          // Update query with discovered field mappings
          const updatedQuery = { 
            ...originalQuery, 
            fieldMappings: discoveredMappings,
            outputFormat: 'table' as const, // Switch to table view to see the mapped fields
            discoverSchema: false // Turn off schema discovery
          };
          
          onChange(updatedQuery);
          setShowAdvanced(true); // Show the advanced section so user can see the mappings
          alert(`✅ Successfully discovered ${discoveredMappings.length} fields from ${query.limit || 100} records! Check the Advanced Field Mapping section below to customize as needed.`);
          
          console.log('Schema discovery completed successfully:', discoveredMappings);
        } else {
          console.log('No fields discovered from schema frame - trying fallback analysis');
          // Fallback: Try to analyze the data on the frontend side
          try {
            const fallbackMappings = await tryFallbackSchemaAnalysis(originalQuery, datasource);
            if (fallbackMappings.length > 0) {
              const updatedQuery = { 
                ...originalQuery, 
                fieldMappings: fallbackMappings,
                outputFormat: 'table' as const,
                discoverSchema: false
              };
              
              onChange(updatedQuery);
              setShowAdvanced(true);
              alert(`✅ Used fallback analysis and discovered ${fallbackMappings.length} fields! The backend schema discovery had issues, but we successfully analyzed your raw data directly. Check the Advanced Field Mapping section below.`);
              return; // Success with fallback
            }
          } catch (fallbackError) {
            console.error('Fallback analysis also failed:', fallbackError);
          }
          
          alert('⚠️ No fields could be discovered from the schema response. The data structure might be too complex or there was an issue with field analysis. Try running a normal query first to verify your table access.');
        }
      } else {
        console.log('Schema discovery response had no data frames');
        if (response.error) {
          console.error('Response error:', response.error);
          alert(`❌ Schema discovery failed with error: ${response.error.message || 'Unknown error'}`);
        } else {
          alert('⚠️ Schema discovery returned no data frames. This could indicate:\n• Table name is incorrect\n• Table has no data\n• Connection/permission issues\n• Backend processing error\n\nTry running a normal query first to verify your table works.');
        }
      }
      
    } catch (error) {
      console.error('Schema discovery failed:', error);
      alert('❌ Schema discovery failed. Please check your table name, connection settings, and ensure the table contains data.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const testQuery = async () => {
    // Validate query before testing
    if (queryMode === 'partiql') {
      if (!query.partiql || !query.partiql.trim()) {
        alert('Please enter a PartiQL query first');
        return;
      }
    } else {
      if (!query.table) {
        alert('Please enter a table name first');
        return;
      }
    }
    
    setIsTestingQuery(true);
    try {
      // Run the query with user's limit (or reasonable default for testing)
      const testQueryData = { 
        ...query, 
        limit: Math.min(query.limit || 1, 1000000), // Allow up to 100 records for testing, default 25
        discoverSchema: false 
      };
      onChange(testQueryData);
      setTimeout(onRunQuery, 100);
    } catch (error) {
      console.error('Test query failed:', error);
    } finally {
      // Reset test state after a short delay
      setTimeout(() => setIsTestingQuery(false), 2000);
    }
  };

  const addFieldMapping = () => {
    const newMapping: FieldMapping = {
      fieldName: '',
      sourcePath: '',
      dataType: 'string'
    };
    const updatedMappings = [...(query.fieldMappings || []), newMapping];
    onChange({ ...query, fieldMappings: updatedMappings });
  };

  const removeFieldMapping = (index: number) => {
    const updatedMappings = (query.fieldMappings || []).filter((_, i) => i !== index);
    onChange({ ...query, fieldMappings: updatedMappings });
  };

  const updateFieldMapping = (index: number, field: keyof FieldMapping, value: string) => {
    const updatedMappings = [...(query.fieldMappings || [])];
    updatedMappings[index] = { ...updatedMappings[index], [field]: value };
    onChange({ ...query, fieldMappings: updatedMappings });
  };

  const applyFieldMappings = async () => {
    // Validate field mappings
    const invalidMappings = (query.fieldMappings || []).filter(
      mapping => !mapping.fieldName.trim() || !mapping.sourcePath.trim()
    );
    
    if (invalidMappings.length > 0) {
      alert('Please fill in all field names and source paths before applying mappings.');
      return;
    }
    
    // Apply the mappings by running a test query
    try {
      setIsTestingQuery(true);
      const testQueryData = { 
        ...query, 
        limit: Math.min(query.limit || 25, 100), // Reasonable limit for testing
        discoverSchema: false 
      };
      onChange(testQueryData);
      setTimeout(() => {
        onRunQuery();
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }, 100);
    } catch (error) {
      console.error('Failed to apply field mappings:', error);
      alert('Failed to apply field mappings. Please check your configuration.');
    } finally {
      setTimeout(() => setIsTestingQuery(false), 2000);
    }
  };

  const {
    partiql,
    table,
    partitionKeyName,
    partitionKeyValue,
    partitionKeyMode,
    partitionKeyValues,
    sortKeyName,
    sortKeyValue,
    sortKeyOperator,
    sortKeyRangeStart,
    sortKeyRangeEnd,
    sortKeyValues,
    sortDirection,
    limit,
    outputFormat,
    fieldMappings,
  } = query;

  const resolvedPartitionMode = partitionKeyMode ?? 'single';
  const resolvedSortOperator = sortKeyOperator ?? 'eq';
  const resolvedSortDirection = sortDirection ?? 'asc';

  const outputFormatOptions = [
    { label: 'Auto-detect', value: 'auto' },
    { label: 'Table View', value: 'table' },
    { label: 'Geomap', value: 'geomap' },
    { label: 'Time Series', value: 'timeseries' }
  ];

  const partitionModeOptions: Array<SelectableValue<'single' | 'in'>> = [
    { label: 'Single value', value: 'single' },
    { label: 'Multiple values (IN)', value: 'in' },
  ];

  const sortOperatorOptions: Array<SelectableValue<string>> = [
    { label: 'Equals (=)', value: 'eq' },
    { label: 'IN (multiple values)', value: 'in' },
    { label: 'Begins with', value: 'begins_with' },
    { label: 'Between', value: 'between' },
    { label: '>=', value: 'gte' },
    { label: '>', value: 'gt' },
    { label: '<=', value: 'lte' },
    { label: '<', value: 'lt' },
  ];

  const sortDirectionOptions: Array<SelectableValue<'asc' | 'desc'>> = [
    { label: 'Ascending', value: 'asc' },
    { label: 'Descending', value: 'desc' },
  ];

  const dataTypeOptions = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Time', value: 'time' },
    { label: 'JSON', value: 'json' }
  ];

  return (
    <div className={styles.container}>
      {/* Query Type Selection */}
      <div className={styles.querySection}>
        <RadioButtonGroup
          options={[
            { label: 'PartiQL Query', value: 'partiql' },
            { label: 'Key Query', value: 'key' },
          ]}
          value={queryMode}
          onChange={(value) => {
            if (value === 'partiql') {
              onChange({
                ...query,
                queryMode: 'partiql',
                partiql: query.partiql ?? 'SELECT * FROM "YourTableName"',
              });
            } else {
              onChange({
                ...query,
                queryMode: 'key',
                partiql: undefined,
              });
            }
          }}
        />
      </div>

      {/* Query Configuration */}
      <div className={styles.querySection}>
        {queryMode === 'partiql' ? (
          <div>
            <div className={styles.fieldContainer}>
              <label className={styles.fieldLabel}>PartiQL Query</label>
              <Input
                placeholder='SELECT * FROM "YourTableName"'
                value={partiql ?? ''}
                onChange={onFieldChange('partiql')}
                onBlur={onRunQuery}
              />
              
              {/* Template Variable Validation Warnings */}
              {(() => {
                const validation = validateTemplateVariables(partiql || '');
                if (validation.warnings.length > 0) {
                  return (
                    <div style={{ marginTop: theme.spacing(1) }}>
                      {validation.warnings.map((warning, index) => (
                        <Alert key={index} severity="warning" title="Template Variable Warning">
                          {warning}
                        </Alert>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Template Variables Help Section */}
            <div style={{ marginTop: theme.spacing(1) }}>
              <Button
                variant="secondary"
                size="sm"
                icon={showTemplateVariableHelp ? "angle-down" : "angle-right"}
                fill="text"
                onClick={() => setShowTemplateVariableHelp(!showTemplateVariableHelp)}
              >
                Template Variables ({availableVariables.length} available)
              </Button>
            </div>

            {showTemplateVariableHelp && (
              <div className={styles.advancedSection}>
                <h4 style={{ margin: 0, marginBottom: theme.spacing(1) }}>Template Variable Usage</h4>
                
                {availableVariables.length > 0 && (
                  <div style={{ marginBottom: theme.spacing(2) }}>
                    <label className={styles.fieldLabel}>Available Variables:</label>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: theme.spacing(0.5),
                      marginTop: theme.spacing(0.5)
                    }}>
                      {availableVariables.map((variable) => (
                        <code 
                          key={variable}
                          style={{ 
                            background: theme.colors.background.secondary,
                            padding: '2px 6px',
                            borderRadius: theme.shape.borderRadius(),
                            fontSize: theme.typography.bodySmall.fontSize,
                            border: `1px solid ${theme.colors.border.weak}`
                          }}
                        >
                          {variable}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.infoText}>
                  <strong>PartiQL Template Variable Examples:</strong>
                  <br/>• <code>SELECT * FROM &quot;$table_name&quot; WHERE status = &quot;$status&quot;</code>
                  <br/>• <code>SELECT * FROM &quot;users&quot; WHERE region IN ($regions)</code>
                  <br/>• <code>SELECT * FROM &quot;logs&quot; WHERE $__timeFilter</code>
                  <br/>• <code>SELECT * FROM &quot;events&quot; WHERE userId = &quot;{'${user_id}'}&quot; AND $__timeFilter</code>
                  <br/>• <code>SELECT * FROM &quot;logs&quot; WHERE timestamp BETWEEN $__from AND $__to</code>
                  <br/><br/>
                  <strong>Variable Syntax:</strong>
                  <br/>• <code>$variable</code> - Simple variable substitution
                  <br/>• <code>{'${variable}'}</code> - Variable in middle of expression
                  <br/>• <code>$__timeFilter</code> - Automatic time range filtering (when enabled)
                  <br/>• <code>$__from</code>, <code>$__to</code> - Built-in time range variables
                  <br/>• Multi-value variables automatically format as comma-separated quoted values
                  <br/><br/>
                  <strong>⚠️ Important:</strong> Don&apos;t use <code>LIMIT</code> in PartiQL queries. Use the &quot;Limit&quot; field below instead.
                </div>
              </div>
            )}
            
            {/* Limit field for PartiQL queries */}
            <div className={`${styles.formRow} ${styles.mobileStack}`} style={{ marginTop: theme.spacing(2) }}>
              <div className={styles.smallFieldContainer}>
                <label className={styles.fieldLabel}>Limit</label>
                <Input 
                  type="number" 
                  placeholder="100" 
                  value={limit || 100} 
                  onChange={onLimitChange} 
                />
              </div>
              
              <div className={styles.fieldContainer}>
                <label className={styles.fieldLabel}>Output Format</label>
                <Select
                  value={outputFormatOptions.find(opt => opt.value === outputFormat)}
                  options={outputFormatOptions}
                  onChange={onOutputFormatChange}
                />
              </div>
            </div>

            {/* Time Filtering Section for PartiQL */}
            <div className={`${styles.formRow} ${styles.mobileStack}`} style={{ marginTop: theme.spacing(2) }}>
              <InlineField label="Enable Time Filtering" labelWidth={20}>
                <InlineSwitch
                  value={query.timeFilterEnabled || false}
                  onChange={(event) => {
                    const enabled = event.currentTarget.checked;
                    onChange({ 
                      ...query, 
                      timeFilterEnabled: enabled,
                      // Set default timestamp field when enabling, clear when disabling
                      timestampField: enabled ? (query.timestampField || 'timestamp') : undefined,
                      // Clear time values if disabling
                      timeFrom: enabled ? query.timeFrom : undefined,
                      timeTo: enabled ? query.timeTo : undefined
                    });
                  }}
                />
              </InlineField>
            </div>
            
            {query.timeFilterEnabled && (
              <div className={`${styles.formRow} ${styles.mobileStack}`}>
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Timestamp Field Name</label>
                  <Input 
                    placeholder="timestamp" 
                    value={query.timestampField || 'timestamp'} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      onChange({ ...query, timestampField: e.target.value });
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className={styles.buttonGroup}>
              <Button 
                className={styles.testQueryButton}
                variant="primary" 
                size="sm" 
                icon="play"
                disabled={isTestingQuery}
                onClick={testQuery}
              >
                {isTestingQuery ? 'Testing...' : 'Test Query'}
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm" 
                icon="search"
                onClick={generateFieldMappingsFromData}
                disabled={isDiscovering}
              >
                {isDiscovering ? 'Discovering Fields...' : 'Discover Schema'}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Table Name Row */}
            <div className={`${styles.formRow} ${styles.mobileStack}`}>
              <div className={styles.fieldContainer}>
                <label className={styles.fieldLabel}>Table Name</label>
                <Input 
                  placeholder="YourTableName or $table_name" 
                  value={table || ''} 
                  onChange={onFieldChange('table')} 
                />
                {availableVariables.length > 0 && (
                  <div className={styles.infoText} style={{ marginTop: theme.spacing(0.5) }}>
                    💡 Use template variables: {availableVariables.slice(0, 3).join(', ')}
                    {availableVariables.length > 3 && ` and ${availableVariables.length - 3} more`}
                  </div>
                )}
              </div>
              
              <div style={{ alignSelf: 'flex-end' }}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  icon="search"
                  disabled={isDiscovering}
                  onClick={discoverSchema}
                >
                  {isDiscovering ? 'Discovering...' : 'Discover Schema'}
                </Button>
              </div>
            </div>
            
            {/* Partition Key Row */}
            <div className={`${styles.keyValueRow} ${styles.mobileStack}`}>
              <div className={styles.smallFieldContainer}>
                <label className={styles.fieldLabel}>Partition Key</label>
                <Input 
                  placeholder="id" 
                  value={partitionKeyName || ''} 
                  onChange={onFieldChange('partitionKeyName')} 
                />
              </div>
              <span className={styles.equalSign}>=</span>
              <div className={styles.fieldContainer}>
                <label className={styles.fieldLabel}>Partition Key Value</label>
                <Input 
                  placeholder="0009 or $user_id (or empty for all)" 
                  value={partitionKeyValue || ''} 
                  onChange={onFieldChange('partitionKeyValue')} 
                  disabled={resolvedPartitionMode === 'in'}
                />
              </div>
            </div>
            
            <div className={`${styles.formRow} ${styles.mobileStack}`}>
              <InlineField label="Partition Key Mode" labelWidth={20}>
                <RadioButtonGroup
                  value={resolvedPartitionMode}
                  onChange={(value) => onPartitionModeChange(value as 'single' | 'in')}
                  options={partitionModeOptions}
                />
              </InlineField>
            </div>

            {resolvedPartitionMode === 'in' && (
              <div className={styles.fieldContainer}>
                <label className={styles.fieldLabel}>Partition Key Values (IN)</label>
                <TextArea
                  rows={3}
                  placeholder="value1&#10;value2&#10;${variable}"
                  value={(partitionKeyValues && partitionKeyValues.length > 0 ? partitionKeyValues : partitionKeyValue ? [partitionKeyValue] : [])
                    .join('\n')}
                  onChange={onPartitionValuesChange}
                />
                <div className={styles.infoText}>
                  Provide one value per line. Template variables are supported and will be expanded before querying DynamoDB.
                </div>
              </div>
            )}
            
            {/* Sort Key Row */}
            <div className={`${styles.keyValueRow} ${styles.mobileStack}`}>
              <div className={styles.smallFieldContainer}>
                <label className={styles.fieldLabel}>Sort Key</label>
                <Input 
                  placeholder="Timestamp (optional)" 
                  value={sortKeyName || ''} 
                  onChange={onFieldChange('sortKeyName')} 
                />
              </div>
              <div className={styles.smallFieldContainer}>
                <label className={styles.fieldLabel}>Operator</label>
                <Select
                  options={sortOperatorOptions}
                  value={sortOperatorOptions.find((opt) => opt.value === resolvedSortOperator) ?? sortOperatorOptions[0]}
                  onChange={onSortOperatorChange}
                  placeholder="Select operator"
                  menuShouldPortal
                />
              </div>
              {resolvedSortOperator === 'between' ? (
                <>
                  <div className={styles.fieldContainer}>
                    <label className={styles.fieldLabel}>Range start</label>
                    <Input
                      placeholder="From value"
                      value={sortKeyRangeStart ?? ''}
                      onChange={onFieldChange('sortKeyRangeStart')}
                    />
                  </div>
                  <div className={styles.fieldContainer}>
                    <label className={styles.fieldLabel}>Range end</label>
                    <Input
                      placeholder="To value"
                      value={sortKeyRangeEnd ?? ''}
                      onChange={onFieldChange('sortKeyRangeEnd')}
                    />
                  </div>
                </>
              ) : resolvedSortOperator === 'in' ? (
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Sort Key Values (IN)</label>
                  <TextArea
                    rows={3}
                    placeholder="value1&#10;value2&#10;value3"
                    value={(sortKeyValues && sortKeyValues.length > 0 ? sortKeyValues : sortKeyValue ? [sortKeyValue] : [])
                      .join('\n')}
                    onChange={onSortKeyValuesChange}
                  />
                  <div className={styles.infoText}>
                    Provide one value per line. Template variables are supported.
                  </div>
                </div>
              ) : (
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Sort Key Value</label>
                  <Input
                    placeholder="1753765220, $timestamp, or use time filtering below"
                    value={sortKeyValue || ''}
                    onChange={onFieldChange('sortKeyValue')}
                    disabled={resolvedSortOperator === 'in'}
                  />
                </div>
              )}
            </div>
            
            <div className={`${styles.formRow} ${styles.mobileStack}`}>
              <InlineField label="Sort Direction" labelWidth={20}>
                <RadioButtonGroup
                  value={resolvedSortDirection}
                  onChange={(value) => onSortDirectionChange(value as 'asc' | 'desc')}
                  options={sortDirectionOptions}
                />
              </InlineField>
            </div>
            
            {/* Time Filtering Section */}
            <div className={`${styles.formRow} ${styles.mobileStack}`}>
              <div style={{ marginBottom: theme.spacing(1), fontSize: theme.typography.bodySmall.fontSize, color: theme.colors.text.secondary }}>
                💡 Time filtering automatically applies a WHERE condition to filter results by timestamp field
              </div>
              <InlineField label="Enable Time Filtering" labelWidth={20}>
                <InlineSwitch
                  value={query.timeFilterEnabled || false}
                  onChange={(event) => {
                    const enabled = event.currentTarget.checked;
                    onChange({ 
                      ...query, 
                      timeFilterEnabled: enabled,
                      // Set default timestamp field when enabling, clear when disabling
                      timestampField: enabled ? (query.timestampField || 'timestamp') : undefined,
                      // Clear time values if disabling
                      timeFrom: enabled ? query.timeFrom : undefined,
                      timeTo: enabled ? query.timeTo : undefined
                    });
                  }}
                />
              </InlineField>
            </div>
            
            {query.timeFilterEnabled && (
              <>
                <div className={`${styles.formRow} ${styles.mobileStack}`}>
                  <div className={styles.fieldContainer}>
                    <label className={styles.fieldLabel}>Timestamp Field Name</label>
                    <Input 
                      placeholder="timestamp" 
                      value={query.timestampField || 'timestamp'} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        onChange({ ...query, timestampField: e.target.value || 'timestamp' });
                      }}
                    />
                  </div>
                </div>
                
                <div className={`${styles.formRow} ${styles.mobileStack}`}>
                  <div className={styles.fieldContainer}>
                    <label className={styles.fieldLabel}>From Date/Time</label>
                    <DateTimePicker
                      date={query.timeFrom ? dateTime(query.timeFrom) : dateTime().subtract(24, 'hours')}
                      onChange={(newTime?: DateTime) => {
                        if (newTime) {
                          onChange({ ...query, timeFrom: newTime.toISOString() });
                        }
                      }}
                    />
                  </div>
                  
                  <div className={styles.fieldContainer}>
                    <label className={styles.fieldLabel}>To Date/Time</label>
                    <DateTimePicker
                      date={query.timeTo ? dateTime(query.timeTo) : dateTime()}
                      onChange={(newTime?: DateTime) => {
                        if (newTime) {
                          onChange({ ...query, timeTo: newTime.toISOString() });
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Limit and Output Format Row */}
            <div className={`${styles.formRow} ${styles.mobileStack}`}>
              <div className={styles.smallFieldContainer}>
                <label className={styles.fieldLabel}>Limit</label>
                <Input 
                  type="number" 
                  placeholder="100" 
                  value={limit || 100} 
                  onChange={onLimitChange} 
                />
              </div>
              
              <div className={styles.fieldContainer}>
                <label className={styles.fieldLabel}>Output Format</label>
                <Select
                  value={outputFormatOptions.find(opt => opt.value === outputFormat)}
                  options={outputFormatOptions}
                  onChange={onOutputFormatChange}
                />
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className={styles.buttonGroup}>
              <Button 
                className={styles.testQueryButton}
                variant="primary" 
                size="md" 
                icon="play"
                disabled={isTestingQuery}
                onClick={testQuery}
              >
                {isTestingQuery ? 'Executing Query...' : 'Run Query'}
              </Button>
              
              <Button 
                variant="secondary" 
                size="md" 
                icon="search"
                onClick={generateFieldMappingsFromData}
                disabled={isDiscovering}
              >
                {isDiscovering ? 'Discovering Fields...' : 'Discover Schema'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Field Mapping */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          icon={showAdvanced ? "angle-down" : "angle-right"}
          fill="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Advanced Field Mapping ({(fieldMappings || []).length} fields)
        </Button>
      </div>

      {showAdvanced && (
        <div className={styles.advancedSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0 }}>Field Mappings</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm" icon="plus" onClick={addFieldMapping}>
                Add Field
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                icon="check"
                onClick={applyFieldMappings}
                disabled={(fieldMappings || []).length === 0}
              >
                Apply Mappings
              </Button>
            </div>
          </div>

          {showSuccessMessage && (
            <div className={styles.successMessage}>
              ✅ Field mappings applied successfully! Check the results below.
            </div>
          )}

          {(fieldMappings || []).map((mapping, index) => (
            <div key={index} className={styles.fieldMappingCard}>
              <div className={styles.responsiveGrid}>
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Field Name</label>
                  <Input
                    value={mapping.fieldName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateFieldMapping(index, 'fieldName', e.target.value)}
                    placeholder="Display name (e.g., 'User ID')"
                  />
                </div>
                
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Source Path</label>
                  <Input
                    value={mapping.sourcePath}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateFieldMapping(index, 'sourcePath', e.target.value)}
                    placeholder="Data path (e.g., 'user.id', 'items[0].name')"
                  />
                </div>
                
                <div className={styles.smallFieldContainer}>
                  <label className={styles.fieldLabel}>Data Type</label>
                  <Select
                    value={dataTypeOptions.find(opt => opt.value === mapping.dataType)}
                    options={dataTypeOptions}
                    onChange={(value) => updateFieldMapping(index, 'dataType', value.value || 'string')}
                  />
                </div>
                
                <div className={styles.fieldContainer}>
                  <label className={styles.fieldLabel}>Transform</label>
                  <Input
                    value={mapping.transformation || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateFieldMapping(index, 'transformation', e.target.value)}
                    placeholder="parseFloat, timestamp"
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: '20px' }}>
                  <Button
                    variant="destructive"
                    size="sm"
                    icon="trash-alt"
                    onClick={() => removeFieldMapping(index)}
                  />
                </div>
              </div>
            </div>
          ))}

          {(fieldMappings || []).length === 0 && (
            <Alert severity="info" title="No field mappings configured">
              <strong>Quick Start:</strong>
              <br/>1. Click <strong>&quot;Discover Schema&quot;</strong> above to automatically analyze your table
              <br/>2. Or manually add field mappings using the <strong>&quot;Add Field&quot;</strong> button
              <br/>3. Click <strong>&quot;Apply Mappings&quot;</strong> to test your configuration
              <br/><br/>
              <strong>Field Mapping Examples:</strong>
              <br/>• Field Name: &quot;User ID&quot; → Source Path: &quot;userId&quot; → Type: &quot;string&quot;
              <br/>• Field Name: &quot;Location&quot; → Source Path: &quot;geo.coordinates&quot; → Type: &quot;json&quot;
              <br/>• Field Name: &quot;Score&quot; → Source Path: &quot;metrics.score&quot; → Type: &quot;number&quot;
            </Alert>
          )}

        </div>
      )}
    </div>
  );
}
