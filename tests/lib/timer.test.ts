import { formatTime } from '../../src/lib/timer';

describe('timer', () => {
  describe('formatTime', () => {
    it('formats 0 seconds as 0:00', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    it('formats 90 seconds as 1:30', () => {
      expect(formatTime(90)).toBe('1:30');
    });

    it('formats 3661 seconds as 1:01:01', () => {
      expect(formatTime(3661)).toBe('1:01:01');
    });

    it('formats 60 seconds as 1:00', () => {
      expect(formatTime(60)).toBe('1:00');
    });

    it('formats 5 seconds as 0:05', () => {
      expect(formatTime(5)).toBe('0:05');
    });

    it('formats 3600 seconds as 1:00:00', () => {
      expect(formatTime(3600)).toBe('1:00:00');
    });

    it('formats 7200 seconds as 2:00:00', () => {
      expect(formatTime(7200)).toBe('2:00:00');
    });

    it('formats 599 seconds as 9:59', () => {
      expect(formatTime(599)).toBe('9:59');
    });
  });

  // Note: useCountdown hook is integration-tested via CookingTimer component.
  // The hook requires React Native's AppState and setInterval which are
  // better tested in component integration tests.
});
