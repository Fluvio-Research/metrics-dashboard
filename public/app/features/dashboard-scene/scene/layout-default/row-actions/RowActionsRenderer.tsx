import { css } from '@emotion/css';
import { useEffect, useMemo } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { SceneComponentProps, VizPanel } from '@grafana/scenes';
import { Icon, useStyles2 } from '@grafana/ui';
import { SHARED_DASHBOARD_QUERY } from 'app/plugins/datasource/dashboard/constants';
import { MIXED_DATASOURCE_NAME } from 'app/plugins/datasource/mixed/MixedDataSource';

import { getQueryRunnerFor, useDashboard, useDashboardState } from '../../../utils/utils';
import { DashboardGridItem } from '../DashboardGridItem';
import { RowRepeaterBehavior } from '../RowRepeaterBehavior';

import { RowActions } from './RowActions';
import { RowOptionsButton } from './RowOptionsButton';

export function RowActionsRenderer({ model }: SceneComponentProps<RowActions>) {
  const row = model.getParent();
  const rowState = row.useState();
  const { title, children, isCollapsed } = rowState;
  // Get collapsedIcon and rowGroup from row state (custom properties)
  const collapsedIcon = (rowState as any).collapsedIcon as string | undefined;
  const rowGroup = (rowState as any).rowGroup as string | undefined;
  const dashboard = useDashboard(model);
  const { meta, isEditing } = useDashboardState(model);
  const styles = useStyles2(getStyles);

  // Use DOM manipulation to show/hide collapsed icon (only for non-grouped rows)
  useEffect(() => {
    // Skip if row has a rowGroup - GroupedRowsManager handles those
    if (rowGroup) return;

    // Find the row element by data-testid which contains the title
    const testId = `data-testid dashboard-row-title-${title || ''}`;
    const rowButton = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
    if (!rowButton) return;

    // The button contains the title span with role="heading"
    const titleElement = rowButton.querySelector('[role="heading"]') as HTMLElement;
    
    // Check for existing icon container
    let iconContainer = rowButton.querySelector('.collapsed-icon-container') as HTMLElement;

    if (isCollapsed && collapsedIcon) {
      // Hide title, show icon
      if (titleElement) {
        titleElement.style.display = 'none';
      }
      
      // Create icon container if it doesn't exist
      if (!iconContainer) {
        iconContainer = document.createElement('div');
        iconContainer.className = 'collapsed-icon-container';
        iconContainer.style.cssText = 'display: inline-flex; align-items: center; margin-left: 4px;';
        
        const img = document.createElement('img');
        img.src = collapsedIcon;
        img.alt = title || 'Row';
        img.style.cssText = 'max-width: 24px; max-height: 24px; object-fit: contain;';
        iconContainer.appendChild(img);
        
        // Insert icon container after the chevron icon (first child is Icon)
        if (titleElement) {
          titleElement.parentNode?.insertBefore(iconContainer, titleElement);
        } else {
          rowButton.appendChild(iconContainer);
        }
      } else {
        // Update existing icon
        const img = iconContainer.querySelector('img');
        if (img) {
          img.src = collapsedIcon;
          img.alt = title || 'Row';
        }
        iconContainer.style.display = 'inline-flex';
      }
    } else {
      // Show title, hide icon
      if (titleElement) {
        titleElement.style.display = '';
      }
      if (iconContainer) {
        iconContainer.style.display = 'none';
      }
    }

    return () => {
      // Cleanup: restore title visibility
      if (titleElement) {
        titleElement.style.display = '';
      }
      if (iconContainer) {
        iconContainer.remove();
      }
    };
  }, [isCollapsed, collapsedIcon, rowGroup, title]);

  const isUsingDashboardDS = useMemo(
    () =>
      children.some((gridItem) => {
        if (!(gridItem instanceof DashboardGridItem)) {
          return false;
        }

        if (gridItem.state.body instanceof VizPanel) {
          const runner = getQueryRunnerFor(gridItem.state.body);
          return (
            runner?.state.datasource?.uid === SHARED_DASHBOARD_QUERY ||
            (runner?.state.datasource?.uid === MIXED_DATASOURCE_NAME &&
              runner?.state.queries.some((query) => query.datasource?.uid === SHARED_DASHBOARD_QUERY))
          );
        }

        return false;
      }),
    [children]
  );

  const behaviour = row.state.$behaviors?.find((b) => b instanceof RowRepeaterBehavior);

  return (
    <>
      {meta.canEdit && isEditing && (
        <>
          <div className={styles.rowActions}>
            <RowOptionsButton
              title={title}
              repeat={behaviour instanceof RowRepeaterBehavior ? behaviour.state.variableName : undefined}
              collapsedIcon={collapsedIcon}
              rowGroup={rowGroup}
              parent={dashboard}
              onUpdate={(title, repeat, collapsedIcon, rowGroup) => model.onUpdate(title, repeat, collapsedIcon, rowGroup)}
              isUsingDashboardDS={isUsingDashboardDS}
            />
            <button
              type="button"
              onClick={() => model.onDelete()}
              aria-label={t('dashboard.default-layout.row-actions.delete', 'Delete row')}
            >
              <Icon name="trash-alt" />
            </button>
          </div>
        </>
      )}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    rowActions: css({
      color: theme.colors.text.secondary,
      lineHeight: '27px',

      button: {
        color: theme.colors.text.secondary,
        paddingLeft: theme.spacing(2),
        background: 'transparent',
        border: 'none',

        '&:hover': {
          color: theme.colors.text.maxContrast,
        },
      },
    }),
  };
};
