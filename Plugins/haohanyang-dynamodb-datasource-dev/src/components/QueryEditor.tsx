import React, { useRef, useState, useEffect } from "react";
import { Button, CodeEditor, Field, IconButton, InlineField, InlineFieldRow, Input, Select, HorizontalGroup, Switch } from "@grafana/ui";
import { QueryEditorProps, SelectableValue } from "@grafana/data";
import { DataSource } from "../datasource";
import { DynamoDBDataSourceOptions, DynamoDBQuery, DatetimeFormat } from "../types";
import * as monacoType from "monaco-editor/esm/vs/editor/editor.api";
import "./QueryEditor.css";
import { Divider } from "@grafana/aws-sdk";
import { getBackendSrv } from '@grafana/runtime';

type Props = QueryEditorProps<DataSource, DynamoDBQuery, DynamoDBDataSourceOptions>;

const datetimeFormatOptions: Array<SelectableValue<string>> = [
  {
    label: "Unix timestamp(s)",
    value: DatetimeFormat.UnixTimestampSeconds,
    description: "The number of seconds that have elapsed since January 1, 1970 (also known as the Unix epoch), e.g., 1674512096"
  },
  {
    label: "Unix timestamp(ms)",
    value: DatetimeFormat.UnixTimestampMiniseconds,
    description: "The number of miliseconds that have elapsed since January 1, 1970 (also known as the Unix epoch), e.g., 1674512096000"
  },
  {
    label: "Custom format",
    value: DatetimeFormat.CustomFormat,
    description: "User-defined format (moment.js/day.js)"
  }
];



