import { css } from '@emotion/css';
import { FormEvent, useCallback, useEffect, useId, useState } from 'react';
import * as React from 'react';

import {
  DateTime,
  dateTimeFormat,
  dateTimeParse,
  GrafanaTheme2,
  isDateTime,
  rangeUtil,
  RawTimeRange,
  TimeRange,
  TimeZone,
} from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t, Trans } from '@grafana/i18n';

import { useStyles2 } from '../../../themes/ThemeContext';
import { Button } from '../../Button/Button';
import { Field } from '../../Forms/Field';
import { Icon } from '../../Icon/Icon';
import { Input } from '../../Input/Input';
import { Tooltip } from '../../Tooltip/Tooltip';
import { WeekStart } from '../WeekStartPicker';
import { commonFormat } from '../commonFormat';
import { isValid } from '../utils';

import SingleDatePicker from './SingleDatePicker';

interface Props {
  isFullscreen: boolean;
  value: TimeRange;
  onApply: (range: TimeRange) => void;
  timeZone?: TimeZone;
  fiscalYearStartMonth?: number;
  roundup?: boolean;
  isReversed?: boolean;
  onError?: (error?: string) => void;
  weekStart?: WeekStart;
}

interface InputState {
  value: string;
  invalid: boolean;
  errorMessage: string;
}

const ERROR_MESSAGES = {
  default: () => t('time-picker.range-content.default-error', 'Please enter a past date or "{{now}}"', { now: 'now' }),
  range: () => t('time-picker.range-content.range-error', '"From" can\'t be after "To"'),
};

export const TimeRangeContent = (props: Props) => {
  const {
    value,
    timeZone,
    onApply: onApplyFromProps,
    fiscalYearStartMonth,
    onError,
    weekStart,
  } = props;
  const [fromValue, toValue] = valueToState(value.raw.from, value.raw.to, timeZone);
  const style = useStyles2(getStyles);

  const [from, setFrom] = useState<InputState>(fromValue);
  const [to, setTo] = useState<InputState>(toValue);
  const [isFromCalendarOpen, setFromCalendarOpen] = useState(false);
  const [isToCalendarOpen, setToCalendarOpen] = useState(false);

  const fromFieldId = useId();
  const toFieldId = useId();

  // Synchronize internal state with external value
  useEffect(() => {
    const [fromValue, toValue] = valueToState(value.raw.from, value.raw.to, timeZone);
    setFrom(fromValue);
    setTo(toValue);
  }, [value.raw.from, value.raw.to, timeZone]);

  const onOpenFromCalendar = useCallback(
    (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setFromCalendarOpen(true);
    },
    []
  );

  const onOpenToCalendar = useCallback(
    (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setToCalendarOpen(true);
    },
    []
  );

  const onApply = useCallback(() => {
    if (to.invalid || from.invalid) {
      return;
    }

    const raw: RawTimeRange = { from: from.value, to: to.value };
    const timeRange = rangeUtil.convertRawToRange(raw, timeZone, fiscalYearStartMonth, commonFormat);

    onApplyFromProps(timeRange);
  }, [from.invalid, from.value, onApplyFromProps, timeZone, to.invalid, to.value, fiscalYearStartMonth]);

  const onFromChange = useCallback(
    (newFrom: DateTime | string) => {
      const [fromValue] = valueToState(newFrom, to.value, timeZone);
      setFrom(fromValue);
    },
    [timeZone, to.value]
  );

  const onToChange = useCallback(
    (newTo: DateTime | string) => {
      const [, toValue] = valueToState(from.value, newTo, timeZone);
      setTo(toValue);
    },
    [timeZone, from.value]
  );

  const onFromInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.value;
      const [fromValue, toValue] = valueToState(newValue, to.value, timeZone);
      setFrom(fromValue);
      // Update to validation based on new from
      setTo(toValue);
    },
    [timeZone, to.value]
  );

  const onToInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.value;
      const [fromValue, toValue] = valueToState(from.value, newValue, timeZone);
      setFrom(fromValue);
      setTo(toValue);
    },
    [timeZone, from.value]
  );

  const submitOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onApply();
    }
  };

  const onCopy = () => {
    const raw: RawTimeRange = { from: from.value, to: to.value };
    navigator.clipboard.writeText(JSON.stringify(raw));
  };

  const onPaste = async () => {
    const raw = await navigator.clipboard.readText();
    let range;

    try {
      range = JSON.parse(raw);
    } catch (error) {
      if (onError) {
        onError(raw);
      }
      return;
    }

    const [fromValue, toValue] = valueToState(range.from, range.to, timeZone);
    setFrom(fromValue);
    setTo(toValue);
  };

  const fiscalYear = rangeUtil.convertRawToRange({ from: 'now/fy', to: 'now/fy' }, timeZone, fiscalYearStartMonth);

  const fyTooltip = (
    <div className={style.tooltip}>
      {rangeUtil.isFiscal(value) ? (
        <Tooltip
          content={t('time-picker.range-content.fiscal-year', 'Fiscal year: {{from}} - {{to}}', {
            from: fiscalYear.from.format('MMM-DD'),
            to: fiscalYear.to.format('MMM-DD'),
          })}
        >
          <Icon name="info-circle" />
        </Tooltip>
      ) : null}
    </div>
  );

  const fromCalendarIcon = (
    <Button
      aria-label={t('time-picker.range-content.open-from-calendar', 'Open From date calendar')}
      data-testid={selectors.components.TimePicker.calendar.openButton}
      icon="calendar-alt"
      variant="secondary"
      type="button"
      onClick={onOpenFromCalendar}
    />
  );

  const toCalendarIcon = (
    <Button
      aria-label={t('time-picker.range-content.open-to-calendar', 'Open To date calendar')}
      data-testid={`${selectors.components.TimePicker.calendar.openButton}-to`}
      icon="calendar-alt"
      variant="secondary"
      type="button"
      onClick={onOpenToCalendar}
    />
  );

  return (
    <div>
      <div className={style.fieldContainer}>
        <Field
          label={t('time-picker.range-content.from-input', 'From')}
          invalid={from.invalid}
          error={from.errorMessage}
        >
          <Input
            id={fromFieldId}
            onClick={(event) => event.stopPropagation()}
            onChange={onFromInputChange}
            addonAfter={fromCalendarIcon}
            onKeyDown={submitOnEnter}
            data-testid={selectors.components.TimePicker.fromField}
            value={from.value}
          />
        </Field>
        {fyTooltip}
      </div>
      <div className={style.fieldContainer}>
        <Field label={t('time-picker.range-content.to-input', 'To')} invalid={to.invalid} error={to.errorMessage}>
          <Input
            id={toFieldId}
            onClick={(event) => event.stopPropagation()}
            onChange={onToInputChange}
            addonAfter={toCalendarIcon}
            onKeyDown={submitOnEnter}
            data-testid={selectors.components.TimePicker.toField}
            value={to.value}
          />
        </Field>
        {fyTooltip}
      </div>
      <div className={style.buttonsContainer}>
        <Button
          data-testid={selectors.components.TimePicker.copyTimeRange}
          icon="copy"
          variant="secondary"
          tooltip={t('time-picker.copy-paste.tooltip-copy', 'Copy time range to clipboard')}
          type="button"
          onClick={onCopy}
        />
        <Button
          data-testid={selectors.components.TimePicker.pasteTimeRange}
          icon="clipboard-alt"
          variant="secondary"
          tooltip={t('time-picker.copy-paste.tooltip-paste', 'Paste time range')}
          type="button"
          onClick={onPaste}
        />
        <Button data-testid={selectors.components.TimePicker.applyTimeRange} type="button" onClick={onApply}>
          <Trans i18nKey="time-picker.range-content.apply-button">Apply time range</Trans>
        </Button>
      </div>

      {/* Separate calendar for From date */}
      <SingleDatePicker
        isOpen={isFromCalendarOpen}
        value={dateTimeParse(from.value, { timeZone })}
        onChange={onFromChange}
        onClose={() => setFromCalendarOpen(false)}
        label={t('time-picker.range-content.select-from-date', 'Select From Date')}
        timeZone={timeZone}
        weekStart={weekStart}
      />

      {/* Separate calendar for To date */}
      <SingleDatePicker
        isOpen={isToCalendarOpen}
        value={dateTimeParse(to.value, { timeZone })}
        onChange={onToChange}
        onClose={() => setToCalendarOpen(false)}
        label={t('time-picker.range-content.select-to-date', 'Select To Date')}
        timeZone={timeZone}
        weekStart={weekStart}
      />
    </div>
  );
};

