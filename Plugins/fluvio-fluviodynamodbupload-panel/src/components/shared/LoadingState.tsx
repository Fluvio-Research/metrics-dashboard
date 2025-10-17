import React from 'react';
import { Spinner } from '@grafana/ui';
import { css } from '@emotion/css';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...', size = 'md' }) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <div className={containerStyles}>
      <Spinner size={sizeMap[size]} />
      {message && <div className={messageStyles}>{message}</div>}
    </div>
  );
};

const containerStyles = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 12px;
`;

const messageStyles = css`
  color: #999;
  font-size: 14px;
`;

