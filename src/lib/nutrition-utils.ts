/**
 * Nutrition computation utilities for v6.0 Food Data Integration.
 *
 * Handles food-specific density conversion (volume -> grams), nutrition
 * scaling from per-100g to arbitrary servings, and ingredient nutrition
 * summing for recipe totals.
 *
 * Complements src/lib/unit-conversion.ts which handles metric/imperial
 * display conversion. This module handles food-science conversions.
 */
import type { NutritionData, NutritionSummaryData } from '../types/food';

// =============================================================================
// Density Tables
// =============================================================================

/**
 * Food-specific densities in grams per cup.
 * Used to convert volume measurements to weight for nutrition computation.
 * Keys are normalized lowercase food names.
 */
export const FOOD_DENSITIES: Record<string, number> = {
  'all-purpose flour': 120,
  'bread flour': 127,
  'whole wheat flour': 120,
  'cake flour': 114,
  'granulated sugar': 200,
  'brown sugar': 220,
  'powdered sugar': 120,
  'butter': 227,
  'vegetable oil': 218,
  'olive oil': 216,
  'coconut oil': 218,
  'whole milk': 245,
  'milk': 245,
  'heavy cream': 238,
  'sour cream': 230,
  'yogurt': 245,
  'water': 237,
  'honey': 340,
  'maple syrup': 312,
  'molasses': 328,
  'peanut butter': 258,
  'rice (uncooked)': 185,
  'rice': 185,
  'oats (rolled)': 80,
  'oats': 80,
  'cornstarch': 128,
  'cocoa powder': 86,
  'baking soda': 220,
  'salt (table)': 292,
  'salt': 292,
  'cheddar cheese (shredded)': 113,
  'parmesan (grated)': 100,
  'cream cheese': 232,
  'mayonnaise': 220,
  'ketchup': 240,
  'soy sauce': 255,
  'chicken broth': 240,
  'tomato sauce': 245,
  'applesauce': 244,
};

/**
 * Volume unit to cups conversion factor.
 */
const VOLUME_TO_CUP_FACTOR: Record<string, number> = {
  cup: 1,
  cups: 1,
  tbsp: 1 / 16,
  tablespoon: 1 / 16,
  tablespoons: 1 / 16,
  tsp: 1 / 48,
  teaspoon: 1 / 48,
  teaspoons: 1 / 48,
  ml: 1 / 236.588,
  l: 1000 / 236.588,
  liter: 1000 / 236.588,
  liters: 1000 / 236.588,
  'fl oz': 1 / 8,
  'fluid ounce': 1 / 8,
  'fluid ounces': 1 / 8,
};

/**
 * Weight unit to grams conversion factor.
 */
const WEIGHT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

// =============================================================================
// Constants
// =============================================================================

/** Maximum plausible calories per 100g (pure fat ~900 kcal/100g) */
const MAX_CALORIES_PER_100G = 900;

// =============================================================================
// Helper
// =============================================================================

/** Round to 1 decimal place */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** All required NutritionData keys */
const REQUIRED_KEYS: (keyof NutritionData)[] = [
  'calories',
  'protein_g',
  'total_fat_g',
  'sodium_mg',
  'total_carbs_g',
];

/** All optional NutritionData keys */
const OPTIONAL_KEYS: (keyof NutritionData)[] = [
  'saturated_fat_g',
  'trans_fat_g',
  'cholesterol_mg',
  'dietary_fiber_g',
  'total_sugars_g',
  'added_sugars_g',
  'vitamin_d_mcg',
  'calcium_mg',
  'iron_mg',
  'potassium_mg',
];

// =============================================================================
// Functions
// =============================================================================

/**
 * Scale nutrition data from per-100g to an arbitrary serving weight.
 * Caps input calories at 900 per 100g to flag bad data.
 * Rounds all values to 1 decimal.
 */
export function scaleNutrition(
  perHundredG: NutritionData,
  servingWeightG: number,
): NutritionData {
  const factor = servingWeightG / 100;

  // Cap calories at 900/100g for sanity
  const cappedCalories = Math.min(perHundredG.calories, MAX_CALORIES_PER_100G);

  const result: NutritionData = {
    calories: round1(cappedCalories * factor),
    protein_g: round1(perHundredG.protein_g * factor),
    total_fat_g: round1(perHundredG.total_fat_g * factor),
    sodium_mg: round1(perHundredG.sodium_mg * factor),
    total_carbs_g: round1(perHundredG.total_carbs_g * factor),
  };

  // Include optional fields only if present in input
  for (const key of OPTIONAL_KEYS) {
    const val = perHundredG[key];
    if (val !== undefined && val !== null) {
      (result as Record<string, number>)[key] = round1(val * factor);
    }
  }

  return result;
}

