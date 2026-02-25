import { css } from '@emotion/css';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { useOverlay } from '@react-aria/overlays';
import { createRef, memo, useCallback, useEffect, useState } from 'react';
import Calendar from 'react-calendar';

import { DateTime, dateTimeParse, getTimeZone, GrafanaTheme2, TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t, Trans } from '@grafana/i18n';

import { useStyles2 } from '../../../themes/ThemeContext';
import { Button } from '../../Button/Button';
import { Icon } from '../../Icon/Icon';
import { IconButton } from '../../IconButton/IconButton';
import { Stack } from '../../Layout/Stack/Stack';
import { Portal } from '../../Portal/Portal';
import { WeekStart, getWeekStart } from '../WeekStartPicker';
import { adjustDateForReactCalendar } from '../utils/adjustDateForReactCalendar';

import { getBodyStyles } from './CalendarBody';
import { TimePickerTitle } from './TimePickerTitle';

interface SingleDatePickerProps {
  isOpen: boolean;
  value: DateTime;
  onChange: (date: DateTime) => void;
  onClose: () => void;
  label: string;
  timeZone?: TimeZone;
  weekStart?: WeekStart;
  minDate?: Date;
  maxDate?: Date;
}

const weekStartMap: Record<WeekStart, 'islamic' | 'gregory' | 'iso8601'> = {
  saturday: 'islamic',
  sunday: 'gregory',
  monday: 'iso8601',
};

function SingleDatePicker({
  isOpen,
  value,
  onChange,
  onClose,
  label,
  timeZone,
  weekStart,
  minDate,
  maxDate,
}: SingleDatePickerProps) {
  const styles = useStyles2(getStyles);
  const calendarStyles = useStyles2(getBodyStyles);
  const ref = createRef<HTMLElement>();
  const weekStartValue = getWeekStart(weekStart);

  const { dialogProps } = useDialog(
    {
      'aria-label': selectors.components.TimePicker.calendar.label,
    },
    ref
  );
  const { overlayProps } = useOverlay(
    {
      isDismissable: true,
      isOpen,
      onClose,
    },
    ref
  );

  // Convert DateTime to Date for react-calendar
  const resolvedTimeZone = getTimeZone({ timeZone });
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value && value.isValid()) {
      return adjustDateForReactCalendar(value.toDate(), resolvedTimeZone);
    }
    return adjustDateForReactCalendar(new Date(), resolvedTimeZone);
  });

  // Update selected date when value changes
  useEffect(() => {
    if (value && value.isValid()) {
      setSelectedDate(adjustDateForReactCalendar(value.toDate(), resolvedTimeZone));
    }
  }, [value, resolvedTimeZone]);

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    return undefined;
  }, [isOpen, handleKeyDown]);

  const handleDateChange = useCallback<NonNullable<React.ComponentProps<typeof Calendar>['onChange']>>(
    (date) => {
      if (date && !Array.isArray(date)) {
        setSelectedDate(date);
      }
    },
    []
  );

  const handleApply = useCallback(() => {
    // Get the hours, minutes, seconds from the original value to preserve time
    // Use toDate() since hour/minute/second methods are optional on DateTime interface
    const originalDate = value && value.isValid() ? value.toDate() : new Date();
    const hours = originalDate.getHours();
    const minutes = originalDate.getMinutes();
    const seconds = originalDate.getSeconds();

    const newDate = dateTimeParse(
      [
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours,
        minutes,
        seconds,
      ],
      { timeZone }
    );

    onChange(newDate);
    onClose();
  }, [selectedDate, value, timeZone, onChange, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <Portal>
      <div className={styles.overlay}>
        <div className={styles.backdrop} onClick={onClose} role="presentation" />
        <FocusScope autoFocus restoreFocus>
          <section
            className={styles.container}
            ref={ref}
            {...overlayProps}
            {...dialogProps}
            data-testid={selectors.components.TimePicker.calendar.label}
          >
            <div className={styles.header}>
              <TimePickerTitle>{label}</TimePickerTitle>
              <IconButton
                data-testid={selectors.components.TimePicker.calendar.closeButton}
                tooltip={t('time-picker.calendar.close', 'Close calendar')}
                name="times"
                variant="secondary"
                onClick={onClose}
              />
            </div>

            <Calendar
              value={selectedDate}
              onChange={handleDateChange}
              next2Label={null}
              prev2Label={null}
              className={calendarStyles.body}
              tileClassName={calendarStyles.title}
              nextLabel={<Icon name="angle-right" />}
              nextAriaLabel={t('time-picker.calendar.next-month', 'Next month')}
              prevLabel={<Icon name="angle-left" />}
              prevAriaLabel={t('time-picker.calendar.previous-month', 'Previous month')}
              locale="en"
              calendarType={weekStartMap[weekStartValue]}
              minDate={minDate}
              maxDate={maxDate}
            />

            <Stack gap={2} justifyContent="flex-end">
              <Button variant="secondary" onClick={onClose}>
                <Trans i18nKey="time-picker.calendar.cancel-button">Cancel</Trans>
              </Button>
              <Button onClick={handleApply}>
                <Trans i18nKey="time-picker.calendar.apply-button">Apply</Trans>
              </Button>
            </Stack>
          </section>
        </FocusScope>
      </div>
    </Portal>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  overlay: css({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: theme.zIndex.modal + 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),

  backdrop: css({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.components.overlay.background,
    zIndex: theme.zIndex.modal + 9,
  }),

  container: css({
    position: 'relative',
    zIndex: theme.zIndex.modal + 11,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.elevated,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    boxShadow: theme.shadows.z3,
    minWidth: '300px',
  }),

  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
});

export default memo(SingleDatePicker);
SingleDatePicker.displayName = 'SingleDatePicker';





























