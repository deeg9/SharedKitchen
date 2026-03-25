/**
 * JSON-LD extraction and schema.org Recipe mapping utilities.
 *
 * Used to extract structured recipe data from web pages before falling back
 * to LLM-based extraction. Most recipe sites embed JSON-LD structured data
 * following the schema.org Recipe specification.
 */

import type { Ingredient, InstructionStep, NutritionInfo, RecipeInsert } from '../types/database';

// --- Schema.org Types ---

export interface SchemaOrgNutrition {
  '@type'?: string;
  calories?: string;
  proteinContent?: string;
  fatContent?: string;
  carbohydrateContent?: string;
  fiberContent?: string;
  sodiumContent?: string;
  sugarContent?: string;
}

export interface HowToStep {
  '@type': string;
  text: string;
  name?: string;
  url?: string;
  image?: string;
  duration?: string;
}

export interface HowToSection {
  '@type': string;
  name?: string;
  itemListElement: HowToStep[];
}

export interface SchemaOrgRecipe {
  '@type': 'Recipe' | string;
  name?: string;
  image?: string | string[] | Array<{ url: string }>;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string | number;
  recipeCategory?: string | string[];
  recipeIngredient?: string[];
  recipeInstructions?: string | string[] | HowToStep[] | HowToSection[];
  nutrition?: SchemaOrgNutrition;
  keywords?: string | string[];
  description?: string;
}

// --- Core Functions ---

/**
 * Extract JSON-LD Recipe data from HTML.
 * Finds all <script type="application/ld+json"> tags, parses them,
 * and recursively searches for a @type: Recipe object.
 */
export function extractJsonLd(html: string): SchemaOrgRecipe | null {
  if (!html) return null;

  const scriptRegex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const recipes = findRecipeObjects(data);
      if (recipes.length > 0) {
        return recipes[0];
      }
    } catch {
      // Invalid JSON, skip this tag
    }
  }

  return null;
}

/**
 * Recursively search for Recipe objects in JSON-LD data.
 * Handles arrays, @graph arrays, and single objects.
 */
export function findRecipeObjects(data: any): SchemaOrgRecipe[] {
  if (!data || typeof data !== 'object') return [];

  const results: SchemaOrgRecipe[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      results.push(...findRecipeObjects(item));
    }
    return results;
  }

  // Check if this object is a Recipe
  if (data['@type'] === 'Recipe') {
    results.push(data as SchemaOrgRecipe);
    return results;
  }

  // Check @graph array
  if (Array.isArray(data['@graph'])) {
    results.push(...findRecipeObjects(data['@graph']));
  }

  return results;
}

/**
 * Parse ISO 8601 duration string (e.g., PT30M, PT1H15M, PT45S) to seconds.
 * Returns 0 for invalid or unparseable input.
 */
