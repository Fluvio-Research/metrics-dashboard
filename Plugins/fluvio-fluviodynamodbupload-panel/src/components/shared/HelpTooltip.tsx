import React from 'react';
import { Icon, Tooltip } from '@grafana/ui';
import { css } from '@emotion/css';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ content, title, placement = 'top' }) => {
  const tooltipContent = (
    <div className={tooltipStyles}>
      {title && <div className={tooltipTitleStyles}>{title}</div>}
      <div>{content}</div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} placement={placement}>
      <Icon name="info-circle" className={iconStyles} />
    </Tooltip>
  );
};

const iconStyles = css`
  margin-left: 4px;
  cursor: help;
  color: #6e9fff;
  
  &:hover {
    color: #3d71ff;
  }
`;

const tooltipStyles = css`
  max-width: 300px;
`;

const tooltipTitleStyles = css`
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
`;

