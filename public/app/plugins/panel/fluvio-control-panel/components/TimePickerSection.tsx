import { css } from '@emotion/css';
import { useCallback, useState, useEffect } from 'react';

import {
  GrafanaTheme2,
  TimeRange,
  TimeZone,
} from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { useStyles2, TimeRangePicker, Icon } from '@grafana/ui';
import { getTimeSrv } from 'app/features/dashboard/services/TimeSrv';

import { TimePickerOptions, PanelTheme } from '../panelcfg.gen';

interface Props {
  options: TimePickerOptions;
  panelTheme: PanelTheme;
  borderRadius: number;
  onRefresh?: () => void;
}

export const TimePickerSection = ({ options, panelTheme, borderRadius, onRefresh }: Props) => {
  const styles = useStyles2((theme) => getTimePickerStyles(theme, panelTheme, borderRadius, options.labelPosition ?? 'above'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentRange, setCurrentRange] = useState<TimeRange | null>(null);
  const [timeZone, setTimeZone] = useState<TimeZone>('utc');

  // Get current time range and subscribe to changes
  useEffect(() => {
    const timeSrv = getTimeSrv();
    setCurrentRange(timeSrv.timeRange());
    
    // Get timezone from dashboard if available
    const dashboard = (window as any).__grafana_scene_context?.dashboard;
    if (dashboard?.timezone) {
      setTimeZone(dashboard.timezone);
    }

    // Poll for time range changes
    const interval = setInterval(() => {
      const newRange = timeSrv.timeRange();
      setCurrentRange((prev) => {
        // Only update if actually changed
        if (!prev || prev.from.valueOf() !== newRange.from.valueOf() || prev.to.valueOf() !== newRange.to.valueOf()) {
          return newRange;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Ensure TimeRangePicker dropdown appears above other panels
  useEffect(() => {
    // Inject a style to ensure TimePicker dropdown has highest z-index
    const styleId = 'fluvio-control-panel-timepicker-zindex';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Ensure portal container and time picker overlays have proper z-index */
        #grafana-portal-container {
          z-index: 2147483600 !important;
        }
        /* Time picker portal overlay */
        [data-testid="TimePicker.overlayContent"] {
          z-index: 2147483600 !important;
        }
        /* Select portal menus that might be used inside TimeRangePicker */
        .select-menu-portal,
        .ReactSelect__menu,
        .react-select__menu {
          z-index: 2147483601 !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);

  const handleTimeRangeChange = useCallback((timeRange: TimeRange) => {
    const timeSrv = getTimeSrv();
    
    // Convert to raw format for setTime
    const rawFrom = typeof timeRange.raw.from === 'string' 
      ? timeRange.raw.from 
      : timeRange.from.toISOString();
    const rawTo = typeof timeRange.raw.to === 'string' 
      ? timeRange.raw.to 
      : timeRange.to.toISOString();
    
    timeSrv.setTime({
      from: rawFrom,
      to: rawTo,
    });

    // Update URL
    locationService.partial({
      from: rawFrom,
      to: rawTo,
    });

    setCurrentRange(timeRange);
  }, []);

  const handleTimeZoneChange = useCallback((tz: TimeZone) => {
    setTimeZone(tz);
    // Timezone changes are typically handled by the dashboard
    const dashboard = (window as any).__grafana_scene_context?.dashboard;
    if (dashboard && dashboard.setTimezone) {
      dashboard.setTimezone(tz);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    const timeSrv = getTimeSrv();
    timeSrv.refreshTimeModel();
    
    if (onRefresh) {
      onRefresh();
    }

    setTimeout(() => setIsRefreshing(false), 1000);
  }, [onRefresh]);

  const handleMoveBackward = useCallback(() => {
    const timeSrv = getTimeSrv();
    const range = timeSrv.timeRange();
    const timespan = range.to.valueOf() - range.from.valueOf();
    const newFrom = range.from.valueOf() - timespan;
    const newTo = range.to.valueOf() - timespan;
    
    timeSrv.setTime({
      from: new Date(newFrom).toISOString(),
      to: new Date(newTo).toISOString(),
    });
  }, []);

  const handleMoveForward = useCallback(() => {
    const timeSrv = getTimeSrv();
    const range = timeSrv.timeRange();
    const timespan = range.to.valueOf() - range.from.valueOf();
    const newFrom = range.from.valueOf() + timespan;
    const newTo = range.to.valueOf() + timespan;
    
    timeSrv.setTime({
      from: new Date(newFrom).toISOString(),
      to: new Date(newTo).toISOString(),
    });
  }, []);

  const handleZoom = useCallback(() => {
    const timeSrv = getTimeSrv();
    timeSrv.zoomOut(2);
  }, []);

  if (!options.showTimePicker || !currentRange) {
    return null;
  }

  const labelMode = options.labelPosition ?? 'above';
  const showLabel = labelMode !== 'hidden';

  return (
    <div className={styles.card}>
      {(labelMode === 'above') && (
        <div className={styles.header}>
          <div className={styles.title}>
            <Icon name="clock-nine" />
            <span>Time range</span>
          </div>
          <div className={styles.headerActions}>
            {options.showRefreshButton && (
              <button
                className={css(styles.controlButton, isRefreshing && styles.refreshing)}
                onClick={handleRefresh}
                title="Refresh dashboard"
              >
                <Icon name="sync" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className={css(labelMode === 'inline' ? styles.inlineRow : styles.body)}>
        {showLabel && labelMode === 'inline' && (
          <div className={styles.inlineLabel}>
            <Icon name="clock-nine" />
            <span>Time range</span>
          </div>
        )}

        <div className={styles.pickerShell}>
          <TimeRangePicker
            value={currentRange}
            timeZone={timeZone}
            onChange={handleTimeRangeChange}
            onChangeTimeZone={handleTimeZoneChange}
            onMoveBackward={handleMoveBackward}
            onMoveForward={handleMoveForward}
            onZoom={handleZoom}
            quickRanges={options.showQuickRanges ? undefined : []}
            hideQuickRanges={!options.showQuickRanges}
            widthOverride={546}
            isOnCanvas={false}
          />
        </div>

        {options.showRefreshButton && labelMode === 'inline' && (
          <button
            className={css(styles.controlButton, isRefreshing && styles.refreshing)}
            onClick={handleRefresh}
            title="Refresh dashboard"
          >
            <Icon name="sync" />
          </button>
        )}
      </div>
    </div>
  );
};

const getTimePickerStyles = (
  theme: GrafanaTheme2,
  panelTheme: PanelTheme,
  borderRadius: number,
  labelPosition: 'above' | 'inline' | 'hidden',
) => {
  const isGradient = panelTheme === PanelTheme.Gradient;

  // SIWIS Theme Colors
  const siwis = {
    darkNavy: '#093765',
    mediumBlue: '#247abe',
    lightCyan: '#83dcfb',
    brightCyan: '#4ebff2',
    accentBlue: '#156bb7',
    mutedBlueGray: '#517693',
    steelBlue: '#5989af',
    lightBlue: '#62a5d4',
  };

  return {
    card: css({
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      padding: theme.spacing(1.5),
      borderRadius: `${borderRadius}px`,
      background: isGradient
        ? `linear-gradient(145deg, ${siwis.darkNavy}, ${siwis.accentBlue})`
        : theme.isDark
          ? siwis.darkNavy
          : '#f0f8ff',
      border: `1px solid ${isGradient ? siwis.steelBlue : siwis.lightBlue}`,
      boxShadow: isGradient
        ? `0 8px 24px rgba(9, 55, 101, 0.35)`
        : `0 6px 18px rgba(9, 55, 101, 0.12)`,
      position: 'relative',
      overflow: 'visible',
    }),

    header: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(1),
      paddingBottom: theme.spacing(1),
      borderBottom: `1px solid ${isGradient ? siwis.steelBlue : siwis.lightBlue}`,
    }),

    title: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      color: isGradient
        ? siwis.lightCyan
        : siwis.darkNavy,
      fontWeight: theme.typography.fontWeightMedium,
      textTransform: 'uppercase',
      letterSpacing: 0.2,
      fontSize: theme.typography.bodySmall.fontSize,
      '& svg': {
        color: isGradient ? siwis.brightCyan : siwis.mediumBlue,
      },
    }),

    headerActions: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
    }),

    body: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),

    inlineRow: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      flexWrap: 'wrap',
      position: 'relative',
      overflow: 'visible',
    }),

    inlineLabel: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
      borderRadius: `${borderRadius}px`,
      background: isGradient
        ? `rgba(131, 220, 251, 0.1)`
        : theme.isDark
          ? siwis.mutedBlueGray
          : '#e6f4ff',
      color: isGradient ? siwis.lightCyan : siwis.darkNavy,
      fontWeight: theme.typography.fontWeightMedium,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      fontSize: theme.typography.bodySmall.fontSize,
      '& svg': {
        color: isGradient ? siwis.brightCyan : siwis.mediumBlue,
      },
    }),

    pickerShell: css({
      minWidth: labelPosition === 'inline' ? '300px' : 'auto',
      maxWidth: '100%',
      position: 'relative',
      overflow: 'visible',
      flex: labelPosition === 'inline' ? '1 1 auto' : undefined,
    }),

    controlButton: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: isGradient
        ? `rgba(131, 220, 251, 0.15)`
        : siwis.darkNavy,
      border: isGradient
        ? `1px solid ${siwis.steelBlue}`
        : `1px solid ${siwis.darkNavy}`,
      borderRadius: `${borderRadius}px`,
      color: isGradient ? siwis.lightCyan : 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      padding: 0,
      '&:hover': {
        background: isGradient
          ? `rgba(131, 220, 251, 0.25)`
          : siwis.accentBlue,
        color: isGradient ? 'white' : 'white',
        boxShadow: `0 4px 10px rgba(9, 55, 101, 0.25)`,
      },
      '&:active': {
        transform: 'translateY(1px)',
      },
    }),

    refreshing: css({
      '& svg': {
        animation: 'spin 1s linear infinite',
      },
      '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
    }),
  };
};
