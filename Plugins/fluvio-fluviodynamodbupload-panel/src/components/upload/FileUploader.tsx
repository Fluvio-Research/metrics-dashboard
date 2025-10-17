import React, { useCallback, useState } from 'react';
import { Alert, Button, Icon, InlineField, Input, Select } from '@grafana/ui';
import { css } from '@emotion/css';
import { ParsedFileData } from '../../types';
import { FileParser } from '../../utils/fileParser';
import { HelpTooltip } from '../shared/HelpTooltip';

interface FileUploaderProps {
  onFilesParsed: (data: ParsedFileData[]) => void;
  onError: (error: string) => void;
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesParsed, onError, multiple = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [delimiter, setDelimiter] = useState(',');
  const [customPattern, setCustomPattern] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    },
    [delimiter, customPattern]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      await processFiles(files);
      e.target.value = ''; // Reset input
    },
    [delimiter, customPattern]
  );

  const processFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setIsProcessing(true);
    const parsedData: ParsedFileData[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const data = await FileParser.parseFile(file, {
          delimiter,
          pattern: customPattern || undefined,
        });
        parsedData.push(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse file';
        errors.push(`${file.name}: ${message}`);
      }
    }

    setIsProcessing(false);

    if (errors.length > 0) {
      onError(errors.join('\n'));
    }

    if (parsedData.length > 0) {
      onFilesParsed(parsedData);
    }
  };

  const delimiterOptions = [
    { label: 'Comma (,)', value: ',' },
    { label: 'Tab', value: '\t' },
    { label: 'Semicolon (;)', value: ';' },
    { label: 'Pipe (|)', value: '|' },
  ];

  return (
    <div className={containerStyles}>
      <div className={optionsStyles}>
        <InlineField label="CSV Delimiter" labelWidth={14}>
          <Select
            options={delimiterOptions}
            value={delimiter}
            onChange={(option) => setDelimiter(option.value!)}
            width={20}
          />
        </InlineField>

        <InlineField
          label={
            <>
              Text Pattern (Regex)
              <HelpTooltip content="Optional regex pattern for parsing text files. Use capture groups to extract fields." />
            </>
          }
          labelWidth={20}
          grow
        >
          <Input
            value={customPattern}
            onChange={(e) => setCustomPattern(e.currentTarget.value)}
            placeholder="e.g., (\w+)\s+(\d+)"
          />
        </InlineField>
      </div>

      <div
        className={dropZoneStyles(isDragging)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Icon name="upload" size="xxxl" className={iconStyles} />
        
        <div className={textStyles}>
          <div className={titleStyles}>
            {isDragging ? 'Drop files here' : 'Drag and drop files here'}
          </div>
          <div className={subtitleStyles}>
            Supported formats: CSV, TSV, JSON, TXT
          </div>
        </div>

        <div className={orStyles}>or</div>

        <label className={buttonLabelStyles}>
          <input
            type="file"
            className={fileInputStyles}
            onChange={handleFileSelect}
            multiple={multiple}
            accept=".csv,.tsv,.json,.txt"
            disabled={isProcessing}
          />
          <Button
            icon="upload"
            variant="secondary"
            disabled={isProcessing}
            onClick={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.previousSibling as HTMLInputElement);
              input?.click();
            }}
          >
            {isProcessing ? 'Processing...' : 'Browse Files'}
          </Button>
        </label>
      </div>

      <Alert severity="info" title="Upload Tips">
        <ul className={tipsStyles}>
          <li><strong>CSV/TSV:</strong> First row should contain column headers</li>
          <li><strong>JSON:</strong> Must be an object or array of objects</li>
          <li><strong>Text:</strong> Use regex pattern to extract structured data from lines</li>
          <li><strong>Multiple files:</strong> All files will be processed in sequence</li>
        </ul>
      </Alert>
    </div>
  );
};

const containerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const optionsStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const dropZoneStyles = (isDragging: boolean) => css`
  border: 2px dashed ${isDragging ? '#6e9fff' : '#555'};
  border-radius: 8px;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background-color: ${isDragging ? 'rgba(110, 159, 255, 0.1)' : 'transparent'};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #6e9fff;
    background-color: rgba(110, 159, 255, 0.05);
  }
`;

const iconStyles = css`
  color: #999;
`;

const textStyles = css`
  text-align: center;
`;

const titleStyles = css`
  font-size: 16px;
  font-weight: 500;
  color: #d8d9da;
  margin-bottom: 4px;
`;

const subtitleStyles = css`
  font-size: 13px;
  color: #999;
`;

const orStyles = css`
  color: #666;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const buttonLabelStyles = css`
  position: relative;
`;

const fileInputStyles = css`
  display: none;
`;

const tipsStyles = css`
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 13px;
  
  li {
    margin-bottom: 4px;
  }
`;

