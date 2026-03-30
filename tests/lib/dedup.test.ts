import { normalizeName, findDuplicates } from '../../src/lib/dedup';
import { ScannedItem } from '../../src/types/scan';

describe('dedup', () => {
  describe('normalizeName', () => {
    it('lowercases, trims, strips punctuation, collapses whitespace', () => {
      expect(normalizeName(' Hello, World!! ')).toBe('hello world');
    });

    it('lowercases already uppercase text', () => {
      expect(normalizeName('EGGS')).toBe('eggs');
    });

    it('handles empty string', () => {
      expect(normalizeName('')).toBe('');
    });

    it('handles already normalized text', () => {
      expect(normalizeName('milk')).toBe('milk');
    });

    it('strips percent sign and collapses whitespace', () => {
      expect(normalizeName('milk  2%')).toBe('milk 2');
    });
  });

  describe('findDuplicates', () => {
    const makeScannedItem = (overrides: Partial<ScannedItem>): ScannedItem => ({
      id: 'scan-1',
      name: 'Item',
      quantity: '1',
      category: 'Other',
      brand: null,
      duplicateOfId: null,
      duplicateOfName: null,
      ...overrides,
    });

    it('marks exact name match as duplicate', () => {
      const scanned = [makeScannedItem({ id: 's1', name: 'Eggs' })];
      const existing = [{ id: 'p1', name: 'eggs' }] as any[];

      const result = findDuplicates(scanned, existing);
      expect(result[0].duplicateOfId).toBe('p1');
      expect(result[0].duplicateOfName).toBe('eggs');
    });

    it('marks substring match (scanned name contained in existing)', () => {
      const scanned = [makeScannedItem({ id: 's1', name: 'Yogurt' })];
      const existing = [{ id: 'p2', name: 'Greek Yogurt' }] as any[];

      const result = findDuplicates(scanned, existing);
      expect(result[0].duplicateOfId).toBe('p2');
    });

    it('marks substring match (existing name contained in scanned)', () => {
      const scanned = [makeScannedItem({ id: 's1', name: 'Greek Yogurt' })];
      const existing = [{ id: 'p2', name: 'yogurt' }] as any[];

      const result = findDuplicates(scanned, existing);
      expect(result[0].duplicateOfId).toBe('p2');
    });

    it('leaves non-matching items untouched', () => {
      const scanned = [makeScannedItem({ id: 's1', name: 'Butter' })];
      const existing = [{ id: 'p1', name: 'Milk' }] as any[];

      const result = findDuplicates(scanned, existing);
      expect(result[0].duplicateOfId).toBeNull();
      expect(result[0].duplicateOfName).toBeNull();
    });
  });
});
