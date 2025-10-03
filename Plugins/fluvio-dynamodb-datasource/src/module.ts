import { DataSourcePlugin } from '@grafana/data';
import { FluvioDataSourceOptions, DynamoQuery } from './types';
import { DataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';

export const plugin = new DataSourcePlugin<DataSource, DynamoQuery, FluvioDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
