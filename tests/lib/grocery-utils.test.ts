import {
  aggregateIngredients,
  inferSection,
  computeSummary,
  groupBySection,
} from '../../src/lib/grocery-utils';
import { Ingredient, GroceryItem } from '../../src/types/database';

describe('grocery-utils', () => {
  describe('inferSection', () => {
    it('maps protein keywords to Proteins', () => {
      expect(inferSection('chicken breast')).toBe('Proteins');
      expect(inferSection('ground beef')).toBe('Proteins');
      expect(inferSection('salmon fillet')).toBe('Proteins');
      expect(inferSection('tofu')).toBe('Proteins');
      expect(inferSection('shrimp')).toBe('Proteins');
    });

    it('maps produce keywords to Produce', () => {
      expect(inferSection('onion')).toBe('Produce');
      expect(inferSection('garlic cloves')).toBe('Produce');
      expect(inferSection('tomato')).toBe('Produce');
      expect(inferSection('spinach')).toBe('Produce');
      expect(inferSection('bell pepper')).toBe('Produce');
    });

    it('maps dairy keywords to Dairy & Eggs', () => {
      expect(inferSection('milk')).toBe('Dairy & Eggs');
      expect(inferSection('cheddar cheese')).toBe('Dairy & Eggs');
      expect(inferSection('eggs')).toBe('Dairy & Eggs');
      expect(inferSection('butter')).toBe('Dairy & Eggs');
      expect(inferSection('yogurt')).toBe('Dairy & Eggs');
    });

    it('maps pantry keywords to Pantry', () => {
      expect(inferSection('flour')).toBe('Pantry');
      expect(inferSection('olive oil')).toBe('Pantry');
      expect(inferSection('sugar')).toBe('Pantry');
      expect(inferSection('soy sauce')).toBe('Pantry');
      expect(inferSection('rice')).toBe('Pantry');
    });

    it('returns Other for unknown ingredients', () => {
      expect(inferSection('mystery ingredient')).toBe('Other');
    });
  });

  describe('aggregateIngredients', () => {
    it('merges same-name same-unit ingredients', () => {
      const recipes = [
        {
          id: 'r1',
          ingredients: [
            { amount: 2, unit: 'cups', name: 'flour' },
          ] as Ingredient[],
        },
        {
          id: 'r2',
          ingredients: [
            { amount: 1, unit: 'cups', name: 'flour' },
          ] as Ingredient[],
        },
      ];

      const result = aggregateIngredients(recipes);
      const flourItems = result.filter((i) => i.name === 'flour');
      expect(flourItems).toHaveLength(1);
      expect(flourItems[0].quantity).toBe('3 cups');
    });

    it('keeps different-unit ingredients separate', () => {
      const recipes = [
        {
          id: 'r1',
          ingredients: [
            { amount: 2, unit: 'cups', name: 'flour' },
          ] as Ingredient[],
        },
        {
          id: 'r2',
          ingredients: [
            { amount: 1, unit: 'tbsp', name: 'flour' },
          ] as Ingredient[],
        },
      ];

      const result = aggregateIngredients(recipes);
      const flourItems = result.filter((i) => i.name === 'flour');
      expect(flourItems).toHaveLength(2);
    });

    it('assigns sections via ingredient.section or inferSection fallback', () => {
      const recipes = [
        {
          id: 'r1',
          ingredients: [
            { amount: 1, unit: 'lb', name: 'chicken', section: 'Proteins' },
            { amount: 2, unit: 'cups', name: 'flour' },
          ] as Ingredient[],
        },
      ];

      const result = aggregateIngredients(recipes);
      const chicken = result.find((i) => i.name === 'chicken');
      const flour = result.find((i) => i.name === 'flour');
      expect(chicken?.section).toBe('Proteins');
      expect(flour?.section).toBe('Pantry');
    });

    it('handles empty/null amounts', () => {
      const recipes = [
        {
          id: 'r1',
          ingredients: [
            { amount: 0, unit: '', name: 'salt' },
          ] as Ingredient[],
        },
      ];

      const result = aggregateIngredients(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('salt');
    });

    it('handles empty recipes array', () => {
      const result = aggregateIngredients([]);
      expect(result).toEqual([]);
    });
  });

  describe('computeSummary', () => {
    it('calculates correct totals and progress', () => {
      const items: GroceryItem[] = [
        makeGroceryItem({ id: '1', is_checked: false, estimated_price: 5.0 }),
        makeGroceryItem({ id: '2', is_checked: true, estimated_price: 3.5 }),
        makeGroceryItem({ id: '3', is_checked: true, estimated_price: 2.0 }),
        makeGroceryItem({ id: '4', is_checked: false, estimated_price: null }),
      ];

      const summary = computeSummary(items);
      expect(summary.totalItems).toBe(4);
      expect(summary.checkedItems).toBe(2);
      expect(summary.estimatedTotal).toBe(10.5);
      expect(summary.progressPercent).toBe(50);
    });

    it('handles empty items array', () => {
      const summary = computeSummary([]);
      expect(summary.totalItems).toBe(0);
      expect(summary.checkedItems).toBe(0);
      expect(summary.estimatedTotal).toBe(0);
      expect(summary.progressPercent).toBe(0);
    });
  });

  describe('groupBySection', () => {
    it('groups items correctly by section', () => {
      const items: GroceryItem[] = [
        makeGroceryItem({ id: '1', section: 'Proteins', name: 'chicken' }),
        makeGroceryItem({ id: '2', section: 'Produce', name: 'onion' }),
        makeGroceryItem({ id: '3', section: 'Proteins', name: 'beef' }),
        makeGroceryItem({ id: '4', section: 'Pantry', name: 'flour' }),
      ];

      const grouped = groupBySection(items);
      expect(grouped['Proteins']).toHaveLength(2);
      expect(grouped['Produce']).toHaveLength(1);
      expect(grouped['Pantry']).toHaveLength(1);
    });

    it('handles empty items', () => {
      const grouped = groupBySection([]);
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });
});

function makeGroceryItem(overrides: Partial<GroceryItem> = {}): GroceryItem {
  return {
    id: 'item-1',
    grocery_list_id: 'list-1',
    name: 'test item',
    quantity: '1 cup',
    estimated_price: null,
    section: 'Other',
    is_checked: false,
    checked_by: null,
    checked_at: null,
    is_manual: false,
    source_recipe_id: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
