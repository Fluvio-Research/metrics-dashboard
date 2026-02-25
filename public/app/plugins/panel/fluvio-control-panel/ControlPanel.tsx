import { useMemo } from 'react';

import { PanelProps } from '@grafana/data';
import { useStyles2, Icon } from '@grafana/ui';

import { TimePickerSection } from './components/TimePickerSection';
import { VariableFiltersSection } from './components/VariableFiltersSection';
import { Options, DisplayMode } from './panelcfg.gen';
import { getStyles } from './styles';

export interface Props extends PanelProps<Options> {}

export const ControlPanel = ({ options, replaceVariables }: Props) => {
  const { 
    displayMode, 
    panelTheme, 
    showTitle, 
    customTitle,
    timePicker,
    variableFilters,
    borderRadius,
    padding,
    opacity,
  } = options;

  const styles = useStyles2((theme) => 
    getStyles(theme, displayMode, panelTheme, borderRadius, padding, opacity)
  );

  // Get dashboard UID from the data context
  const dashboardUid = useMemo(() => {
    // Try to get from the URL or context
    const url = window.location.pathname;
    const match = url.match(/\/d\/([^/]+)/);
    return match ? match[1] : undefined;
  }, []);

  // Check if we have any content to show
  const hasTimePickerContent = timePicker.showTimePicker;
  const hasVariableContent = variableFilters.showVariables;
  const hasAnyContent = hasTimePickerContent || hasVariableContent;

  if (!hasAnyContent) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Icon name="sliders-v-alt" size="xl" />
          <span>Enable time picker or variable filters in panel options</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Optional Title */}
      {showTitle && customTitle && (
        <div className={styles.title}>
          <Icon name="sliders-v-alt" size="md" className={styles.icon} />
          {replaceVariables(customTitle)}
        </div>
      )}

      {/* Main Content */}
      <div className={styles.content}>
        {/* Time Picker Section */}
        {hasTimePickerContent && (
          <div className={styles.section}>
            {displayMode === DisplayMode.Vertical && (
              <div className={styles.sectionLabel}>Time Range</div>
            )}
            <TimePickerSection 
              options={timePicker}
              panelTheme={panelTheme}
              borderRadius={borderRadius}
            />
          </div>
        )}

        {/* Divider between sections */}
        {hasTimePickerContent && hasVariableContent && (
          <div className={styles.divider} />
        )}

        {/* Variable Filters Section */}
        {hasVariableContent && (
          <div className={styles.section}>
            {displayMode === DisplayMode.Vertical && (
              <div className={styles.sectionLabel}>Filters</div>
            )}
            <VariableFiltersSection
              options={variableFilters}
              panelTheme={panelTheme}
              displayMode={displayMode}
              borderRadius={borderRadius}
              dashboardUid={dashboardUid}
            />
          </div>
        )}
      </div>
    </div>
  );
};












































