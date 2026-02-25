import { t } from '@grafana/i18n';
import { SceneObject } from '@grafana/scenes';
import { Icon, ModalsController } from '@grafana/ui';

import { OnRowOptionsUpdate } from './RowOptionsForm';
import { RowOptionsModal } from './RowOptionsModal';

export interface RowOptionsButtonProps {
  title: string;
  repeat?: string;
  collapsedIcon?: string;
  rowGroup?: string;
  parent: SceneObject;
  onUpdate: OnRowOptionsUpdate;
  isUsingDashboardDS: boolean;
}

export const RowOptionsButton = ({ repeat, title, collapsedIcon, rowGroup, parent, onUpdate, isUsingDashboardDS }: RowOptionsButtonProps) => {
  return (
    <ModalsController>
      {({ showModal, hideModal }) => {
        return (
          <button
            type="button"
            className="pointer"
            aria-label={t('dashboard.default-layout.row-options.button.label', 'Row options')}
            onClick={() => {
              showModal(RowOptionsModal, {
                title,
                repeat,
                collapsedIcon,
                rowGroup,
                parent,
                onDismiss: hideModal,
                onUpdate: (title: string, repeat?: string | null, collapsedIcon?: string, rowGroup?: string) => {
                  onUpdate(title, repeat, collapsedIcon, rowGroup);
                  hideModal();
                },
                isUsingDashboardDS,
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
