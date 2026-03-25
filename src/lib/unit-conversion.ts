/**
 * Unit conversion utilities for cooking measurements.
 * Handles metric/imperial conversion for ingredients and instruction text.
 */
import { Ingredient } from '../types/database';

export type UnitSystem = 'metric' | 'imperial';

interface ConversionEntry {
  to: string;
  factor: number;
  system: 'metric' | 'imperial';
}

/**
 * Conversion map: key is the source unit, value describes how to convert.
 * `system` indicates which system the source unit belongs to.
 * `to` is the target unit in the opposite system.
 * `factor` is the multiplier: amount * factor = converted amount.
 */
const CONVERSIONS: Record<string, ConversionEntry> = {
  // Imperial units -> metric
  cup: { to: 'ml', factor: 236.588, system: 'imperial' },
  cups: { to: 'ml', factor: 236.588, system: 'imperial' },
  tbsp: { to: 'ml', factor: 14.787, system: 'imperial' },
  tsp: { to: 'ml', factor: 4.929, system: 'imperial' },
  oz: { to: 'g', factor: 28.3495, system: 'imperial' },
  lb: { to: 'g', factor: 453.592, system: 'imperial' },
  lbs: { to: 'g', factor: 453.592, system: 'imperial' },
  // Metric units -> imperial
  ml: { to: 'fl oz', factor: 0.033814, system: 'metric' },
  g: { to: 'oz', factor: 0.035274, system: 'metric' },
  kg: { to: 'lb', factor: 2.20462, system: 'metric' },
  l: { to: 'qt', factor: 1.05669, system: 'metric' },
};

/**
 * Smart rounding: adjusts precision based on magnitude.
 * >= 100: integer, >= 10: 1 decimal, < 10: 1 decimal, < 1: 2 decimals
 */
export function smartRound(n: number): number {
  if (n >= 100) return Math.round(n);
  if (n >= 10) return Math.round(n * 10) / 10;
  if (n >= 1) return Math.round(n * 10) / 10;
  return Math.round(n * 100) / 100;
}

/**
 * Convert an amount from one unit to another system.
 * Returns unchanged if unit is unknown or already in target system.
 */
export function convertUnit(
  amount: number,
  unit: string,
  to: UnitSystem
): { amount: number; unit: string } {
  const key = unit.toLowerCase();
  const entry = CONVERSIONS[key];

  if (!entry) {
    return { amount, unit };
  }

  // Already in target system
  if (entry.system === to) {
    return { amount, unit };
  }

  const converted = amount * entry.factor;
  return { amount: smartRound(converted), unit: entry.to };
}

/**
 * Convert an Ingredient to the target unit system.
 */
export function convertIngredient(ingredient: Ingredient, to: UnitSystem): Ingredient {
  const { amount, unit } = convertUnit(ingredient.amount, ingredient.unit, to);
  return { ...ingredient, amount, unit };
}

/**
 * Convert measurements in instruction text via regex replacement.
 * Handles unit measurements (e.g., "2 cups" -> "473 ml") and
 * temperatures (e.g., "350F" -> "177C").
 */
export function convertInstructionText(text: string, to: UnitSystem): string {
  if (to === 'imperial') {
    // Convert metric units in text to imperial
    let result = text;

    // Convert metric measurements
    result = result.replace(
      /(\d+\.?\d*)\s*(ml|g|kg|l)\b/gi,
      (_match, amt, unit) => {
        const { amount: converted, unit: newUnit } = convertUnit(parseFloat(amt), unit.toLowerCase(), 'imperial');
        return `${converted} ${newUnit}`;
      }
    );

    // Convert Celsius to Fahrenheit
    result = result.replace(
      /(\d+)\s*[\u00B0]?C\b/g,
      (_match, temp) => {
        const f = Math.round(parseFloat(temp) * 9 / 5 + 32);
        return `${f}F`;
      }
    );

    return result;
  }

  // Convert to metric
  let result = text;

  // Convert imperial measurements
  result = result.replace(
    /(\d+\.?\d*)\s*(cups?|tbsp|tsp|oz|lbs?)\b/gi,
    (_match, amt, unit) => {
      const { amount: converted, unit: newUnit } = convertUnit(parseFloat(amt), unit.toLowerCase(), 'metric');
      return `${converted} ${newUnit}`;
    }
  );

  // Convert Fahrenheit to Celsius
  result = result.replace(
    /(\d+)\s*[\u00B0]?F\b/g,
    (_match, temp) => {
      const c = Math.round((parseFloat(temp) - 32) * 5 / 9);
      return `${c}C`;
    }
  );

  return result;
}
