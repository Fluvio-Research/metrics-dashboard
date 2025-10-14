import { cx } from '@emotion/css';
import * as React from 'react';

import { isUrl } from './utils';

const renderSingle = (value: string) => {
  if (isUrl(value)) {
    return (
      <a href={value} target={'_blank'} className={cx('external-link')} rel="noreferrer">
        {value}
      </a>
    );
  }
  return value;
};

export const renderValue = (value: string): React.ReactNode => {
  if (value.includes('\n')) {
    const parts = value.split(/\r?\n/);
    return (
      <>
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            {renderSingle(part)}
            {idx < parts.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  }

  return renderSingle(value);
};
