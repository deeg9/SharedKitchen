import { buildMealPrompt, parseMealSuggestions, MealSuggestion } from '../../src/lib/ai';

describe('meal-generator', () => {
  describe('buildMealPrompt', () => {
    it('includes leftover items by name when provided', () => {
      const prompt = buildMealPrompt({
        leftovers: [
          { name: 'Chicken breast', portions: 2, use_by_date: '2026-03-27' },
          { name: 'Rice', portions: 1, use_by_date: '2026-03-28' },
        ],
        dietaryPreferences: [],
        recentMeals: [],
        remainingBudget: null,
      });

      expect(prompt).toContain('Chicken breast');
      expect(prompt).toContain('Rice');
    });

    it('includes dietary preferences in the prompt', () => {
      const prompt = buildMealPrompt({
        leftovers: [],
        dietaryPreferences: ['Vegetarian', 'Gluten-Free'],
        recentMeals: [],
        remainingBudget: null,
      });

      expect(prompt).toContain('Vegetarian');
      expect(prompt).toContain('Gluten-Free');
    });

    it('includes remaining budget constraint', () => {
      const prompt = buildMealPrompt({
        leftovers: [],
        dietaryPreferences: [],
        recentMeals: [],
        remainingBudget: 150,
      });

      expect(prompt).toContain('150');
      expect(prompt.toLowerCase()).toContain('budget');
    });

    it('instructs AI to avoid recent meals', () => {
      const prompt = buildMealPrompt({
        leftovers: [],
        dietaryPreferences: [],
        recentMeals: ['Spaghetti Bolognese', 'Chicken Stir Fry'],
        remainingBudget: null,
      });

      expect(prompt).toContain('Spaghetti Bolognese');
      expect(prompt).toContain('Chicken Stir Fry');
      expect(prompt.toLowerCase()).toContain('avoid');
    });

    it('handles empty context gracefully', () => {
      const prompt = buildMealPrompt({
        leftovers: [],
        dietaryPreferences: [],
        recentMeals: [],
        remainingBudget: null,
      });

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('parseMealSuggestions', () => {
    it('extracts 3 suggestions from structured response', () => {
      const response = {
        suggestions: [
          {
            name: 'Leftover Chicken Fried Rice',
            description: 'Transform leftover chicken and rice into a quick stir-fry',
            estimated_cost: 5,
            prep_time_minutes: 20,
            uses_leftovers: true,
            leftover_items: ['Chicken breast', 'Rice'],
          },
          {
            name: 'Vegetable Pasta Primavera',
            description: 'Light and fresh pasta with seasonal vegetables',
            estimated_cost: 12,
            prep_time_minutes: 30,
            uses_leftovers: false,
            leftover_items: [],
          },
          {
            name: 'Black Bean Tacos',
            description: 'Quick and easy tacos with homemade black bean filling',
            estimated_cost: 8,
            prep_time_minutes: 25,
            uses_leftovers: false,
            leftover_items: [],
          },
        ],
      };

      const suggestions = parseMealSuggestions(response);

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].name).toBe('Leftover Chicken Fried Rice');
      expect(suggestions[0].uses_leftovers).toBe(true);
      expect(suggestions[0].leftover_items).toEqual(['Chicken breast', 'Rice']);
    });

    it('each suggestion has required fields', () => {
      const response = {
        suggestions: [
          {
            name: 'Test Meal',
            description: 'A test description',
            estimated_cost: 10,
            prep_time_minutes: 15,
            uses_leftovers: false,
            leftover_items: [],
          },
        ],
      };

      const suggestions = parseMealSuggestions(response);
      const s = suggestions[0];

      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('description');
      expect(s).toHaveProperty('estimated_cost');
      expect(s).toHaveProperty('prep_time_minutes');
      expect(s).toHaveProperty('uses_leftovers');
      expect(s).toHaveProperty('leftover_items');
    });

    it('handles null cost and prep time', () => {
      const response = {
        suggestions: [
          {
            name: 'Mystery Meal',
            description: 'Something delicious',
            estimated_cost: null,
            prep_time_minutes: null,
            uses_leftovers: false,
            leftover_items: [],
          },
        ],
      };

      const suggestions = parseMealSuggestions(response);
      expect(suggestions[0].estimated_cost).toBeNull();
      expect(suggestions[0].prep_time_minutes).toBeNull();
    });

    it('returns empty array for malformed response', () => {
      const suggestions = parseMealSuggestions({});
      expect(suggestions).toEqual([]);
    });
  });
});
