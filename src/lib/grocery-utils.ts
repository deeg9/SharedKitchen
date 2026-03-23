import { Ingredient, GroceryItem, GroceryItemInsert, GrocerySummary } from '../types/database';

/** Recipes with ingredients for aggregation */
interface RecipeWithIngredients {
  id: string;
  ingredients: Ingredient[];
}

/** Keyword-to-section mapping for inferring grocery store sections */
const SECTION_KEYWORDS: Record<string, string[]> = {
  Proteins: [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'fish', 'salmon', 'tuna',
    'shrimp', 'tofu', 'tempeh', 'sausage', 'bacon', 'steak', 'meat',
    'ground', 'thigh', 'breast', 'wing', 'drumstick', 'tenderloin',
  ],
  Produce: [
    'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'pepper',
    'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'cucumber',
    'zucchini', 'mushroom', 'corn', 'avocado', 'lemon', 'lime', 'orange',
    'apple', 'banana', 'berry', 'ginger', 'cilantro', 'parsley', 'basil',
    'mint', 'jalapeno', 'scallion', 'cabbage', 'squash', 'eggplant',
  ],
  'Dairy & Eggs': [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'eggs',
    'sour cream', 'mozzarella', 'parmesan', 'cheddar', 'ricotta',
    'whipped cream', 'half and half', 'cottage cheese',
  ],
  Pantry: [
    'flour', 'sugar', 'salt', 'pepper', 'oil', 'olive oil', 'vinegar',
    'soy sauce', 'rice', 'pasta', 'noodle', 'bread', 'tortilla',
    'can', 'broth', 'stock', 'sauce', 'ketchup', 'mustard', 'mayo',
    'honey', 'syrup', 'vanilla', 'baking', 'yeast', 'cornstarch',
    'spice', 'cumin', 'paprika', 'oregano', 'thyme', 'cinnamon',
    'cocoa', 'chocolate', 'bean', 'lentil', 'chickpea', 'oat',
    'cereal', 'peanut butter', 'jam', 'jelly',
  ],
};

/**
 * Infer the grocery store section for an ingredient name.
 * Checks ingredient name (case-insensitive) against keyword lists.
 */
export function inferSection(name: string): string {
  const lower = name.toLowerCase();
  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return section;
      }
    }
  }
  return 'Other';
}

/**
 * Aggregate ingredients across multiple recipes.
 * Merges same-name + same-unit ingredients by summing amounts.
 * Different units for the same ingredient remain separate.
 */
export function aggregateIngredients(
  recipes: RecipeWithIngredients[]
): GroceryItemInsert[] {
  if (recipes.length === 0) return [];

  // Key: "name|unit" (lowercase)
  const merged = new Map<
    string,
    { name: string; amount: number; unit: string; section: string; sourceRecipeId: string }
  >();

  for (const recipe of recipes) {
    if (!recipe.ingredients) continue;
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`;
      const existing = merged.get(key);
      if (existing) {
        existing.amount += ing.amount || 0;
      } else {
        merged.set(key, {
          name: ing.name,
          amount: ing.amount || 0,
          unit: ing.unit || '',
          section: ing.section || inferSection(ing.name),
          sourceRecipeId: recipe.id,
        });
      }
    }
  }

  return Array.from(merged.values()).map((item) => {
    const quantityParts = [];
    if (item.amount > 0) quantityParts.push(String(item.amount));
    if (item.unit) quantityParts.push(item.unit);

    return {
      name: item.name,
      quantity: quantityParts.join(' ') || null,
      section: item.section as GroceryItemInsert['section'],
      source_recipe_id: item.sourceRecipeId,
      is_manual: false,
    };
  });
}

/**
 * Compute summary statistics for a grocery list.
 */
export function computeSummary(items: GroceryItem[]): GrocerySummary {
  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.is_checked).length;
  const estimatedTotal = items.reduce(
    (sum, i) => sum + (i.estimated_price ?? 0),
    0
  );
  const progressPercent = totalItems > 0
    ? Math.round((checkedItems / totalItems) * 100)
    : 0;

  return { totalItems, checkedItems, estimatedTotal, progressPercent };
}

/**
 * Group grocery items by their store section.
 */
export function groupBySection(
  items: GroceryItem[]
): Record<string, GroceryItem[]> {
  const grouped: Record<string, GroceryItem[]> = {};
  for (const item of items) {
    const section = item.section || 'Other';
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(item);
  }
  return grouped;
}
