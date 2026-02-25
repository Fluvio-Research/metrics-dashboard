import { css } from '@emotion/css';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { useOverlay } from '@react-aria/overlays';
import { createRef, FormEvent, memo, useCallback, useEffect } from 'react';

import { DateTime, GrafanaTheme2, TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';

import { useStyles2 } from '../../../themes/ThemeContext';
import { Portal } from '../../Portal/Portal';
import { WeekStart } from '../WeekStartPicker';

import { Body } from './CalendarBody';
import { Footer } from './CalendarFooter';
import { Header } from './CalendarHeader';

export const getStyles = (theme: GrafanaTheme2) => {
  return {
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

    modalContainer: css({
      label: 'modalContainer',
      position: 'relative',
      zIndex: theme.zIndex.modal + 11,
    }),

    calendar: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      padding: theme.spacing(1.5),
      label: 'calendar',
      boxShadow: theme.shadows.z3,
      backgroundColor: theme.colors.background.elevated,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      minWidth: '300px',
    }),
  };
};

export interface TimePickerCalendarProps {
  isOpen: boolean;
  from: DateTime;
  to: DateTime;
  onClose: () => void;
  onApply: (e: FormEvent<HTMLButtonElement>) => void;
  onChange: (from: DateTime, to: DateTime) => void;
  weekStart?: WeekStart;

  /**
   * When true, the calendar is rendered as a floating "tooltip" next to the input.
   * When false, the calendar is rendered "fullscreen" in a modal. Yes. Don't ask.
   */
  isFullscreen: boolean;
  timeZone?: TimeZone;
  isReversed?: boolean;
}

function TimePickerCalendar(props: TimePickerCalendarProps) {
  const styles = useStyles2(getStyles);
  const { isOpen, onClose } = props;
  const ref = createRef<HTMLElement>();
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

  if (!isOpen) {
    return null;
  }

  const calendar = (
    <section
      className={styles.calendar}
      ref={ref}
      {...overlayProps}
      {...dialogProps}
      data-testid={selectors.components.TimePicker.calendar.label}
    >
      <Header {...props} />
      <Body {...props} />
      <Footer {...props} />
    </section>
  );

  return (
    <Portal>
      <div className={styles.overlay}>
        <div 
          className={styles.backdrop} 
          onClick={onClose}
          role="presentation"
        />
        <FocusScope autoFocus restoreFocus>
          <div className={styles.modalContainer}>
            {calendar}
          </div>
        </FocusScope>
      </div>
    </Portal>
  );
}
export default memo(TimePickerCalendar);
TimePickerCalendar.displayName = 'TimePickerCalendar';