export function parseIsoDuration(iso: string): number {
  if (!iso || typeof iso !== 'string') return 0;

  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Extract a single image URL from schema.org image field.
 * Handles string, string[], and Array<{url: string}> formats.
 */
export function extractImageUrl(
  image: string | string[] | Array<{ url: string }> | undefined | null
): string | null {
  if (!image) return null;

  if (typeof image === 'string') return image;

  if (Array.isArray(image)) {
    if (image.length === 0) return null;
    const first = image[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) return first.url;
  }

  return null;
}

/**
 * Parse schema.org ingredient strings into structured Ingredient objects.
 * Uses regex to extract amount, unit, and name from strings like "2 cups flour".
 */
export function parseSchemaIngredients(ingredients: string[]): Ingredient[] {
  if (!ingredients || !Array.isArray(ingredients)) return [];

  const unitPattern =
    /^([\d./\s]+)?\s*(cups?|tbsp|tsp|oz|lbs?|g|kg|ml|l|cloves?|pieces?|slices?|whole|pinch|dash|bunch|can|cans|package|packages|stalks?|heads?|medium|large|small)?\s*(.+)$/i;

  return ingredients.map((text) => {
    const trimmed = text.trim();
    const match = trimmed.match(unitPattern);

    if (!match) {
      return { amount: 1, unit: '', name: trimmed };
    }

    const rawAmount = match[1]?.trim();
    const unit = match[2]?.trim() || '';
    const name = match[3]?.trim() || trimmed;

    let amount = 1;
    if (rawAmount) {
      // Handle fractions like "1/2"
      if (rawAmount.includes('/')) {
        const parts = rawAmount.split('/');
        amount = parseFloat(parts[0]) / parseFloat(parts[1]);
      } else {
        const parsed = parseFloat(rawAmount);
        if (!isNaN(parsed)) amount = parsed;
      }
    }

    return { amount, unit, name };
  });
}

/**
 * Parse schema.org recipeInstructions into InstructionStep[].
 * Handles: plain string, string[], HowToStep[], HowToSection[].
 */
export function parseSchemaInstructions(
  instructions: string | string[] | HowToStep[] | HowToSection[] | undefined
): InstructionStep[] {
  if (!instructions) return [];

  // Plain string: split on sentences or return as single step
  if (typeof instructions === 'string') {
    const sentences = instructions
      .split(/(?<=\.)\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return sentences.map((text, i) => ({
      step_number: i + 1,
      text,
    }));
  }

  if (!Array.isArray(instructions) || instructions.length === 0) return [];

  // Array of strings
  if (typeof instructions[0] === 'string') {
    return (instructions as string[]).map((text, i) => ({
      step_number: i + 1,
      text: text.trim(),
    }));
  }

  // HowToStep[] or HowToSection[]
  const steps: InstructionStep[] = [];
  let stepNum = 1;

  for (const item of instructions as (HowToStep | HowToSection)[]) {
    if (item['@type'] === 'HowToSection') {
      const section = item as HowToSection;
      if (Array.isArray(section.itemListElement)) {
        for (const subStep of section.itemListElement) {
          const step: InstructionStep = {
            step_number: stepNum++,
            text: subStep.text || subStep.name || '',
          };
          if (subStep.duration) {
            const durationSeconds = parseIsoDuration(subStep.duration);
            if (durationSeconds > 0) {
              step.timers = [
                {
                  duration_seconds: durationSeconds,
                  label: subStep.name || subStep.text || 'Timer',
                },
              ];
            }
          }
          steps.push(step);
        }
      }
    } else {
      // HowToStep
      const howToStep = item as HowToStep;
      const step: InstructionStep = {
        step_number: stepNum++,
        text: howToStep.text || howToStep.name || '',
      };
      if (howToStep.duration) {
        const durationSeconds = parseIsoDuration(howToStep.duration);
        if (durationSeconds > 0) {
          step.timers = [
            {
              duration_seconds: durationSeconds,
              label: howToStep.name || howToStep.text || 'Timer',
            },
          ];
        }
      }
      steps.push(step);
    }
  }

  return steps;
}

/**
 * Map schema.org NutritionInformation to app NutritionInfo type.
 */
export function mapNutrition(
  nutrition: SchemaOrgNutrition | undefined | null
): NutritionInfo | null {
  if (!nutrition) return null;

  return {
    calories: nutrition.calories || undefined,
    protein: nutrition.proteinContent || undefined,
    fat: nutrition.fatContent || undefined,
    carbohydrates: nutrition.carbohydrateContent || undefined,
    fiber: nutrition.fiberContent || undefined,
    sodium: nutrition.sodiumContent || undefined,
    sugar: nutrition.sugarContent || undefined,
  };
}

/**
 * Map a schema.org Recipe object to a Partial<RecipeInsert>.
 * Full field mapping including nutrition_info, source_image_url, and timer data.
 */
export function mapSchemaOrgToRecipe(schema: SchemaOrgRecipe): Partial<RecipeInsert> {
  const imageUrl = extractImageUrl(schema.image);
  const ingredients = parseSchemaIngredients(schema.recipeIngredient || []);
  const instructions = parseSchemaInstructions(schema.recipeInstructions);
  const nutritionInfo = mapNutrition(schema.nutrition);

  // Parse servings from recipeYield (e.g., "4 servings", "4", 4)
  let servings = 4; // default
  if (schema.recipeYield) {
    if (typeof schema.recipeYield === 'number') {
      servings = schema.recipeYield;
    } else {
      const servingsMatch = schema.recipeYield.match(/(\d+)/);
      if (servingsMatch) {
        servings = parseInt(servingsMatch[1], 10);
      }
    }
  }

  // Parse category
  let category: string | null = null;
  if (schema.recipeCategory) {
    category = Array.isArray(schema.recipeCategory)
      ? schema.recipeCategory[0] || null
      : schema.recipeCategory;
  }

  // Parse times (ISO 8601 duration to minutes)
  const prepTimeSeconds = parseIsoDuration(schema.prepTime || '');
  const cookTimeSeconds = parseIsoDuration(schema.cookTime || '');

  // Parse tags from keywords
  let tags: string[] = [];
  if (schema.keywords) {
    if (typeof schema.keywords === 'string') {
      tags = schema.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    } else if (Array.isArray(schema.keywords)) {
      tags = schema.keywords;
    }
  }

  return {
    name: schema.name || 'Untitled Recipe',
    category,
    prep_time_minutes: prepTimeSeconds > 0 ? Math.round(prepTimeSeconds / 60) : null,
    cook_time_minutes: cookTimeSeconds > 0 ? Math.round(cookTimeSeconds / 60) : null,
    servings,
    ingredients,
    instructions,
    tags,
    source_image_url: imageUrl,
    nutrition_info: nutritionInfo,
  };
}
