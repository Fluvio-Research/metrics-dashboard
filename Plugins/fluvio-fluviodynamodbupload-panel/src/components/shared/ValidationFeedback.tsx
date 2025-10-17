import React from 'react';
import { Alert } from '@grafana/ui';
import { css } from '@emotion/css';
import { ValidationError } from '../../types';

interface ValidationFeedbackProps {
  errors: ValidationError[];
  maxDisplay?: number;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ errors, maxDisplay = 10 }) => {
  if (errors.length === 0) {
    return null;
  }

  const errorsByType = {
    error: errors.filter(e => e.severity === 'error'),
    warning: errors.filter(e => e.severity === 'warning'),
  };

  const displayErrors = errorsByType.error.slice(0, maxDisplay);
  const displayWarnings = errorsByType.warning.slice(0, maxDisplay);
  const remainingErrors = errorsByType.error.length - displayErrors.length;
  const remainingWarnings = errorsByType.warning.length - displayWarnings.length;

  return (
    <div className={containerStyles}>
      {displayErrors.length > 0 && (
        <Alert severity="error" title={`Validation Errors (${errorsByType.error.length})`}>
          <ul className={listStyles}>
            {displayErrors.map((error, idx) => (
              <li key={idx}>
                <strong>{error.field}</strong>
                {error.row !== undefined && <span> (Row {error.row})</span>}: {error.message}
              </li>
            ))}
          </ul>
          {remainingErrors > 0 && (
            <div className={moreStyles}>+ {remainingErrors} more error(s)</div>
          )}
        </Alert>
      )}

      {displayWarnings.length > 0 && (
        <Alert severity="warning" title={`Warnings (${errorsByType.warning.length})`}>
          <ul className={listStyles}>
            {displayWarnings.map((warning, idx) => (
              <li key={idx}>
                <strong>{warning.field}</strong>
                {warning.row !== undefined && <span> (Row {warning.row})</span>}: {warning.message}
              </li>
            ))}
          </ul>
          {remainingWarnings > 0 && (
            <div className={moreStyles}>+ {remainingWarnings} more warning(s)</div>
          )}
        </Alert>
      )}
    </div>
  );
};

const containerStyles = css`
  margin-top: 12px;
  
  & > * + * {
    margin-top: 8px;
  }
`;

const listStyles = css`
  margin: 8px 0 0 0;
  padding-left: 20px;
  
  li {
    margin-bottom: 4px;
  }
`;

const moreStyles = css`
  margin-top: 8px;
  font-style: italic;
  color: #999;
`;