/**
 * Sum nutrition data across multiple items (e.g., recipe ingredients).
 * Returns zeros for required fields if array is empty.
 * For optional fields, sums only where present in at least one item.
 */
export function sumNutrition(items: NutritionData[]): NutritionData {
  const result: NutritionData = {
    calories: 0,
    protein_g: 0,
    total_fat_g: 0,
    sodium_mg: 0,
    total_carbs_g: 0,
  };

  for (const item of items) {
    for (const key of REQUIRED_KEYS) {
      (result as Record<string, number>)[key] += item[key] as number;
    }
    for (const key of OPTIONAL_KEYS) {
      const val = item[key];
      if (val !== undefined && val !== null) {
        const current = (result as Record<string, number | undefined>)[key];
        (result as Record<string, number>)[key] = (current ?? 0) + val;
      }
    }
  }

  return result;
}

/**
 * Convert a volume measurement to grams using food-specific density.
 * Returns null if food is not in the density table or unit is not a volume unit.
 */
export function volumeToGrams(
  unit: string,
  foodName: string,
): number | null {
  const normalizedUnit = unit.toLowerCase();
  const cupFactor = VOLUME_TO_CUP_FACTOR[normalizedUnit];
  if (cupFactor === undefined) return null;

  const normalizedFood = foodName.toLowerCase();

  // Try exact match first
  let density = FOOD_DENSITIES[normalizedFood];

  // Try partial matching if exact match fails
  if (density === undefined) {
    for (const [key, val] of Object.entries(FOOD_DENSITIES)) {
      if (normalizedFood.includes(key) || key.includes(normalizedFood)) {
        density = val;
        break;
      }
    }
  }

  if (density === undefined) return null;

  return round1(cupFactor * density);
}

/**
 * Unified conversion to grams.
 * Weight units (g, kg, oz, lb) convert directly.
 * Volume units (cup, tbsp, tsp, ml) require a foodName for density lookup.
 * Returns null if conversion cannot be determined.
 */
export function convertToGrams(
  amount: number,
  unit: string,
  foodName?: string,
): number | null {
  const normalizedUnit = unit.toLowerCase();

  // Check weight units first (no density needed)
  const weightFactor = WEIGHT_TO_GRAMS[normalizedUnit];
  if (weightFactor !== undefined) {
    return round1(amount * weightFactor);
  }

  // Check volume units (density needed)
  if (foodName) {
    const gramsPerOneUnit = volumeToGrams(unit, foodName);
    if (gramsPerOneUnit !== null) {
      return round1(amount * gramsPerOneUnit);
    }
  }

  return null;
}

/**
 * Extract the "big 6" nutrition summary from full nutrition data.
 * Defaults dietary_fiber_g to 0 if absent.
 */
export function extractNutritionSummary(
  data: NutritionData,
): NutritionSummaryData {
  return {
    calories: data.calories,
    protein_g: data.protein_g,
    total_fat_g: data.total_fat_g,
    total_carbs_g: data.total_carbs_g,
    dietary_fiber_g: data.dietary_fiber_g ?? 0,
    sodium_mg: data.sodium_mg,
  };
}

/**
 * Validate nutrition data for sanity.
 * Checks: calories 0-900, macros sum <= 100g per 100g, all required fields finite.
 */
export function isNutritionDataValid(data: NutritionData): boolean {
  // All required fields must be finite numbers
  for (const key of REQUIRED_KEYS) {
    const val = data[key];
    if (typeof val !== 'number' || !Number.isFinite(val)) return false;
  }

  // Calories must be 0-900
  if (data.calories < 0 || data.calories > MAX_CALORIES_PER_100G) return false;

  // Required fields must be non-negative
  if (data.protein_g < 0 || data.total_fat_g < 0 || data.total_carbs_g < 0 || data.sodium_mg < 0) {
    return false;
  }

  // Macros should not exceed 100g per 100g (protein + fat + carbs)
  if (data.protein_g + data.total_fat_g + data.total_carbs_g > 100) return false;

  return true;
}
