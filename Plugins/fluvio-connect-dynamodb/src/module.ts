import { DataSourcePlugin } from "@grafana/data";
import { DataSource } from "./datasource";
import { ConfigEditor } from "./components/ConfigEditor";
import { QueryEditor } from "./components/QueryEditor";
import { VariableQueryEditor } from "./components/VariableQueryEditor";
import { DynamoDBQuery, DynamoDBDataSourceOptions } from "./types";

export const plugin = new DataSourcePlugin<DataSource, DynamoDBQuery, DynamoDBDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setVariableQueryEditor(VariableQueryEditor);
