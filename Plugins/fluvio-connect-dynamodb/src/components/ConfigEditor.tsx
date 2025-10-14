import React, { useEffect, useState } from "react";
import { ConnectionConfig } from "@grafana/aws-sdk";
import { DataSourcePluginOptionsEditorProps } from "@grafana/data";
import { DynamoDBDataSourceOptions, DynamoDBDataSourceSecureJsonData, UploadPreset } from "../types";
import { CodeEditor, Field, Input, TextArea } from "@grafana/ui";

interface Props extends DataSourcePluginOptionsEditorProps<DynamoDBDataSourceOptions, DynamoDBDataSourceSecureJsonData> { }

const standardRegions = [
  "af-south-1",
  "ap-east-1",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-northeast-3",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-southeast-3",
  "ca-central-1",
  "cn-north-1",
  "cn-northwest-1",
  "eu-central-1",
  "eu-north-1",
  "eu-south-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "me-south-1",
  "sa-east-1",
  "us-east-1",
  "us-east-2",
  "us-gov-east-1",
  "us-gov-west-1",
  "us-west-1",
  "us-west-2",
];

export function ConfigEditor(props: Props) {
  const [presetDraft, setPresetDraft] = useState<string>(() => formatPresets(props.options.jsonData.uploadPresets));
  const [presetError, setPresetError] = useState<string | undefined>(undefined);

  const onTestTableChange: React.FormEventHandler<HTMLInputElement> = e => {
    props.onOptionsChange({
      ...props.options,
      jsonData:
      {
        ...props.options.jsonData,
        connectionTestTable: e.currentTarget.value
      }
    });
  };

  const onMaxPayloadChange: React.FormEventHandler<HTMLInputElement> = e => {
    const value = e.currentTarget.value;
    const parsed = value ? Number.parseInt(value, 10) : undefined;
    props.onOptionsChange({
      ...props.options,
      jsonData: {
        ...props.options.jsonData,
        maxUploadPayloadKB: Number.isFinite(parsed as number) && (parsed as number) > 0 ? parsed : undefined,
      }
    });
  };

  const onPresetBlur = () => {
    if (!presetDraft.trim()) {
      setPresetError(undefined);
      props.onOptionsChange({
        ...props.options,
        jsonData: {
          ...props.options.jsonData,
          uploadPresets: [],
        }
      });
      return;
    }

    try {
      const parsed = JSON.parse(presetDraft);
      if (!Array.isArray(parsed)) {
        throw new Error("Upload presets must be a JSON array");
      }
      props.onOptionsChange({
        ...props.options,
        jsonData: {
          ...props.options.jsonData,
          uploadPresets: parsed as UploadPreset[],
        }
      });
      setPresetError(undefined);
    } catch (error) {
      setPresetError(error instanceof Error ? error.message : "Invalid JSON payload");
    }
  };

  useEffect(() => {
    setPresetDraft(formatPresets(props.options.jsonData.uploadPresets));
  }, [props.options.jsonData.uploadPresets]);

  return (
    <div className="width-40">
      <ConnectionConfig {...props} standardRegions={standardRegions} />
      <Field label="Test table" description="Name of table for connection test">
        <Input value={props.options.jsonData.connectionTestTable} onChange={onTestTableChange} aria-label="Test table"></Input>
      </Field>
      <Field label="Default upload payload limit (KB)" description="Applied when presets do not specify their own limit">
        <Input
          type="number"
          min={1}
          value={props.options.jsonData.maxUploadPayloadKB ?? ""}
          onChange={onMaxPayloadChange}
          aria-label="Max upload payload KB"
        />
      </Field>
      <Field
        label="Upload presets"
        description="Define reusable upload presets as JSON. Each preset controls allowed operations for end-user uploads."
        error={presetError}
      >
        <CodeEditor
          value={presetDraft}
          language="json"
          height={200}
          showLineNumbers
          onBlur={onPresetBlur}
          onChange={value => setPresetDraft(value ?? "")}
        />
      </Field>
      <Field label="Notes">
        <TextArea
          value={
            "Example preset:\n[\n  {\n    \"id\": \"insertTelemetry\",\n    \"name\": \"Insert telemetry row\",\n    \"table\": \"TelemetryTable\",\n    \"operation\": \"insert\",\n    \"schema\": [\n      { \"name\": \"PK\", \"type\": \"string\", \"required\": true },\n      { \"name\": \"SK\", \"type\": \"string\", \"required\": true }\n    ],\n    \"allowDryRun\": true\n  }\n]"
          }
          rows={6}
          readOnly
        />
      </Field>
    </div>
  );
};

function formatPresets(presets?: UploadPreset[]): string {
  if (!presets || presets.length === 0) {
    return "";
  }
  try {
    return JSON.stringify(presets, null, 2);
  } catch {
    return "";
  }
}
