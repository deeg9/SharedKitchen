import {
  convertUnit,
  convertInstructionText,
  convertIngredient,
  smartRound,
  UnitSystem,
} from '../../src/lib/unit-conversion';

describe('unit-conversion', () => {
  describe('smartRound', () => {
    it('rounds >= 100 to integer', () => {
      expect(smartRound(236.588)).toBe(237);
    });

    it('rounds >= 10 to 1 decimal', () => {
      expect(smartRound(16.907)).toBe(16.9);
    });

    it('rounds < 10 to 1 decimal', () => {
      expect(smartRound(2.204)).toBe(2.2);
    });

    it('rounds < 1 to 2 decimals', () => {
      expect(smartRound(0.453)).toBe(0.45);
    });

    it('keeps 0.5 as 0.5', () => {
      expect(smartRound(0.5)).toBe(0.5);
    });
  });

  describe('convertUnit', () => {
    // Imperial to metric
    it('converts cup to ml', () => {
      expect(convertUnit(1, 'cup', 'metric')).toEqual({ amount: 237, unit: 'ml' });
    });

    it('converts lb to g', () => {
      expect(convertUnit(1, 'lb', 'metric')).toEqual({ amount: 454, unit: 'g' });
    });

    it('converts tbsp to ml', () => {
      expect(convertUnit(1, 'tbsp', 'metric')).toEqual({ amount: 15, unit: 'ml' });
    });

    it('converts tsp to ml', () => {
      expect(convertUnit(1, 'tsp', 'metric')).toEqual({ amount: 5, unit: 'ml' });
    });

    it('converts oz to g', () => {
      expect(convertUnit(1, 'oz', 'metric')).toEqual({ amount: 28, unit: 'g' });
    });

    // Metric to imperial
    it('converts ml to fl oz', () => {
      expect(convertUnit(500, 'ml', 'imperial')).toEqual({ amount: 16.9, unit: 'fl oz' });
    });

    it('converts kg to lb', () => {
      expect(convertUnit(1, 'kg', 'imperial')).toEqual({ amount: 2.2, unit: 'lb' });
    });

    // Edge cases
    it('returns same for unknown unit', () => {
      expect(convertUnit(3, 'pinch', 'metric')).toEqual({ amount: 3, unit: 'pinch' });
    });

    it('returns same if already in target system (metric unit to metric)', () => {
      expect(convertUnit(500, 'ml', 'metric')).toEqual({ amount: 500, unit: 'ml' });
    });

    it('returns same if already in target system (imperial unit to imperial)', () => {
      expect(convertUnit(2, 'cup', 'imperial')).toEqual({ amount: 2, unit: 'cup' });
    });
  });

  describe('convertIngredient', () => {
    it('converts an ingredient to metric', () => {
      const result = convertIngredient({ amount: 2, unit: 'cups', name: 'flour' }, 'metric');
      expect(result.unit).toBe('ml');
      expect(result.amount).toBe(473);
      expect(result.name).toBe('flour');
    });

    it('leaves unknown units unchanged', () => {
      const result = convertIngredient({ amount: 1, unit: 'bunch', name: 'parsley' }, 'metric');
      expect(result).toEqual({ amount: 1, unit: 'bunch', name: 'parsley' });
    });
  });

  describe('convertInstructionText', () => {
    it('converts "2 cups" to metric ml', () => {
      expect(convertInstructionText('Add 2 cups of flour', 'metric')).toBe('Add 473 ml of flour');
    });

    it('converts temperature F to C', () => {
      expect(convertInstructionText('Bake at 350F', 'metric')).toBe('Bake at 177C');
    });

    it('converts temperature with degree symbol', () => {
      expect(convertInstructionText('Preheat to 400\u00B0F', 'metric')).toBe('Preheat to 204C');
    });

    it('leaves text unchanged if no recognized units', () => {
      expect(convertInstructionText('Stir well for a few minutes', 'metric')).toBe('Stir well for a few minutes');
    });

    it('handles multiple conversions in one string', () => {
      const result = convertInstructionText('Mix 1 cup flour and 2 tbsp sugar', 'metric');
      expect(result).toBe('Mix 237 ml flour and 30 ml sugar');
    });
  });
});
