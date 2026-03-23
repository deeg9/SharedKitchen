import { Recipe, RecipeRating, MealPlanWithRecipe } from '../types/database';

export interface Suggestion {
  recipeId: string;
  recipeName: string;
  message: string;
  daysSinceLastCooked: number;
  rating: number;
}

/**
 * Generate meal suggestions based on cooking history and ratings.
 * Pure function -- no side effects, fully testable.
 *
 * Logic:
 * - Find recipes rated 4+ stars
 * - Check when each was last cooked (from mealPlans)
 * - If not cooked in 3+ weeks (21 days), generate a suggestion
 * - Exclude recipes cooked within the last 2 weeks (14 days)
 * - Return max 3 suggestions, sorted by daysSinceLastCooked descending
 */
export function generateSuggestions(
  recipes: Recipe[],
  mealPlans: MealPlanWithRecipe[],
  ratings: RecipeRating[]
): Suggestion[] {
  if (recipes.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a map of recipe_id -> highest rating
  const ratingMap = new Map<string, number>();
  ratings.forEach((r) => {
    if (r.rating !== null) {
      const existing = ratingMap.get(r.recipe_id) ?? 0;
      if (r.rating > existing) {
        ratingMap.set(r.recipe_id, r.rating);
      }
    }
  });

  // Build a map of recipe_id -> most recent plan_date
  const lastCookedMap = new Map<string, Date>();
  mealPlans.forEach((mp) => {
    if (mp.recipe_id) {
      const planDate = new Date(mp.plan_date + 'T00:00:00');
      const existing = lastCookedMap.get(mp.recipe_id);
      if (!existing || planDate > existing) {
        lastCookedMap.set(mp.recipe_id, planDate);
      }
    }
  });

  const suggestions: Suggestion[] = [];

  for (const recipe of recipes) {
    const rating = ratingMap.get(recipe.id);
    if (!rating || rating < 4) continue;

    const lastCooked = lastCookedMap.get(recipe.id);
    if (!lastCooked) continue; // Never cooked -- no "haven't made in a while" suggestion

    const diffMs = today.getTime() - lastCooked.getTime();
    const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Exclude if cooked within last 2 weeks
    if (daysSince < 14) continue;

    // Only suggest if 3+ weeks since last cooked
    if (daysSince < 21) continue;

    const weeks = Math.floor(daysSince / 7);
    suggestions.push({
      recipeId: recipe.id,
      recipeName: recipe.name,
      message: `You haven't made ${recipe.name} in ${weeks} weeks — it's a ${rating}-star favorite!`,
      daysSinceLastCooked: daysSince,
      rating,
    });
  }

  // Sort by daysSinceLastCooked descending, take top 3
  suggestions.sort((a, b) => b.daysSinceLastCooked - a.daysSinceLastCooked);
  return suggestions.slice(0, 3);
}
