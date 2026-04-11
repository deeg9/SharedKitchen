import { generateSuggestions, Suggestion } from '../../src/lib/suggestions';
import { Recipe, RecipeRating, MealPlanWithRecipe } from '../../src/types/database';

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    household_id: 'h1',
    name: 'Spaghetti Bolognese',
    category: 'Italian',
    image_url: null,
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    servings: 4,
    estimated_cost: null,
    ingredients: [],
    instructions: [],
    tags: [],
    source_url: null,
    nutrition_info: null,
    source_image_url: null,
    computed_nutrition: null,
    ingredient_matches: null,
    comment_count: 0,
    saved_from_kitchen_id: null,
    saved_from_recipe_id: null,
    created_by: 'user1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeRating(recipeId: string, rating: number): RecipeRating {
  return {
    id: `rating-${recipeId}`,
    recipe_id: recipeId,
    user_id: 'user1',
    rating,
    is_favorite: false,
    created_at: '2026-01-01T00:00:00Z',
  };
}

function makeMealPlan(recipeId: string, planDate: string): MealPlanWithRecipe {
  return {
    id: `mp-${recipeId}-${planDate}`,
    household_id: 'h1',
    recipe_id: recipeId,
    plan_date: planDate,
    meal_type: 'dinner' as const,
    meal_source: 'home-cooked' as const,
    meal_cost: null,
    assigned_cook: null,
    notes: null,
    created_by: 'user1',
    created_at: '2026-01-01T00:00:00Z',
    recipes: null,
  };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

describe('generateSuggestions', () => {
  it('returns empty array when no recipes exist', () => {
    const result = generateSuggestions([], [], []);
    expect(result).toEqual([]);
  });

  it('returns "haven\'t made X in N weeks" for recipes not cooked in 3+ weeks that are 4+ star rated', () => {
    const recipe = makeRecipe({ id: 'r1', name: 'Spaghetti Bolognese' });
    const rating = makeRating('r1', 5);
    const mealPlan = makeMealPlan('r1', daysAgo(28)); // 4 weeks ago

    const result = generateSuggestions([recipe], [mealPlan], [rating]);

    expect(result.length).toBe(1);
    expect(result[0].recipeId).toBe('r1');
    expect(result[0].recipeName).toBe('Spaghetti Bolognese');
    expect(result[0].message).toContain("haven't made");
    expect(result[0].message).toContain('weeks');
    expect(result[0].rating).toBe(5);
  });

  it('returns max 3 suggestions sorted by days-since-last-cooked descending', () => {
    const recipes = [
      makeRecipe({ id: 'r1', name: 'Dish A' }),
      makeRecipe({ id: 'r2', name: 'Dish B' }),
      makeRecipe({ id: 'r3', name: 'Dish C' }),
      makeRecipe({ id: 'r4', name: 'Dish D' }),
    ];
    const ratings = [
      makeRating('r1', 5),
      makeRating('r2', 4),
      makeRating('r3', 5),
      makeRating('r4', 4),
    ];
    const mealPlans = [
      makeMealPlan('r1', daysAgo(60)),
      makeMealPlan('r2', daysAgo(30)),
      makeMealPlan('r3', daysAgo(45)),
      makeMealPlan('r4', daysAgo(21)),
    ];

    const result = generateSuggestions(recipes, mealPlans, ratings);

    expect(result.length).toBe(3);
    // Sorted by daysSinceLastCooked descending
    expect(result[0].recipeId).toBe('r1'); // 60 days
    expect(result[1].recipeId).toBe('r3'); // 45 days
    expect(result[2].recipeId).toBe('r2'); // 30 days
  });

  it('excludes recipes cooked within last 2 weeks', () => {
    const recipe = makeRecipe({ id: 'r1', name: 'Recent Dish' });
    const rating = makeRating('r1', 5);
    const mealPlan = makeMealPlan('r1', daysAgo(10)); // 10 days ago (within 2 weeks)

    const result = generateSuggestions([recipe], [mealPlan], [rating]);

    expect(result).toEqual([]);
  });
});
