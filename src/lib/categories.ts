export const CATEGORIES = [
  'Mexican',
  'Italian',
  'Asian',
  'Seafood',
  'Chicken',
  'Pasta',
  'Vegetarian',
  'Vegan',
  'Salads',
  'Soups',
  'Breakfast',
  'Desserts',
  'High Protein',
  'Other',
] as const;

export type RecipeCategory = (typeof CATEGORIES)[number];