export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const codeEditorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);
  const [datetimeAttributeInput, setDatetimeAttributeInput] = useState<string>("");
  const [datetimeFormatOption, setDatetimeFormatOption] = useState<string>(DatetimeFormat.UnixTimestampSeconds);
  const [customDatetimeFormatInput, setCustomDatetimeFormatInput] = useState<string>("");
  const [tables, setTables] = useState<Array<SelectableValue<string>>>([]);
  const [loadingTables, setLoadingTables] = useState<boolean>(false);
  const [tableAttributes, setTableAttributes] = useState<Array<SelectableValue<string>>>([]);
  const [loadingAttributes, setLoadingAttributes] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  

  const onQueryTextChange = (text: string) => {
    onChange({ ...query, queryText: text });
  };

  const onLimitChange: React.FormEventHandler<HTMLInputElement> = e => {
    if (!e.currentTarget.value) {
      onChange({ ...query, limit: undefined });
    } else {
      const parsed = Number.parseInt(e.currentTarget.value, 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        onChange({ ...query, limit: parsed });
      }
    }
  };


  const onFormatQueryText = () => {
    if (codeEditorRef.current) {
      codeEditorRef.current.getAction("editor.action.formatDocument").run();
    }
  };

  const onAddDatetimeField = () => {
    let format = "";
    if (datetimeFormatOption === DatetimeFormat.UnixTimestampMiniseconds || datetimeFormatOption === DatetimeFormat.UnixTimestampSeconds) {
      format = datetimeFormatOption;
    } else {
      format = customDatetimeFormatInput;
    }

    if (datetimeAttributeInput && format && !(query.datetimeAttributes || []).map(e => e.name).includes(datetimeAttributeInput)) {
      onChange({
        ...query,
        datetimeAttributes: [...(query.datetimeAttributes || []), { name: datetimeAttributeInput, format: format }]
      });
      setDatetimeAttributeInput("");
      setCustomDatetimeFormatInput("");
    }
  };

  const showTimeFormat = (format: string) => {
    if (format === DatetimeFormat.UnixTimestampSeconds) {
      return "Unix timestamp(s)";
    } else if (format === DatetimeFormat.UnixTimestampMiniseconds) {
      return "Unix timestamp(ms)";
    } else {
      return format;
    }
  };


  const onRemoveDatetimeAttribute = (name: string) => {
    onChange({
      ...query,
      datetimeAttributes: (query.datetimeAttributes || []).filter(e => e.name !== name)
    });
  };

  const onCodeEditorDidMount = (e: monacoType.editor.IStandaloneCodeEditor) => {
    codeEditorRef.current = e;
  };

  const onRunQueryClick = () => {
    if (onRunQuery) {
      onRunQuery();
    }
  };

  const insertSampleQuery = (sampleQuery: string) => {
    onChange({ ...query, queryText: sampleQuery });
  };


  const onSortByChange: React.FormEventHandler<HTMLInputElement> = e => {
    onChange({ ...query, sortBy: e.currentTarget.value || undefined });
  };

  const onSortDirectionChange = (value: SelectableValue<string>) => {
    onChange({ ...query, sortDirection: (value.value as 'asc' | 'desc') || undefined });
  };

  const sortDirectionOptions: Array<SelectableValue<string>> = [
    { label: 'None', value: '' },
    { label: 'Ascending', value: 'asc' },
    { label: 'Descending', value: 'desc' }
  ];

  // Dynamic sort key options based on table attributes
  const sortKeyOptions: Array<SelectableValue<string>> = [
    { label: 'None (default behavior)', value: '' },
    ...tableAttributes
  ];

  // Fetch tables on component mount
  useEffect(() => {
    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const response = await getBackendSrv().fetch<{ tables: string[] }>({
          url: `/api/datasources/${datasource.id}/resources/tables`,
          method: 'GET',
        }).toPromise();
        
        if (response?.data?.tables) {
          const tableOptions = response.data.tables.map((table: string) => ({
            label: table,
            value: table,
          }));
          setTables(tableOptions);
        }
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      } finally {
        setLoadingTables(false);
      }
    };

    fetchTables();
  }, [datasource.id]);

  const fetchTableAttributes = async (tableName: string) => {
    setLoadingAttributes(true);
    try {
      const response = await getBackendSrv().fetch<{ attributes: string[] }>({
        url: `/api/datasources/${datasource.id}/resources/table-attributes?table=${encodeURIComponent(tableName)}`,
        method: 'GET',
      }).toPromise();
      
      if (response?.data?.attributes) {
        const attributeOptions = response.data.attributes.map((attr: string) => ({
          label: attr,
          value: attr,
        }));
        setTableAttributes(attributeOptions);
      }
    } catch (error) {
      console.error('Failed to fetch table attributes:', error);
      setTableAttributes([]);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const onTableSelect = (value: SelectableValue<string>) => {
    if (value.value) {
      const newQuery = `SELECT * FROM "${value.value}"`;
      onChange({ ...query, queryText: newQuery });
      setSelectedTable(value.value);
      fetchTableAttributes(value.value);
    } else {
      setSelectedTable('');
      setTableAttributes([]);
    }
  };

  const onScanIndexForwardChange = (checked: boolean) => {
    onChange({ ...query, scanIndexForward: checked });
  };

  const onSortKeyChange = (value: SelectableValue<string>) => {
    onChange({ ...query, sortKey: value.value || undefined });
  };

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Table" tooltip="Select a table to auto-generate query" labelWidth={11}>
          <Select 
            options={tables} 
            placeholder="Select table..." 
            onChange={onTableSelect}
            isLoading={loadingTables}
            width={40}
            isClearable
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Limit" tooltip="(Optional) The maximum number of items to evaluate" labelWidth={11}>
          <Input type="number" min={0} value={query.limit} onChange={onLimitChange} aria-label="Limit" width={15} />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Sort By" tooltip="(Optional) Client-side sorting - works for any field" labelWidth={11}>
          <Input 
            placeholder="field name (e.g., serial, timestamp)" 
            value={query.sortBy || ''} 
            onChange={onSortByChange} 
            aria-label="Sort By" 
            width={15} 
          />
        </InlineField>
        <InlineField label="Direction" labelWidth={11}>
          <Select 
            options={sortDirectionOptions} 
            value={query.sortDirection || ''} 
            width={15}
            onChange={onSortDirectionChange} 
            aria-label="Sort Direction" 
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField 
          label="Sort Key Attribute" 
          tooltip="Select the sort key attribute for DynamoDB native sorting. Only works with exact equality (=) on partition key."
          labelWidth={18}
        >
          <Select 
            options={sortKeyOptions} 
            value={query.sortKey || ''} 
            width={25}
            onChange={onSortKeyChange} 
            aria-label="Sort Key Attribute"
            isLoading={loadingAttributes}
            placeholder={selectedTable ? "Loading attributes..." : "Select table first"}
            isDisabled={!selectedTable}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField 
          label="Native Sort Order" 
          tooltip="DynamoDB Query API ScanIndexForward (true=ascending, false=descending). Only works with Query API (partition key + optional sort key conditions)."
          labelWidth={18}
        >
          <Switch 
            value={query.scanIndexForward !== undefined ? query.scanIndexForward : true} 
            onChange={(e) => onScanIndexForwardChange(e.currentTarget.checked)}
          />
        </InlineField>
        <span style={{ marginLeft: '8px', color: '#888' }}>
          {query.scanIndexForward !== undefined && !query.scanIndexForward ? '(Descending)' : '(Ascending)'}
        </span>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Attribute" tooltip="Attribute which has datetime data type" labelWidth={11}>
          <Input value={datetimeAttributeInput} onChange={e => setDatetimeAttributeInput(e.currentTarget.value)}
            data-testid="datetime-attribute-input" width={15} />
        </InlineField>
        <InlineField label="Format" labelWidth={11}>
          <Select options={datetimeFormatOptions} value={datetimeFormatOption} width={25}
            onChange={sv => sv.value && setDatetimeFormatOption(sv.value)} data-testid="datetime-format-select" />
        </InlineField>
        <Button onClick={onAddDatetimeField} data-testid="datetime-format-add">Add</Button>
      </InlineFieldRow>
      {datetimeFormatOption === DatetimeFormat.CustomFormat && (
        <InlineFieldRow>
          <InlineField label="Custom Format" labelWidth={11}>
            <Input placeholder="Enter day.js datatime format" value={customDatetimeFormatInput} onChange={e => setCustomDatetimeFormatInput(e.currentTarget.value)} width={25} />
          </InlineField>
        </InlineFieldRow>
      )}
      <ul className="datatime-attribute-list">
        {(query.datetimeAttributes || []).map((a, i) =>
          <li className="datatime-attribute-item" key={i}>
            <span className="datatime-attribute-name">{a.name}</span>
            <IconButton name="times" size="lg" tooltip={"Remove \"" + a.name + ": " + showTimeFormat(a.format) + "\""} className="datatime-attribute-remove-btn" onClick={() => onRemoveDatetimeAttribute(a.name)} />
          </li>)}
      </ul>
      
      <Divider />
      <Field label="Query Text" description="The PartiQL statement representing the operation to run">
        <CodeEditor
          onBlur={onQueryTextChange}
          value={query.queryText || ""}
          width="100%"
          height="120px"
          language="sql"
          showMiniMap={false}
          monacoOptions={{ fontSize: 14 }}
          onEditorDidMount={onCodeEditorDidMount}
        />
      </Field>
      <HorizontalGroup spacing="sm">
        <Button onClick={onRunQueryClick} variant="primary" icon="play">
          Run Query
        </Button>
        <Button onClick={onFormatQueryText} variant="secondary">
          Format
        </Button>
        <Button 
          onClick={() => insertSampleQuery('SELECT * FROM "datastore-Test-TelemetryTable2"')} 
          variant="secondary"
          size="sm"
        >
          Sample: All Data
        </Button>
        <Button 
          onClick={() => insertSampleQuery('SELECT * FROM "datastore-Test-TelemetryTable2" WHERE "id" = \'0001\'')} 
          variant="secondary"
          size="sm"
        >
          Sample: Filter by ID
        </Button>
        <Button 
          onClick={() => insertSampleQuery('SELECT * FROM "datastore-Test-TelemetryTable2" WHERE "label" = \'Kombito\'')} 
          variant="secondary"
          size="sm"
        >
          Sample: Filter by Label
        </Button>
        <Button 
          onClick={() => insertSampleQuery('SELECT * FROM "datastore-Test-TelemetryTable2" WHERE $__timeFilter(timestamp)')} 
          variant="secondary"
          size="sm"
        >
          Sample: Time Filter
        </Button>
      </HorizontalGroup>
    </>
  );
}
