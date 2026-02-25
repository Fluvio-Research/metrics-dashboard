import { css, cx } from '@emotion/css';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { useOverlay } from '@react-aria/overlays';
import { memo, useRef, useState, useEffect, useLayoutEffect, CSSProperties } from 'react';

import {
  rangeUtil,
  GrafanaTheme2,
  dateTimeFormat,
  timeZoneFormatUserFriendly,
  TimeOption,
  TimeRange,
  TimeZone,
  dateMath,
  getTimeZoneInfo,
} from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t, Trans } from '@grafana/i18n';

import { useStyles2, useTheme2 } from '../../themes/ThemeContext';
import { ButtonGroup } from '../Button/ButtonGroup';
import { getModalStyles } from '../Modal/getModalStyles';
import { getPortalContainer } from '../Portal/Portal';
import { Portal } from '../Portal/Portal';
import { ToolbarButton } from '../ToolbarButton/ToolbarButton';
import { Tooltip } from '../Tooltip/Tooltip';

import { TimePickerContent } from './TimeRangePicker/TimePickerContent';
import { TimeZoneDescription } from './TimeZonePicker/TimeZoneDescription';
import { WeekStart } from './WeekStartPicker';
import { getQuickOptions } from './options';
import { useTimeSync } from './utils/useTimeSync';

/** @public */
export interface TimeRangePickerProps {
  hideText?: boolean;
  value: TimeRange;
  timeZone?: TimeZone;
  fiscalYearStartMonth?: number;

  /**
   * If you handle sync state between pickers yourself use this prop to pass the sync button component.
   * Otherwise, a default one will show automatically if sync is possible.
   */
  timeSyncButton?: JSX.Element;

  // Use to manually set the synced styles for the time range picker if you need to control the sync state yourself.
  isSynced?: boolean;

  // Use to manually set the initial sync state for the time range picker. It will use the current value to sync.
  initialIsSynced?: boolean;

  onChange: (timeRange: TimeRange) => void;
  onChangeTimeZone: (timeZone: TimeZone) => void;
  onChangeFiscalYearStartMonth?: (month: number) => void;
  onMoveBackward: () => void;
  onMoveForward: () => void;
  onZoom: () => void;
  onError?: (error?: string) => void;
  history?: TimeRange[];
  quickRanges?: TimeOption[];
  hideQuickRanges?: boolean;
  widthOverride?: number;
  isOnCanvas?: boolean;
  onToolbarTimePickerClick?: () => void;
  /** Which day of the week the calendar should start on. Possible values: "saturday", "sunday" or "monday" */
  weekStart?: WeekStart;
}

export interface State {
  isOpen: boolean;
}

