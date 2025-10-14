import React from 'react';
import { CodeEditor, InlineField } from '@grafana/ui';

export interface VariableQuery {
  query: string;
}

interface VariableQueryProps {
  query: VariableQuery;
  onChange: (query: VariableQuery, definition: string) => void;
}

export function VariableQueryEditor({ query, onChange }: VariableQueryProps) {
  const handleQueryChange = (value: string) => {
    onChange({ query: value }, value);
  };

  return (
    <div className="gf-form">
      <InlineField label="Query" labelWidth={20} grow>
        <CodeEditor
          value={query.query || ''}
          language="sql"
          height="120px"
          onBlur={handleQueryChange}
          showMiniMap={false}
          monacoOptions={{ fontSize: 14 }}
        />
      </InlineField>
    </div>
  );
}
