import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import { selectors } from '@grafana/e2e-selectors';
import { Trans, t } from '@grafana/i18n';
import { SceneObject } from '@grafana/scenes';
import { Button, Field, Modal, Input, Alert, TextLink } from '@grafana/ui';
import { RepeatRowSelect2 } from 'app/features/dashboard/components/RepeatRowSelect/RepeatRowSelect';
import { SHARED_DASHBOARD_QUERY } from 'app/plugins/datasource/dashboard/constants';

export type OnRowOptionsUpdate = (title: string, repeat?: string | null, collapsedIcon?: string, rowGroup?: string) => void;

export interface Props {
  title: string;
  repeat?: string;
  collapsedIcon?: string;
  rowGroup?: string;
  sceneContext: SceneObject;
  onUpdate: OnRowOptionsUpdate;
  onCancel: () => void;
  isUsingDashboardDS: boolean;
}

export const RowOptionsForm = ({ repeat, title, collapsedIcon, rowGroup, sceneContext, isUsingDashboardDS, onUpdate, onCancel }: Props) => {
  const [newRepeat, setNewRepeat] = useState<string | undefined>(repeat);
  const [newCollapsedIcon, setNewCollapsedIcon] = useState<string | undefined>(collapsedIcon);
  const [newRowGroup, setNewRowGroup] = useState<string | undefined>(rowGroup);
  const onChangeRepeat = useCallback((name?: string) => setNewRepeat(name), [setNewRepeat]);

  const { handleSubmit, register } = useForm({
    defaultValues: { title },
  });

  const submit = (formData: { title: string }) => {
    onUpdate(formData.title, newRepeat, newCollapsedIcon, newRowGroup);
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <Field label={t('dashboard.default-layout.row-options.form.title', 'Title')}>
        <Input {...register('title')} type="text" />
      </Field>
      <Field 
        label={t('dashboard.default-layout.row-options.form.collapsed-icon.label', 'Collapsed icon')}
        description={t('dashboard.default-layout.row-options.form.collapsed-icon.description', 'Image path shown when row is collapsed (e.g., /img/icon.png)')}
      >
        <Input 
          value={newCollapsedIcon || ''} 
          onChange={(e) => setNewCollapsedIcon(e.currentTarget.value || undefined)}
          placeholder="/img/icon.png"
          type="text"
        />
      </Field>
      {newCollapsedIcon && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#8e8e8e' }}>Preview:</span>
          <img 
            src={newCollapsedIcon} 
            alt="Preview" 
            style={{ maxWidth: '32px', maxHeight: '32px', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <Field 
        label={t('dashboard.default-layout.row-options.form.row-group.label', 'Row group')}
        description={t('dashboard.default-layout.row-options.form.row-group.description', 'Group name for side-by-side display when collapsed (e.g., primary_station)')}
      >
        <Input 
          value={newRowGroup || ''} 
          onChange={(e) => setNewRowGroup(e.currentTarget.value || undefined)}
          placeholder="primary_station"
          type="text"
        />
      </Field>
      <Field label={t('dashboard.default-layout.row-options.form.repeat-for.label', 'Repeat for')}>
        <RepeatRowSelect2 sceneContext={sceneContext} repeat={newRepeat} onChange={onChangeRepeat} />
      </Field>
      {isUsingDashboardDS && (
        <Alert
          data-testid={selectors.pages.Dashboard.Rows.Repeated.ConfigSection.warningMessage}
          severity="warning"
          title=""
          topSpacing={3}
          bottomSpacing={0}
        >
          <div>
            <p>
              <Trans i18nKey="dashboard.default-layout.row-options.form.repeat-for.warning.text">
                Panels in this row use the {{ SHARED_DASHBOARD_QUERY }} data source. These panels will reference the
                panel in the original row, not the ones in the repeated rows.
              </Trans>
            </p>
            <TextLink
              external
              href={
                'https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/create-dashboard/#configure-repeating-rows'
              }
            >
              <Trans i18nKey="dashboard.default-layout.row-options.form.repeat-for.learn-more">Learn more</Trans>
            </TextLink>
          </div>
        </Alert>
      )}
      <Modal.ButtonRow>
        <Button type="button" variant="secondary" onClick={onCancel} fill="outline">
          <Trans i18nKey="dashboard.default-layout.row-options.form.cancel">Cancel</Trans>
        </Button>
        <Button type="submit">
          <Trans i18nKey="dashboard.default-layout.row-options.form.update">Update</Trans>
        </Button>
      </Modal.ButtonRow>
    </form>
  );
};