export function TimeRangePicker(props: TimeRangePickerProps) {
  const [isOpen, setOpen] = useState(false);
  const [portalPlacement, setPortalPlacement] = useState<CSSProperties>();

  const {
    value,
    onMoveBackward,
    onMoveForward,
    onZoom,
    onError,
    timeZone,
    fiscalYearStartMonth,
    history,
    onChangeTimeZone,
    onChangeFiscalYearStartMonth,
    quickRanges,
    hideQuickRanges,
    widthOverride,
    isOnCanvas,
    onToolbarTimePickerClick,
    weekStart,
    initialIsSynced,
  } = props;

  const theme = useTheme2();
  const shouldPortal = isOnCanvas === false;

  const { onChangeWithSync, isSynced, timeSyncButton } = useTimeSync({
    initialIsSynced,
    value,
    onChangeProp: props.onChange,
    isSyncedProp: props.isSynced,
    timeSyncButtonProp: props.timeSyncButton,
  });

  const onChange = (timeRange: TimeRange) => {
    onChangeWithSync(timeRange);
    setOpen(false);
  };

  useEffect(() => {
    if (isOpen && onToolbarTimePickerClick) {
      onToolbarTimePickerClick();
    }
  }, [isOpen, onToolbarTimePickerClick]);

  const onToolbarButtonSwitch = () => {
    setOpen((prevState) => !prevState);
  };

  const onClose = () => {
    setOpen(false);
  };

  const overlayRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLElement>(null);
  const { overlayProps, underlayProps } = useOverlay(
    {
      onClose,
      isDismissable: true,
      isOpen,
      shouldCloseOnInteractOutside: (element) => {
        const portalContainer = getPortalContainer();
        return !buttonRef.current?.contains(element) && !portalContainer.contains(element);
      },
    },
    overlayRef
  );
  const { dialogProps } = useDialog({}, overlayRef);

  const styles = useStyles2(getStyles);
  const { modalBackdrop } = useStyles2(getModalStyles);

  // Calculate position for portal placement
  useLayoutEffect(() => {
    if (!shouldPortal || !isOpen) {
      setPortalPlacement(undefined);
      return;
    }

    const calculatePosition = (): CSSProperties | undefined => {
      if (!buttonRef.current) {
        return undefined;
      }

      const triggerRect = buttonRef.current.getBoundingClientRect();
      const contentWidth = widthOverride ?? 546;
      const contentHeight = 450;
      const padding = 12;
      const isSmallScreen = window.innerWidth <= theme.breakpoints.values.sm;

      if (isSmallScreen) {
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: Math.min(contentWidth, window.innerWidth - padding * 2),
          maxHeight: `calc(100vh - ${padding * 2}px)`,
          zIndex: theme.zIndex.modal + 1,
        };
      }

      let top = triggerRect.bottom + padding;
      let left = triggerRect.right - contentWidth;

      if (left + contentWidth > window.innerWidth - padding) {
        left = window.innerWidth - contentWidth - padding;
      }

      if (left < padding) {
        left = padding;
      }

      if (top + contentHeight > window.innerHeight - padding) {
        const spaceAbove = triggerRect.top - padding;
        const spaceBelow = window.innerHeight - triggerRect.bottom - padding;
        
        if (spaceAbove > spaceBelow) {
          top = Math.max(padding, triggerRect.top - contentHeight - padding);
        }
      }

      return {
        position: 'fixed',
        top,
        left,
        width: contentWidth,
        maxHeight: `calc(100vh - ${padding * 2}px)`,
        zIndex: theme.zIndex.modal + 1,
      };
    };

    const position = calculatePosition();
    setPortalPlacement(position);

    const handleResize = () => {
      const newPosition = calculatePosition();
      setPortalPlacement(newPosition);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, shouldPortal, widthOverride, theme.breakpoints.values.sm, theme.zIndex.modal]);

  const variant = isSynced ? 'active' : isOnCanvas ? 'canvas' : 'default';

  const isFromAfterTo = value?.to?.isBefore(value.from);
  const timePickerIcon = isFromAfterTo ? 'exclamation-triangle' : 'clock-nine';

  const currentTimeRange = formattedRange(value, timeZone, quickRanges);

  return (
    <div className={styles.wrapper}>
      <ButtonGroup className={styles.container}>
        <ToolbarButton
          aria-label={t('time-picker.range-picker.backwards-time-aria-label', 'Move time range backwards')}
          variant={variant}
          onClick={onMoveBackward}
          icon="angle-left"
          type="button"
          narrow
        />

        <Tooltip
          ref={buttonRef}
          content={<TimePickerTooltip timeRange={value} timeZone={timeZone} />}
          placement="bottom"
          interactive
        >
          <ToolbarButton
            data-testid={selectors.components.TimePicker.openButton}
            aria-label={t('time-picker.range-picker.current-time-selected', 'Time range selected: {{currentTimeRange}}', {
              currentTimeRange,
            })}
            aria-controls="TimePickerContent"
            onClick={onToolbarButtonSwitch}
            icon={timePickerIcon}
            isOpen={isOpen}
            type="button"
            variant={variant}
          >
            <TimePickerButtonLabel {...props} />
          </ToolbarButton>
        </Tooltip>
        {isOpen &&
          (shouldPortal ? (
            <Portal>
              <div data-testid={selectors.components.TimePicker.overlayContent} className={styles.portalOverlay}>
                <div 
                  role="presentation" 
                  className={styles.portalBackdrop} 
                  onClick={onClose}
                  {...underlayProps} 
                />
                <FocusScope contain autoFocus restoreFocus>
                  <section
                    className={styles.portalContent}
                    ref={overlayRef}
                    {...overlayProps}
                    {...dialogProps}
                    style={portalPlacement}
                  >
                    <TimePickerContent
                      timeZone={timeZone}
                      fiscalYearStartMonth={fiscalYearStartMonth}
                      value={value}
                      onChange={onChange}
                      quickOptions={quickRanges || getQuickOptions()}
                      history={history}
                      showHistory
                      widthOverride={widthOverride ?? 546}
                      onChangeTimeZone={onChangeTimeZone}
                      onChangeFiscalYearStartMonth={onChangeFiscalYearStartMonth}
                      hideQuickRanges={hideQuickRanges}
                      onError={onError}
                      weekStart={weekStart}
                    />
                  </section>
                </FocusScope>
              </div>
            </Portal>
          ) : (
            <div data-testid={selectors.components.TimePicker.overlayContent}>
              <div role="presentation" className={cx(modalBackdrop, styles.backdrop)} {...underlayProps} />
              <FocusScope contain autoFocus restoreFocus>
                <section className={styles.content} ref={overlayRef} {...overlayProps} {...dialogProps}>
                  <TimePickerContent
                    timeZone={timeZone}
                    fiscalYearStartMonth={fiscalYearStartMonth}
                    value={value}
                    onChange={onChange}
                    quickOptions={quickRanges || getQuickOptions()}
                    history={history}
                    showHistory
                    widthOverride={widthOverride}
                    onChangeTimeZone={onChangeTimeZone}
                    onChangeFiscalYearStartMonth={onChangeFiscalYearStartMonth}
                    hideQuickRanges={hideQuickRanges}
                    onError={onError}
                    weekStart={weekStart}
                  />
                </section>
              </FocusScope>
            </div>
          ))}

        {timeSyncButton}

        <ToolbarButton
          aria-label={t('time-picker.range-picker.forwards-time-aria-label', 'Move time range forwards')}
          onClick={onMoveForward}
          icon="angle-right"
          narrow
          type="button"
          variant={variant}
        />

        <Tooltip content={ZoomOutTooltip} placement="bottom">
          <ToolbarButton
            aria-label={t('time-picker.range-picker.zoom-out-button', 'Zoom out time range')}
            onClick={onZoom}
            icon="search-minus"
            type="button"
            variant={variant}
          />
        </Tooltip>
      </ButtonGroup>
    </div>
  );
}

