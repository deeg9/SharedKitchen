import {
  validateHandle,
  suggestHandle,
  suggestAlternatives,
  RESERVED_WORDS,
  PROFILE_SELECT,
} from '../../src/lib/handle-utils';

describe('handle-utils', () => {
  describe('validateHandle', () => {
    it('rejects handles shorter than 3 characters', () => {
      const result = validateHandle('ab');
      expect(result).toEqual({ valid: false, error: 'Must be at least 3 characters' });
    });

    it('rejects handles longer than 20 characters', () => {
      const result = validateHandle('a_very_long_handle_that_exceeds');
      expect(result).toEqual({ valid: false, error: 'Must be 20 characters or less' });
    });

    it('rejects handles with invalid characters', () => {
      const result = validateHandle('Hello!');
      expect(result).toEqual({ valid: false, error: 'Only lowercase letters, numbers, and underscores' });
    });

    it('rejects reserved word "admin"', () => {
      const result = validateHandle('admin');
      expect(result).toEqual({ valid: false, error: 'This username is reserved' });
    });

    it('rejects reserved word "support"', () => {
      const result = validateHandle('support');
      expect(result).toEqual({ valid: false, error: 'This username is reserved' });
    });

    it('rejects reserved word "sharedkitchen"', () => {
      const result = validateHandle('sharedkitchen');
      expect(result).toEqual({ valid: false, error: 'This username is reserved' });
    });

    it('accepts a valid handle', () => {
      const result = validateHandle('good_handle');
      expect(result).toEqual({ valid: true });
    });

    it('accepts minimum length handle (3 chars)', () => {
      const result = validateHandle('abc');
      expect(result).toEqual({ valid: true });
    });

    it('accepts mixed alphanumeric with underscore', () => {
      const result = validateHandle('a2_b3');
      expect(result).toEqual({ valid: true });
    });
  });

  describe('suggestHandle', () => {
    it('normalizes "John Doe" to "johndoe"', () => {
      expect(suggestHandle('John Doe')).toBe('johndoe');
    });

    it('strips non-alphanumeric characters', () => {
      expect(suggestHandle('M@ry-Jane!!')).toBe('mryjane');
    });

    it('returns "user" for empty string', () => {
      expect(suggestHandle('')).toBe('user');
    });

    it('truncates long names to max 15 chars', () => {
      const result = suggestHandle('AVeryLongDisplayNameThatExceedsLimit');
      expect(result.length).toBeLessThanOrEqual(15);
    });
  });

  describe('suggestAlternatives', () => {
    it('returns array of 3 strings starting with base', () => {
      const results = suggestAlternatives('john');
      expect(results).toHaveLength(3);
      results.forEach((alt) => {
        expect(alt).toMatch(/^john/);
      });
    });
  });

  describe('PROFILE_SELECT', () => {
    it('equals "id, display_name, avatar_url, handle"', () => {
      expect(PROFILE_SELECT).toBe('id, display_name, avatar_url, handle');
    });
  });

  describe('RESERVED_WORDS', () => {
    it('includes admin, support, sharedkitchen, help, system', () => {
      expect(RESERVED_WORDS).toContain('admin');
      expect(RESERVED_WORDS).toContain('support');
      expect(RESERVED_WORDS).toContain('sharedkitchen');
      expect(RESERVED_WORDS).toContain('help');
      expect(RESERVED_WORDS).toContain('system');
    });
  });
});
