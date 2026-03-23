import { getWeekDays, toDateString, formatDayLabel, getWeekLabel } from '../../src/lib/dates';

describe('dates', () => {
  describe('getWeekDays', () => {
    it('returns 7 Date objects', () => {
      const days = getWeekDays(0);
      expect(days).toHaveLength(7);
      days.forEach((d) => expect(d).toBeInstanceOf(Date));
    });

    it('starts on Monday', () => {
      const days = getWeekDays(0);
      // Date.getDay(): 0=Sun, 1=Mon
      expect(days[0].getDay()).toBe(1);
    });

    it('ends on Sunday', () => {
      const days = getWeekDays(0);
      expect(days[6].getDay()).toBe(0);
    });

    it('getWeekDays(1) returns next week', () => {
      const thisWeek = getWeekDays(0);
      const nextWeek = getWeekDays(1);
      // Next week Monday should be 7 days after this week Monday
      const diff = nextWeek[0].getTime() - thisWeek[0].getTime();
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('getWeekDays(-1) returns previous week', () => {
      const thisWeek = getWeekDays(0);
      const lastWeek = getWeekDays(-1);
      const diff = thisWeek[0].getTime() - lastWeek[0].getTime();
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('toDateString', () => {
    it('returns yyyy-MM-dd format', () => {
      const date = new Date(2026, 2, 23); // March 23, 2026
      expect(toDateString(date)).toBe('2026-03-23');
    });

    it('pads single-digit months and days', () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      expect(toDateString(date)).toBe('2026-01-05');
    });
  });

  describe('formatDayLabel', () => {
    it('returns month, day, and weekday strings', () => {
      const date = new Date(2026, 2, 23); // Monday March 23, 2026
      const label = formatDayLabel(date);
      expect(label).toHaveProperty('month');
      expect(label).toHaveProperty('day');
      expect(label).toHaveProperty('weekday');
      expect(typeof label.month).toBe('string');
      expect(typeof label.day).toBe('string');
      expect(typeof label.weekday).toBe('string');
    });

    it('returns uppercase short weekday', () => {
      const date = new Date(2026, 2, 23); // Monday
      const label = formatDayLabel(date);
      expect(label.weekday).toBe('MON');
    });
  });

  describe('getWeekLabel', () => {
    it('returns a formatted week range string', () => {
      const label = getWeekLabel(0);
      expect(typeof label).toBe('string');
      // Should contain a dash separator
      expect(label).toContain('-');
    });
  });
});
