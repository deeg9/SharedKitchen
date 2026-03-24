/**
 * Default food images from Unsplash (free, no attribution required).
 * Used as placeholders when recipes don't have user-uploaded images.
 */
import { MealType } from '../types/database';

const UNSPLASH_BASE = 'https://images.unsplash.com';

/** Meal-type-specific placeholder images */
const MEAL_TYPE_IMAGES: Record<MealType, string[]> = {
  breakfast: [
    `${UNSPLASH_BASE}/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop`, // eggs benedict
    `${UNSPLASH_BASE}/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop`, // pancakes
    `${UNSPLASH_BASE}/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop`, // smoothie bowl
  ],
  lunch: [
    `${UNSPLASH_BASE}/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop`, // salad
    `${UNSPLASH_BASE}/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop`, // sandwich
    `${UNSPLASH_BASE}/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop`, // soup
  ],
  dinner: [
    `${UNSPLASH_BASE}/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop`, // pasta
    `${UNSPLASH_BASE}/photo-1544025162-d76694265947?w=400&h=300&fit=crop`, // grilled meat
    `${UNSPLASH_BASE}/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop`, // stir fry
  ],
};

/** Category-specific images for recipe cards */
const CATEGORY_IMAGES: Record<string, string[]> = {
  mexican: [
    `${UNSPLASH_BASE}/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop`, // tacos
    `${UNSPLASH_BASE}/photo-1534352956036-cd81e27dd615?w=400&h=300&fit=crop`, // burrito bowl
    `${UNSPLASH_BASE}/photo-1582234372722-50d7ccc30ebd?w=400&h=300&fit=crop`, // guacamole
  ],
  italian: [
    `${UNSPLASH_BASE}/photo-1498579150354-977475b7ea0b?w=400&h=300&fit=crop`, // pasta pesto
    `${UNSPLASH_BASE}/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop`, // pizza
    `${UNSPLASH_BASE}/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop`, // risotto
  ],
  asian: [
    `${UNSPLASH_BASE}/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop`, // ramen
    `${UNSPLASH_BASE}/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop`, // curry
    `${UNSPLASH_BASE}/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop`, // sushi
  ],
  seafood: [
    `${UNSPLASH_BASE}/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop`, // salmon
    `${UNSPLASH_BASE}/photo-1565680018434-b513d5e5fd47?w=400&h=300&fit=crop`, // shrimp
    `${UNSPLASH_BASE}/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop`, // fish tacos
  ],
  chicken: [
    `${UNSPLASH_BASE}/photo-1544025162-d76694265947?w=400&h=300&fit=crop`, // grilled
    `${UNSPLASH_BASE}/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop`, // stir fry
  ],
  vegetarian: [
    `${UNSPLASH_BASE}/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop`, // buddha bowl
    `${UNSPLASH_BASE}/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop`, // roasted veggies
    `${UNSPLASH_BASE}/photo-1592417817098-8fd3d9eb14a5?w=400&h=300&fit=crop`, // caprese
  ],
  pasta: [
    `${UNSPLASH_BASE}/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop`, // pasta
    `${UNSPLASH_BASE}/photo-1498579150354-977475b7ea0b?w=400&h=300&fit=crop`, // pesto pasta
  ],
  salads: [
    `${UNSPLASH_BASE}/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop`, // caesar
    `${UNSPLASH_BASE}/photo-1505253716362-afaea1d3d1af?w=400&h=300&fit=crop`, // harvest
    `${UNSPLASH_BASE}/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop`, // greek
  ],
  soups: [
    `${UNSPLASH_BASE}/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop`, // tomato
    `${UNSPLASH_BASE}/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop`, // pho
  ],
  desserts: [
    `${UNSPLASH_BASE}/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop`, // brownies
    `${UNSPLASH_BASE}/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop`, // fruit tart
    `${UNSPLASH_BASE}/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop`, // ice cream
  ],
};

/** Generic food images used as fallback */
const GENERIC_IMAGES = [
  `${UNSPLASH_BASE}/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop`, // plated meal
  `${UNSPLASH_BASE}/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop`, // spread
  `${UNSPLASH_BASE}/photo-1466637574441-749b8f19452f?w=400&h=300&fit=crop`, // ingredients
  `${UNSPLASH_BASE}/photo-1543353071-873f17a7a088?w=400&h=300&fit=crop`, // table
  `${UNSPLASH_BASE}/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop`, // cooking
];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a deterministic placeholder image URL based on a seed string.
 * Uses the seed to always return the same image for the same recipe/slot.
 */
function pickSeeded(arr: string[], seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return arr[Math.abs(hash) % arr.length];
}

/**
 * Get a default food image for a recipe based on its category.
 * Returns a deterministic image based on recipe ID so the same recipe
 * always gets the same placeholder.
 */
export function getDefaultRecipeImage(recipeId: string, category?: string | null): string {
  const key = category?.toLowerCase() ?? '';
  const images = CATEGORY_IMAGES[key] ?? GENERIC_IMAGES;
  return pickSeeded(images, recipeId);
}

/**
 * Get a placeholder image for an empty meal slot.
 */
export function getMealTypePlaceholder(mealType: MealType): string {
  return pickRandom(MEAL_TYPE_IMAGES[mealType]);
}

/**
 * Hero images for onboarding, marketing, etc.
 */
export const HERO_IMAGES = {
  flatLay: `${UNSPLASH_BASE}/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop`,
  ingredients: `${UNSPLASH_BASE}/photo-1466637574441-749b8f19452f?w=800&h=400&fit=crop`,
  cooking: `${UNSPLASH_BASE}/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop`,
  platedMeal: `${UNSPLASH_BASE}/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop`,
  tableSpread: `${UNSPLASH_BASE}/photo-1543353071-873f17a7a088?w=800&h=400&fit=crop`,
};
