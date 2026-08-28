import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const toDateInput = (date: Date): string =>
  format(date, "yyyy-MM-dd");

export const parseDateInput = (value: string): Date | null => {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

export const computeRentalDays = (start: string, end: string): number => {
  const startDate = parseDateInput(start);
  const endDate = parseDateInput(end);
  if (!startDate || !endDate) return 0;
  const diff = differenceInCalendarDays(endDate, startDate);
  return Math.max(1, diff);
};

export const rangeOverlapsReserved = (
  start: string,
  end: string,
  reserved: DateRange[],
): boolean => {
  const startStr = start.slice(0, 10);
  const endStr = end.slice(0, 10);
  if (!startStr || !endStr) return false;
  return reserved.some((range) => {
    const rStart = range.startDate.slice(0, 10);
    const rEnd = range.endDate.slice(0, 10);
    return startStr <= rEnd && endStr >= rStart;
  });
};

export const isDateInReservedRanges = (
  date: Date,
  reserved: DateRange[],
): boolean => {
  const dateStr = toDateInput(date);
  return reserved.some((range) => {
    const startStr = range.startDate.slice(0, 10);
    const endStr = range.endDate.slice(0, 10);
    return dateStr >= startStr && dateStr <= endStr;
  });
};

export const isReservedBeforeRange = (
  date: Date,
  reserved: DateRange[],
  rangeStart: Date | null,
): boolean => {
  if (!rangeStart) return false;
  return reserved.some((range) => {
    const reservedEnd = parseDateInput(range.endDate);
    if (!reservedEnd) return false;
    return (
      isAfter(reservedEnd, addDays(rangeStart, 0)) &&
      isBefore(reservedEnd, date)
    );
  });
};

export const startOfTodayUtc = (): Date => startOfDay(new Date());