TimeRangePicker.displayName = 'TimeRangePicker';

const ZoomOutTooltip = () => (
  <>
    <Trans i18nKey="time-picker.range-picker.zoom-out-tooltip">
      Time range zoom out <br /> CTRL+Z
    </Trans>
  </>
);

export const TimePickerTooltip = ({ timeRange, timeZone }: { timeRange: TimeRange; timeZone?: TimeZone }) => {
  const styles = useStyles2(getLabelStyles);
  const now = Date.now();

  // Get timezone info only if timeZone is provided
  const timeZoneInfo = timeZone ? getTimeZoneInfo(timeZone, now) : undefined;

  return (
    <>
      <div className="text-center">
        {dateTimeFormat(timeRange.from, { timeZone })}
        <div className="text-center">
          <Trans i18nKey="time-picker.range-picker.to">to</Trans>
        </div>
        {dateTimeFormat(timeRange.to, { timeZone })}
      </div>
      <div className={styles.container}>
        <span className={styles.utc}>{timeZoneFormatUserFriendly(timeZone)}</span>
        <TimeZoneDescription info={timeZoneInfo} />
      </div>
    </>
  );
};

type LabelProps = Pick<TimeRangePickerProps, 'hideText' | 'value' | 'timeZone' | 'quickRanges'>;

export const TimePickerButtonLabel = memo<LabelProps>(({ hideText, value, timeZone, quickRanges }) => {
  const styles = useStyles2(getLabelStyles);

  if (hideText) {
    return null;
  }

  return (
    <span className={styles.container} aria-live="polite" aria-atomic="true">
      <span>{formattedRange(value, timeZone, quickRanges)}</span>
      <span className={styles.utc}>{rangeUtil.describeTimeRangeAbbreviation(value, timeZone)}</span>
    </span>
  );
});

TimePickerButtonLabel.displayName = 'TimePickerButtonLabel';

const formattedRange = (value: TimeRange, timeZone?: TimeZone, quickRanges?: TimeOption[]) => {
  const adjustedTimeRange = {
    to: dateMath.isMathString(value.raw.to) ? value.raw.to : value.to,
    from: dateMath.isMathString(value.raw.from) ? value.raw.from : value.from,
  };
  return rangeUtil.describeTimeRange(adjustedTimeRange, timeZone, quickRanges);
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css({
      position: 'relative',
      display: 'inline-block',
    }),
    container: css({
      position: 'relative',
      display: 'flex',
      verticalAlign: 'middle',
    }),
    backdrop: css({
      display: 'none',
      [theme.breakpoints.down('sm')]: {
        display: 'block',
      },
    }),
    content: css({
      position: 'absolute',
      right: 0,
      top: 'calc(100% + 8px)',
      zIndex: theme.zIndex.dropdown,
      borderRadius: theme.shape.radius.default,
      boxShadow: theme.shadows.z3,
      overflow: 'hidden',

      [theme.breakpoints.down('sm')]: {
        position: 'fixed',
        right: '50%',
        top: '50%',
        transform: 'translate(50%, -50%)',
        zIndex: theme.zIndex.modal,
      },
    }),
    portalOverlay: css({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: theme.zIndex.modal,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
    }),
    portalBackdrop: css({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: theme.zIndex.modal,
      
      [theme.breakpoints.up('sm')]: {
        background: 'transparent',
      },
    }),
    portalContent: css({
      position: 'fixed',
      zIndex: theme.zIndex.modal + 1,
      borderRadius: theme.shape.radius.default,
      boxShadow: `0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px ${theme.colors.border.weak}`,
      overflow: 'hidden',
      animation: 'fadeInScale 0.15s ease-out',
      
      '@keyframes fadeInScale': {
        from: {
          opacity: 0,
          transform: 'scale(0.95)',
        },
        to: {
          opacity: 1,
          transform: 'scale(1)',
        },
      },
    }),
  };
};

const getLabelStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
      columnGap: theme.spacing(0.5),
    }),
    utc: css({
      color: theme.v1.palette.orange,
      fontSize: theme.typography.size.sm,
      paddingLeft: '6px',
      lineHeight: '28px',
      verticalAlign: 'bottom',
      fontWeight: theme.typography.fontWeightMedium,
    }),
  };
};
