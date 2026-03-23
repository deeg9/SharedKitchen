import {
  startOfWeek,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
} from 'date-fns';

/**
 * Returns 7 Date objects (Mon-Sun) for the week at the given offset.
 * weekOffset=0 is current week, 1 is next week, -1 is previous week.
 */
export function getWeekDays(weekOffset: number = 0): Date[] {
  const today = new Date();
  const targetDate = addWeeks(today, weekOffset);
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sunday

  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Formats a Date to 'yyyy-MM-dd' string for database storage.
 */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Returns formatted labels for a day card header.
 */
export function formatDayLabel(date: Date): {
  month: string;
  day: string;
  weekday: string;
} {
  return {
    month: format(date, 'MMM').toUpperCase(),
    day: format(date, 'd'),
    weekday: format(date, 'EEE').toUpperCase(),
  };
}

/**
 * Returns a human-readable week range label, e.g. "Mar 17 - 23, 2026".
 */
export function getWeekLabel(weekOffset: number): string {
  const days = getWeekDays(weekOffset);
  const start = days[0];
  const end = days[6];

  const startMonth = format(start, 'MMM');
  const endMonth = format(end, 'MMM');
  const year = format(end, 'yyyy');

  if (startMonth === endMonth) {
    return `${startMonth} ${format(start, 'd')} - ${format(end, 'd')}, ${year}`;
  }
  return `${startMonth} ${format(start, 'd')} - ${endMonth} ${format(end, 'd')}, ${year}`;
}
