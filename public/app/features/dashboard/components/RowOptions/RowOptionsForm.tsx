import { useCallback, useState } from 'react';
import * as React from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Trans, t } from '@grafana/i18n';
import { Button, Field, Modal, Input, Alert } from '@grafana/ui';
import { Form } from 'app/core/components/Form/Form';

import { RepeatRowSelect } from '../RepeatRowSelect/RepeatRowSelect';

export type OnRowOptionsUpdate = (title: string, repeat?: string | null, collapsedIcon?: string, rowGroup?: string) => void;

export interface Props {
  title: string;
  repeat?: string;
  collapsedIcon?: string;
  rowGroup?: string;
  onUpdate: OnRowOptionsUpdate;
  onCancel: () => void;
  warning?: React.ReactNode;
}

export const RowOptionsForm = ({ repeat, title, collapsedIcon, rowGroup, warning, onUpdate, onCancel }: Props) => {
  const [newRepeat, setNewRepeat] = useState<string | undefined>(repeat);
  const [newCollapsedIcon, setNewCollapsedIcon] = useState<string | undefined>(collapsedIcon);
  const [newRowGroup, setNewRowGroup] = useState<string | undefined>(rowGroup);

  const onChangeRepeat = useCallback((name?: string) => setNewRepeat(name), [setNewRepeat]);

  return (
    <Form
      defaultValues={{ title }}
      onSubmit={(formData: { title: string }) => {
        onUpdate(formData.title, newRepeat, newCollapsedIcon, newRowGroup);
      }}
    >
      {({ register }) => (
        <>
          <Field label={t('dashboard.row-options-form.label-title', 'Title')}>
            <Input {...register('title')} type="text" />
          </Field>
          <Field 
            label={t('dashboard.row-options-form.label-collapsed-icon', 'Collapsed icon (image path)')}
            description={t('dashboard.row-options-form.description-collapsed-icon', 'Path to icon/image shown when row is collapsed (e.g., /img/icon.png)')}
          >
            <Input 
              value={newCollapsedIcon || ''} 
              onChange={(e) => setNewCollapsedIcon(e.currentTarget.value || undefined)}
              placeholder="/img/icon.png"
              type="text"
            />
          </Field>
          {newCollapsedIcon && (
            <div style={{ marginTop: '8px', marginBottom: '16px' }}>
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
            label={t('dashboard.row-options-form.label-row-group', 'Row group')}
            description={t('dashboard.row-options-form.description-row-group', 'Group name for side-by-side display when collapsed (e.g., primary_station)')}
          >
            <Input 
              value={newRowGroup || ''} 
              onChange={(e) => setNewRowGroup(e.currentTarget.value || undefined)}
              placeholder="primary_station"
              type="text"
            />
          </Field>
          <Field label={t('dashboard.row-options-form.label-repeat-for', 'Repeat for')}>
            <RepeatRowSelect repeat={newRepeat} onChange={onChangeRepeat} />
          </Field>
          {warning && (
            <Alert
              data-testid={selectors.pages.Dashboard.Rows.Repeated.ConfigSection.warningMessage}
              severity="warning"
              title=""
              topSpacing={3}
              bottomSpacing={0}
            >
              {warning}
            </Alert>
          )}
          <Modal.ButtonRow>
            <Button type="button" variant="secondary" onClick={onCancel} fill="outline">
              <Trans i18nKey="dashboard.row-options-form.cancel">Cancel</Trans>
            </Button>
            <Button type="submit">
              <Trans i18nKey="dashboard.row-options-form.update">Update</Trans>
            </Button>
          </Modal.ButtonRow>
        </>
      )}
    </Form>
  );
};
