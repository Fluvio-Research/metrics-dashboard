import { css } from '@emotion/css';
import { useEffect, useState, useMemo, useCallback } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { SceneGridRow } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';

interface GroupedRowsManagerProps {
  rows: SceneGridRow[];
}

interface RowGroup {
  groupName: string;
  rows: SceneGridRow[];
  allCollapsed: boolean;
}

/**
 * GroupedRowsManager handles the side-by-side display of collapsed rows
 * that share the same rowGroup tag.
 * 
 * When multiple rows with the same group are all collapsed, their icons
 * are displayed horizontally in the first row, and other rows are hidden.
 */
export function GroupedRowsManager({ rows }: GroupedRowsManagerProps) {
  const styles = useStyles2(getStyles);
  const [updateCount, setUpdateCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Subscribe to all row state changes to trigger re-renders
  useEffect(() => {
    const subscriptions = rows.map(row => {
      return row.subscribeToState(() => {
        setUpdateCount(n => n + 1);
      });
    });

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [rows]);

  // Wait for DOM to be ready on initial load
  useEffect(() => {
    // Initial delay to ensure DOM is rendered
    const initialTimer = setTimeout(() => {
      setIsReady(true);
      setUpdateCount(n => n + 1);
    }, 100);

    // Also trigger on window load
    const handleLoad = () => {
      setUpdateCount(n => n + 1);
    };
    window.addEventListener('load', handleLoad);

    // Trigger periodically for the first few seconds to catch late renders
    const intervals = [500, 1000, 2000].map(delay => 
      setTimeout(() => setUpdateCount(n => n + 1), delay)
    );

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('load', handleLoad);
      intervals.forEach(clearTimeout);
    };
  }, []);

  // Group rows by rowGroup and check collapse state
  const groups = useMemo<RowGroup[]>(() => {
    const groupMap: Record<string, SceneGridRow[]> = {};
    
    rows.forEach(row => {
      const rowGroup = (row.state as any).rowGroup as string | undefined;
      if (rowGroup) {
        if (!groupMap[rowGroup]) {
          groupMap[rowGroup] = [];
        }
        groupMap[rowGroup].push(row);
      }
    });

    return Object.entries(groupMap)
      .filter(([_, groupRows]) => groupRows.length >= 2)
      .map(([groupName, groupRows]) => ({
        groupName,
        rows: groupRows,
        allCollapsed: groupRows.every(row => row.state.isCollapsed),
      }));
  }, [rows, updateCount]);

  // Apply DOM changes for grouped rows
  const applyGrouping = useCallback(() => {
    if (!isReady) return;

    // Clean up previous state first
    document.querySelectorAll('[data-grouped-row]').forEach(el => {
      (el as HTMLElement).style.display = '';
      el.removeAttribute('data-grouped-row');
    });
    document.querySelectorAll('.grouped-icons-container').forEach(el => el.remove());
    document.querySelectorAll('[data-title-hidden-by-group]').forEach(el => {
      (el as HTMLElement).style.display = '';
      el.removeAttribute('data-title-hidden-by-group');
    });

    groups.forEach(group => {
      if (!group.allCollapsed) return;

      // Find DOM elements for each row in the group
      const rowElements: { row: SceneGridRow; gridItem: HTMLElement; button: HTMLElement }[] = [];
      
      group.rows.forEach(row => {
        const testId = `data-testid dashboard-row-title-${row.state.title || ''}`;
        const button = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
        const gridItem = button?.closest('.react-grid-item') as HTMLElement;
        
        if (button && gridItem) {
          rowElements.push({ row, gridItem, button });
        }
      });

      if (rowElements.length < 2) return;

      // Hide all rows except the first one
      rowElements.forEach((item, idx) => {
        if (idx > 0) {
          item.gridItem.style.display = 'none';
          item.gridItem.setAttribute('data-grouped-row', group.groupName);
        }
      });

      // In the first row, hide the title and add grouped icons
      const firstRow = rowElements[0];
      const titleSpan = firstRow.button.querySelector('[role="heading"]') as HTMLElement;
      
      if (titleSpan) {
        titleSpan.style.display = 'none';
        titleSpan.setAttribute('data-title-hidden-by-group', 'true');
      }

      // Remove any existing grouped icons container
      const existingContainer = firstRow.button.querySelector('.grouped-icons-container');
      if (existingContainer) {
        existingContainer.remove();
      }

      // Create container for grouped icons
      const iconsContainer = document.createElement('div');
      iconsContainer.className = 'grouped-icons-container';
      iconsContainer.style.cssText = `
        display: inline-flex !important;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 32px;
        margin-left: 8px;
      `;

      // Add icons for all rows in the group
      group.rows.forEach((row) => {
        const collapsedIcon = (row.state as any).collapsedIcon as string | undefined;
        const title = row.state.title || 'Row';

        const iconWrapper = document.createElement('div');
        iconWrapper.style.cssText = `
          display: flex !important;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 4px;
          min-width: 70px;
          transition: background-color 0.2s ease;
        `;
        iconWrapper.title = title;
        iconWrapper.onmouseenter = () => {
          iconWrapper.style.backgroundColor = 'rgba(204, 204, 220, 0.12)';
        };
        iconWrapper.onmouseleave = () => {
          iconWrapper.style.backgroundColor = 'transparent';
        };
        iconWrapper.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          row.onCollapseToggle();
        };

        if (collapsedIcon) {
          const img = document.createElement('img');
          img.src = collapsedIcon;
          img.alt = title;
          img.style.cssText = `
            width: 40px !important;
            height: 40px !important;
            object-fit: contain;
            display: block !important;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          `;
          iconWrapper.appendChild(img);

          // Add label below icon
          const label = document.createElement('span');
          label.style.cssText = `
            font-size: 11px !important;
            color: inherit !important;
            margin-top: 4px !important;
            text-align: center;
            white-space: nowrap;
            display: block !important;
            opacity: 0.85;
          `;
          label.textContent = title;
          iconWrapper.appendChild(label);
        } else {
          const textSpan = document.createElement('span');
          textSpan.style.cssText = `
            font-size: 14px !important;
            color: inherit !important;
            white-space: nowrap;
          `;
          textSpan.textContent = title;
          iconWrapper.appendChild(textSpan);
        }

        iconsContainer.appendChild(iconWrapper);
      });

      // Insert icons container into the button
      const svgIcon = firstRow.button.querySelector('svg');
      if (svgIcon) {
        svgIcon.insertAdjacentElement('afterend', iconsContainer);
      } else {
        firstRow.button.appendChild(iconsContainer);
      }
    });
  }, [groups, isReady, styles]);

  // Run applyGrouping when dependencies change
  useEffect(() => {
    applyGrouping();

    return () => {
      // Cleanup on unmount
      document.querySelectorAll('[data-grouped-row]').forEach(el => {
        (el as HTMLElement).style.display = '';
        el.removeAttribute('data-grouped-row');
      });
      document.querySelectorAll('.grouped-icons-container').forEach(el => el.remove());
      document.querySelectorAll('[data-title-hidden-by-group]').forEach(el => {
        (el as HTMLElement).style.display = '';
        el.removeAttribute('data-title-hidden-by-group');
      });
    };
  }, [applyGrouping]);

  // Use MutationObserver to detect when rows are added/changed
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Debounce the update
      setTimeout(() => setUpdateCount(n => n + 1), 50);
    });

    const gridContainer = document.querySelector('.react-grid-layout');
    if (gridContainer) {
      observer.observe(gridContainer, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    return () => observer.disconnect();
  }, [isReady]);

  return null;
}

const getStyles = (theme: GrafanaTheme2) => ({
  // Keeping these for reference but using inline styles for reliability
  iconsContainer: css({
    display: 'inline-flex !important',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(4),
    marginLeft: theme.spacing(1),
  }),
});
