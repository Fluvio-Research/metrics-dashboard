import React from 'react';
import { css } from '@emotion/css';
import { UploadProgress } from '../../types';

interface ProgressBarProps {
  progress: UploadProgress;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const failedPercentage = progress.total > 0 ? (progress.failed / progress.total) * 100 : 0;

  return (
    <div className={containerStyles}>
      <div className={headerStyles}>
        <span>
          {progress.completed} / {progress.total} completed
          {progress.failed > 0 && <span className={failedTextStyles}> ({progress.failed} failed)</span>}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>
      
      <div className={barContainerStyles}>
        <div className={barBackgroundStyles}>
          <div
            className={barSuccessStyles}
            style={{ width: `${percentage - failedPercentage}%` }}
          />
          {failedPercentage > 0 && (
            <div
              className={barFailedStyles}
              style={{ width: `${failedPercentage}%` }}
            />
          )}
        </div>
      </div>

      {progress.inProgress && (
        <div className={statusStyles}>
          <div className={spinnerStyles} />
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};

const containerStyles = css`
  margin: 16px 0;
`;

const headerStyles = css`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #d8d9da;
`;

const failedTextStyles = css`
  color: #f55;
`;

const barContainerStyles = css`
  width: 100%;
  margin-bottom: 8px;
`;

const barBackgroundStyles = css`
  width: 100%;
  height: 24px;
  background-color: #2a2e33;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
`;

const barSuccessStyles = css`
  height: 100%;
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
  transition: width 0.3s ease;
`;

const barFailedStyles = css`
  height: 100%;
  background: linear-gradient(90deg, #f5222d 0%, #ff4d4f 100%);
  transition: width 0.3s ease;
`;

const statusStyles = css`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #999;
`;

const spinnerStyles = css`
  width: 12px;
  height: 12px;
  border: 2px solid #333;
  border-top-color: #6e9fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

