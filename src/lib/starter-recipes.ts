import { Ingredient, InstructionStep } from '../types/database';

/**
 * Starter recipe data for onboarding step 4.
 * These are added to the user's household when selected during onboarding.
 * household_id and created_by are added at creation time.
 */
export interface StarterRecipe {
  name: string;
  category: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  estimated_cost: number;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  tags: string[];
}

export const STARTER_RECIPES: StarterRecipe[] = [
  {
    name: 'Spring Harvest Salad',
    category: 'Vegetarian',
    prep_time_minutes: 15,
    cook_time_minutes: 0,
    servings: 2,
    estimated_cost: 12,
    ingredients: [
      { amount: 5, unit: 'oz', name: 'mixed greens' },
      { amount: 1, unit: 'cup', name: 'cherry tomatoes', section: 'Produce' },
      { amount: 1, unit: '', name: 'avocado', section: 'Produce' },
      { amount: 0.5, unit: 'cup', name: 'candied walnuts', section: 'Pantry' },
      { amount: 0.25, unit: 'cup', name: 'crumbled goat cheese', section: 'Dairy & Eggs' },
      { amount: 2, unit: 'tbsp', name: 'balsamic vinaigrette', section: 'Pantry' },
      { amount: 1, unit: 'tbsp', name: 'honey', section: 'Pantry' },
    ],
    instructions: [
      { step_number: 1, text: 'Wash and dry mixed greens, place in a large bowl.' },
      { step_number: 2, text: 'Halve cherry tomatoes and dice avocado.' },
      { step_number: 3, text: 'Add tomatoes, avocado, walnuts, and goat cheese to greens.' },
      { step_number: 4, text: 'Whisk balsamic vinaigrette with honey and drizzle over salad.' },
      { step_number: 5, text: 'Toss gently and serve immediately.' },
    ],
    tags: ['quick', 'healthy', 'no-cook'],
  },
  {
    name: 'Heritage Basil Pesto',
    category: 'Italian',
    prep_time_minutes: 10,
    cook_time_minutes: 10,
    servings: 4,
    estimated_cost: 14,
    ingredients: [
      { amount: 2, unit: 'cups', name: 'fresh basil leaves', section: 'Produce' },
      { amount: 0.5, unit: 'cup', name: 'pine nuts', section: 'Pantry' },
      { amount: 3, unit: 'cloves', name: 'garlic', section: 'Produce' },
      { amount: 0.75, unit: 'cup', name: 'parmesan cheese', section: 'Dairy & Eggs' },
      { amount: 0.5, unit: 'cup', name: 'extra virgin olive oil', section: 'Pantry' },
      { amount: 1, unit: 'lb', name: 'spaghetti', section: 'Pantry' },
      { amount: 1, unit: 'pinch', name: 'salt', section: 'Pantry' },
    ],
    instructions: [
      { step_number: 1, text: 'Toast pine nuts in a dry skillet over medium heat until golden, about 3 minutes.' },
      { step_number: 2, text: 'Combine basil, toasted pine nuts, garlic, and parmesan in a food processor.' },
      { step_number: 3, text: 'Pulse while slowly drizzling in olive oil until smooth. Season with salt.' },
      { step_number: 4, text: 'Cook spaghetti according to package directions. Reserve 1/2 cup pasta water.' },
      { step_number: 5, text: 'Toss hot pasta with pesto, adding pasta water as needed for silky consistency.' },
    ],
    tags: ['classic', 'pasta', 'quick'],
  },
  {
    name: 'Miso Sweet Potato Bowl',
    category: 'Vegan',
    prep_time_minutes: 10,
    cook_time_minutes: 25,
    servings: 2,
    estimated_cost: 10,
    ingredients: [
      { amount: 2, unit: 'medium', name: 'sweet potatoes', section: 'Produce' },
      { amount: 2, unit: 'tbsp', name: 'white miso paste', section: 'Pantry' },
      { amount: 1, unit: 'tbsp', name: 'sesame oil', section: 'Pantry' },
      { amount: 1, unit: 'tbsp', name: 'rice vinegar', section: 'Pantry' },
      { amount: 1, unit: 'cup', name: 'cooked brown rice', section: 'Pantry' },
      { amount: 1, unit: 'cup', name: 'edamame', section: 'Produce' },
      { amount: 1, unit: '', name: 'avocado', section: 'Produce' },
      { amount: 2, unit: 'tbsp', name: 'sesame seeds', section: 'Pantry' },
    ],
    instructions: [
      { step_number: 1, text: 'Preheat oven to 425F. Cube sweet potatoes into 1-inch pieces.' },
      { step_number: 2, text: 'Whisk miso paste with sesame oil and rice vinegar.' },
      { step_number: 3, text: 'Toss sweet potatoes with half the miso glaze. Roast 25 minutes until caramelized.' },
      { step_number: 4, text: 'Divide rice between bowls. Top with roasted sweet potatoes, edamame, and sliced avocado.' },
      { step_number: 5, text: 'Drizzle remaining miso glaze over bowls and sprinkle with sesame seeds.' },
    ],
    tags: ['healthy', 'plant-based', 'meal-prep'],
  },
  {
    name: 'Reverse-Seared Ribeye',
    category: 'High Protein',
    prep_time_minutes: 5,
    cook_time_minutes: 40,
    servings: 2,
    estimated_cost: 28,
    ingredients: [
      { amount: 1, unit: 'lb', name: 'ribeye steak (1.5 inch thick)', section: 'Proteins' },
      { amount: 2, unit: 'tbsp', name: 'unsalted butter', section: 'Dairy & Eggs' },
      { amount: 2, unit: 'sprigs', name: 'fresh thyme', section: 'Produce' },
      { amount: 3, unit: 'cloves', name: 'garlic', section: 'Produce' },
      { amount: 1, unit: 'tsp', name: 'flaky sea salt', section: 'Pantry' },
      { amount: 1, unit: 'tsp', name: 'freshly cracked black pepper', section: 'Pantry' },
      { amount: 1, unit: 'tbsp', name: 'high-heat oil', section: 'Pantry' },
    ],
    instructions: [
      { step_number: 1, text: 'Season steak generously with salt and pepper. Let sit at room temperature 30 minutes.' },
      { step_number: 2, text: 'Preheat oven to 275F. Place steak on a wire rack over a sheet pan.' },
      { step_number: 3, text: 'Bake until internal temp reaches 120F for medium-rare, about 25-30 minutes.' },
      { step_number: 4, text: 'Heat cast iron skillet until smoking. Add oil, then sear steak 1 minute per side.' },
      { step_number: 5, text: 'Add butter, thyme, and crushed garlic. Baste steak for 30 seconds. Rest 5 minutes before slicing.' },
    ],
    tags: ['date-night', 'special-occasion', 'keto'],
  },
  {
    name: 'Cloud-Light Hotcakes',
    category: 'Breakfast',
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    servings: 4,
    estimated_cost: 8,
    ingredients: [
      { amount: 1.5, unit: 'cups', name: 'all-purpose flour', section: 'Pantry' },
      { amount: 2, unit: 'tbsp', name: 'sugar', section: 'Pantry' },
      { amount: 2, unit: 'tsp', name: 'baking powder', section: 'Pantry' },
      { amount: 0.5, unit: 'tsp', name: 'salt', section: 'Pantry' },
      { amount: 1.25, unit: 'cups', name: 'buttermilk', section: 'Dairy & Eggs' },
      { amount: 2, unit: '', name: 'eggs (separated)', section: 'Dairy & Eggs' },
      { amount: 3, unit: 'tbsp', name: 'melted butter', section: 'Dairy & Eggs' },
      { amount: 1, unit: 'tsp', name: 'vanilla extract', section: 'Pantry' },
      { amount: 1, unit: 'cup', name: 'fresh berries for serving', section: 'Produce' },
      { amount: 2, unit: 'tbsp', name: 'maple syrup', section: 'Pantry' },
    ],
    instructions: [
      { step_number: 1, text: 'Whisk flour, sugar, baking powder, and salt in a large bowl.' },
      { step_number: 2, text: 'In a separate bowl, whisk buttermilk, egg yolks, melted butter, and vanilla.' },
      { step_number: 3, text: 'Beat egg whites to stiff peaks with a hand mixer.' },
      { step_number: 4, text: 'Fold wet ingredients into dry just until combined. Gently fold in egg whites.' },
      { step_number: 5, text: 'Cook on a buttered griddle over medium heat, 2-3 minutes per side until golden.' },
      { step_number: 6, text: 'Serve stacked with fresh berries and a drizzle of maple syrup.' },
    ],
    tags: ['weekend', 'family', 'crowd-pleaser'],
  },
];
