import * as React from 'react';

import { t } from '@grafana/i18n';
import { Icon, ModalsController } from '@grafana/ui';

import { OnRowOptionsUpdate } from './RowOptionsForm';
import { RowOptionsModal } from './RowOptionsModal';

export interface RowOptionsButtonProps {
  title: string;
  repeat?: string;
  collapsedIcon?: string;
  rowGroup?: string;
  onUpdate: OnRowOptionsUpdate;
  warning?: React.ReactNode;
}

export const RowOptionsButton = ({ repeat, title, collapsedIcon, rowGroup, onUpdate, warning }: RowOptionsButtonProps) => {
  const onUpdateChange = (hideModal: () => void) => (title: string, repeat?: string | null, collapsedIcon?: string, rowGroup?: string) => {
    onUpdate(title, repeat, collapsedIcon, rowGroup);
    hideModal();
  };

  return (
    <ModalsController>
      {({ showModal, hideModal }) => {
        return (
          <button
            type="button"
            className="pointer"
            aria-label={t('dashboard.row-options-button.aria-label-row-options', 'Row options')}
            onClick={() => {
              showModal(RowOptionsModal, {
                title,
                repeat,
                collapsedIcon,
                rowGroup,
                onDismiss: hideModal,
                onUpdate: onUpdateChange(hideModal),
                warning,
              });
            }}
          >
            <Icon name="cog" />
          </button>
        );
      }}
    </ModalsController>
  );
};

RowOptionsButton.displayName = 'RowOptionsButton';
