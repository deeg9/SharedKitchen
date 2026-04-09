import {
  scaleNutrition,
  sumNutrition,
  volumeToGrams,
  convertToGrams,
  extractNutritionSummary,
  isNutritionDataValid,
  FOOD_DENSITIES,
} from '../nutrition-utils';
import type { NutritionData } from '../../types/food';

const sampleNutrition: NutritionData = {
  calories: 250,
  protein_g: 10,
  total_fat_g: 8,
  saturated_fat_g: 3,
  sodium_mg: 500,
  total_carbs_g: 35,
  dietary_fiber_g: 4,
  total_sugars_g: 12,
};

const sampleNutritionB: NutritionData = {
  calories: 100,
  protein_g: 5,
  total_fat_g: 2,
  sodium_mg: 200,
  total_carbs_g: 15,
};

describe('scaleNutrition', () => {
  test('scales nutrition from per-100g to 150g (multiply by 1.5)', () => {
    const result = scaleNutrition(sampleNutrition, 150);
    expect(result.calories).toBe(375);
    expect(result.protein_g).toBe(15);
    expect(result.total_fat_g).toBe(12);
    expect(result.saturated_fat_g).toBe(4.5);
    expect(result.sodium_mg).toBe(750);
    expect(result.total_carbs_g).toBe(52.5);
  });

  test('scales nutrition from per-100g to 50g (multiply by 0.5)', () => {
    const result = scaleNutrition(sampleNutrition, 50);
    expect(result.calories).toBe(125);
    expect(result.protein_g).toBe(5);
    expect(result.total_fat_g).toBe(4);
  });

  test('returns all zeros for 0g serving', () => {
    const result = scaleNutrition(sampleNutrition, 0);
    expect(result.calories).toBe(0);
    expect(result.protein_g).toBe(0);
    expect(result.total_fat_g).toBe(0);
    expect(result.sodium_mg).toBe(0);
    expect(result.total_carbs_g).toBe(0);
  });

  test('caps calories at 900 per 100g for bad data', () => {
    const badData: NutritionData = {
      ...sampleNutrition,
      calories: 1200,
    };
    const result = scaleNutrition(badData, 100);
    expect(result.calories).toBe(900);
  });

  test('only includes optional fields if present in input', () => {
    const result = scaleNutrition(sampleNutritionB, 200);
    expect(result.saturated_fat_g).toBeUndefined();
    expect(result.dietary_fiber_g).toBeUndefined();
  });
});

describe('sumNutrition', () => {
  test('sums two nutrition data objects element-wise', () => {
    const result = sumNutrition([sampleNutrition, sampleNutritionB]);
    expect(result.calories).toBe(350);
    expect(result.protein_g).toBe(15);
    expect(result.total_fat_g).toBe(10);
    expect(result.sodium_mg).toBe(700);
    expect(result.total_carbs_g).toBe(50);
  });

  test('returns all zeros for empty array', () => {
    const result = sumNutrition([]);
    expect(result.calories).toBe(0);
    expect(result.protein_g).toBe(0);
    expect(result.total_fat_g).toBe(0);
    expect(result.sodium_mg).toBe(0);
    expect(result.total_carbs_g).toBe(0);
  });

  test('sums optional fields only where present', () => {
    const result = sumNutrition([sampleNutrition, sampleNutritionB]);
    // sampleNutrition has dietary_fiber_g=4, sampleNutritionB does not
    expect(result.dietary_fiber_g).toBe(4);
  });
});

describe('volumeToGrams', () => {
  test('converts 1 cup all-purpose flour to 120g', () => {
    expect(volumeToGrams('cup', 'all-purpose flour')).toBe(120);
  });

  test('converts 1 cup granulated sugar to 200g', () => {
    expect(volumeToGrams('cup', 'granulated sugar')).toBe(200);
  });

  test('converts 1 tbsp butter to ~14.2g', () => {
    const result = volumeToGrams('tbsp', 'butter');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(14.19, 0);
  });

  test('returns null for unknown food', () => {
    expect(volumeToGrams('cup', 'unknown-food')).toBeNull();
  });

  test('is case-insensitive for food name', () => {
    expect(volumeToGrams('cup', 'All-Purpose Flour')).toBe(120);
  });
});

describe('convertToGrams', () => {
  test('converts 2 oz to 56.7g', () => {
    const result = convertToGrams(2, 'oz');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(56.7, 1);
  });

  test('converts 1 lb to 453.6g', () => {
    const result = convertToGrams(1, 'lb');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(453.6, 0);
  });

  test('converts 100g to 100g', () => {
    expect(convertToGrams(100, 'g')).toBe(100);
  });

  test('converts 1 kg to 1000g', () => {
    expect(convertToGrams(1, 'kg')).toBe(1000);
  });

  test('converts 1 cup milk to 245g (density-based)', () => {
    expect(convertToGrams(1, 'cup', 'milk')).toBeCloseTo(245, 0);
  });

  test('returns null for volume without food name', () => {
    expect(convertToGrams(1, 'cup')).toBeNull();
  });
});

describe('extractNutritionSummary', () => {
  test('extracts the big-6 fields', () => {
    const result = extractNutritionSummary(sampleNutrition);
    expect(result.calories).toBe(250);
    expect(result.protein_g).toBe(10);
    expect(result.total_fat_g).toBe(8);
    expect(result.total_carbs_g).toBe(35);
    expect(result.dietary_fiber_g).toBe(4);
    expect(result.sodium_mg).toBe(500);
  });

  test('defaults dietary_fiber_g to 0 if absent', () => {
    const result = extractNutritionSummary(sampleNutritionB);
    expect(result.dietary_fiber_g).toBe(0);
  });
});

describe('isNutritionDataValid', () => {
  test('returns true for valid nutrition data', () => {
    expect(isNutritionDataValid(sampleNutrition)).toBe(true);
  });

  test('returns false for calories > 900', () => {
    expect(isNutritionDataValid({ ...sampleNutrition, calories: 1000 })).toBe(false);
  });

  test('returns false for negative values', () => {
    expect(isNutritionDataValid({ ...sampleNutrition, calories: -10 })).toBe(false);
  });

  test('returns false for NaN values', () => {
    expect(isNutritionDataValid({ ...sampleNutrition, calories: NaN })).toBe(false);
  });

  test('returns false if macros exceed 100g per 100g', () => {
    expect(isNutritionDataValid({
      ...sampleNutrition,
      protein_g: 50,
      total_fat_g: 30,
      total_carbs_g: 30,
    })).toBe(false);
  });
});

describe('FOOD_DENSITIES', () => {
  test('contains at least 30 entries', () => {
    expect(Object.keys(FOOD_DENSITIES).length).toBeGreaterThanOrEqual(30);
  });

  test('has correct density for flour', () => {
    expect(FOOD_DENSITIES['all-purpose flour']).toBe(120);
  });

  test('has correct density for sugar', () => {
    expect(FOOD_DENSITIES['granulated sugar']).toBe(200);
  });
});
