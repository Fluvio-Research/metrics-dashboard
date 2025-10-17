import React, { useMemo, useState } from 'react';
import { Alert, Button, Icon } from '@grafana/ui';
import { css } from '@emotion/css';
import { ParsedFileData, ValidationError } from '../../types';
import { HelpTooltip } from '../shared/HelpTooltip';

interface DataPreviewProps {
  data: ParsedFileData[];
  validationErrors?: ValidationError[];
  maxRows?: number;
  onEdit?: (fileIndex: number, rowIndex: number, field: string, value: string) => void;
}

export const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  validationErrors = [],
  maxRows = 100,
  onEdit,
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set([0]));

  const toggleFile = (index: number) => {
    setExpandedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const errorsByRow = useMemo(() => {
    const map = new Map<string, ValidationError[]>();
    validationErrors.forEach((error) => {
      const key = `${error.row || 0}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(error);
    });
    return map;
  }, [validationErrors]);

  const totalRows = data.reduce((sum, file) => sum + file.rowCount, 0);
  const totalErrors = validationErrors.filter((e) => e.severity === 'error').length;
  const totalWarnings = validationErrors.filter((e) => e.severity === 'warning').length;

  return (
    <div className={containerStyles}>
      <div className={headerStyles}>
        <h4 className={titleStyles}>
          Data Preview
          <HelpTooltip
            content="Review your data before uploading. You can expand/collapse files and see validation errors."
            placement="right"
          />
        </h4>
        <div className={statsStyles}>
          <span className={statStyles}>
            <Icon name="file-alt" /> {data.length} file{data.length !== 1 ? 's' : ''}
          </span>
          <span className={statStyles}>
            <Icon name="list-ul" /> {totalRows} row{totalRows !== 1 ? 's' : ''}
          </span>
          {totalErrors > 0 && (
            <span className={statErrorStyles}>
              <Icon name="exclamation-triangle" /> {totalErrors} error{totalErrors !== 1 ? 's' : ''}
            </span>
          )}
          {totalWarnings > 0 && (
            <span className={statWarningStyles}>
              <Icon name="info-circle" /> {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {data.map((fileData, fileIndex) => {
        const isExpanded = expandedFiles.has(fileIndex);
        const displayRows = fileData.rows.slice(0, maxRows);
        const hasMore = fileData.rows.length > maxRows;

        return (
          <div key={fileIndex} className={fileContainerStyles}>
            <div className={fileHeaderStyles} onClick={() => toggleFile(fileIndex)}>
              <Icon name={isExpanded ? 'angle-down' : 'angle-right'} />
              <Icon name="file-alt" />
              <span className={fileNameStyles}>{fileData.fileName}</span>
              <span className={fileStatsStyles}>
                ({fileData.rowCount} row{fileData.rowCount !== 1 ? 's' : ''}, {fileData.headers.length} column
                {fileData.headers.length !== 1 ? 's' : ''})
              </span>
            </div>

            {isExpanded && (
              <div className={fileContentStyles}>
                <div className={tableWrapperStyles}>
                  <table className={tableStyles}>
                    <thead>
                      <tr>
                        <th className={rowNumberHeaderStyles}>#</th>
                        {fileData.headers.map((header, idx) => (
                          <th key={idx} className={headerCellStyles}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row, rowIndex) => {
                        const rowErrors = errorsByRow.get(`${rowIndex + 1}`) || [];
                        const hasError = rowErrors.some((e) => e.severity === 'error');
                        const hasWarning = rowErrors.some((e) => e.severity === 'warning');

                        return (
                          <tr
                            key={rowIndex}
                            className={rowStyles(hasError, hasWarning)}
                            title={
                              rowErrors.length > 0
                                ? rowErrors.map((e) => `${e.field}: ${e.message}`).join('\n')
                                : undefined
                            }
                          >
                            <td className={rowNumberCellStyles}>{rowIndex + 1}</td>
                            {fileData.headers.map((header, colIndex) => {
                              const value = row[header] || '';
                              const fieldError = rowErrors.find((e) => e.field === header);

                              return (
                                <td
                                  key={colIndex}
                                  className={dataCellStyles(!!fieldError)}
                                  title={fieldError?.message}
                                >
                                  {value}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {hasMore && (
                  <Alert severity="info" title="Preview Limited">
                    Showing first {maxRows} rows of {fileData.rowCount}. All rows will be processed during upload.
                  </Alert>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const containerStyles = css`
  border: 1px solid #333;
  border-radius: 4px;
  background-color: #1a1e23;
`;

const headerStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
`;

const titleStyles = css`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const statsStyles = css`
  display: flex;
  gap: 16px;
  font-size: 13px;
`;

const statStyles = css`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
`;

const statErrorStyles = css`
  ${statStyles};
  color: #f55;
`;

const statWarningStyles = css`
  ${statStyles};
  color: #fa8c16;
`;

const fileContainerStyles = css`
  border-bottom: 1px solid #2a2e33;

  &:last-child {
    border-bottom: none;
  }
`;

const fileHeaderStyles = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #252a31;
  }
`;

const fileNameStyles = css`
  font-weight: 500;
  color: #d8d9da;
`;

const fileStatsStyles = css`
  color: #999;
  font-size: 13px;
`;

const fileContentStyles = css`
  padding: 0 16px 16px 16px;
`;

const tableWrapperStyles = css`
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #333;
  border-radius: 4px;
  margin-bottom: 12px;
`;

const tableStyles = css`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid #2a2e33;
  }

  thead {
    position: sticky;
    top: 0;
    background-color: #1f2429;
    z-index: 1;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const rowNumberHeaderStyles = css`
  width: 50px;
  text-align: center !important;
  color: #999;
  font-weight: 600;
`;

const headerCellStyles = css`
  font-weight: 600;
  color: #d8d9da;
  white-space: nowrap;
`;

const rowNumberCellStyles = css`
  text-align: center !important;
  color: #666;
  font-weight: 500;
  background-color: #1a1e23;
`;

const rowStyles = (hasError: boolean, hasWarning: boolean) => css`
  background-color: ${hasError ? 'rgba(245, 34, 45, 0.1)' : hasWarning ? 'rgba(250, 140, 22, 0.1)' : 'transparent'};

  &:hover {
    background-color: ${hasError
      ? 'rgba(245, 34, 45, 0.15)'
      : hasWarning
      ? 'rgba(250, 140, 22, 0.15)'
      : '#252a31'};
  }
`;

const dataCellStyles = (hasError: boolean) => css`
  color: ${hasError ? '#ff7875' : '#d8d9da'};
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