function isRangeInvalid(from: string, to: string, timezone?: string): boolean {
  const raw: RawTimeRange = { from, to };
  const timeRange = rangeUtil.convertRawToRange(raw, timezone, undefined, commonFormat);
  const valid = timeRange.from.isSame(timeRange.to) || timeRange.from.isBefore(timeRange.to);

  return !valid;
}

function valueToState(
  rawFrom: DateTime | string,
  rawTo: DateTime | string,
  timeZone?: TimeZone
): [InputState, InputState] {
  const fromValue = valueAsString(rawFrom, timeZone);
  const toValue = valueAsString(rawTo, timeZone);
  const fromInvalid = !isValid(fromValue, false, timeZone);
  const toInvalid = !isValid(toValue, true, timeZone);
  // If "To" is invalid, we should not check the range anyways
  const rangeInvalid = isRangeInvalid(fromValue, toValue, timeZone) && !toInvalid;

  return [
    {
      value: fromValue,
      invalid: fromInvalid || rangeInvalid,
      errorMessage: rangeInvalid && !fromInvalid ? ERROR_MESSAGES.range() : ERROR_MESSAGES.default(),
    },
    { value: toValue, invalid: toInvalid, errorMessage: ERROR_MESSAGES.default() },
  ];
}

function valueAsString(value: DateTime | string, timeZone?: TimeZone): string {
  if (isDateTime(value)) {
    return dateTimeFormat(value, { timeZone, format: commonFormat });
  }

  if (value.endsWith('Z')) {
    const dt = dateTimeParse(value);
    return dateTimeFormat(dt, { timeZone, format: commonFormat });
  }

  return value;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    fieldContainer: css({
      display: 'flex',
    }),
    buttonsContainer: css({
      display: 'flex',
      gap: theme.spacing(0.5),
      marginTop: theme.spacing(1),
    }),
    tooltip: css({
      paddingLeft: theme.spacing(1),
      paddingTop: theme.spacing(3),
    }),
  };
}
