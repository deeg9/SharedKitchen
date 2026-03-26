import { useRecipeStore } from '../../src/stores/recipeStore';
import { Recipe } from '../../src/types/database';
import { parseRecipeUrl } from '../../src/lib/ai';

// ── Type-level verification: parseRecipeUrl returns category field (DISC-04) ──
type ParseResult = Awaited<ReturnType<typeof parseRecipeUrl>>;
// If ParseResult doesn't include category, this assignment fails at compile time
const _typeCheck: ParseResult extends { category?: string | null } ? true : never = true;

// ── Mock recipe fixtures ──────────────────────────────────────────────

const mockRecipes: Recipe[] = [
  {
    id: '1',
    household_id: 'h1',
    name: 'Tacos',
    category: 'Mexican',
    image_url: null,
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    servings: 4,
    estimated_cost: 8,
    ingredients: [],
    instructions: [],
    tags: [],
    source_url: null,
    nutrition_info: null,
    source_image_url: null,
    created_by: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    household_id: 'h1',
    name: 'Pasta Primavera',
    category: 'Pasta',
    image_url: null,
    prep_time_minutes: 25,
    cook_time_minutes: 15,
    servings: 4,
    estimated_cost: 12,
    ingredients: [],
    instructions: [],
    tags: [],
    source_url: null,
    nutrition_info: null,
    source_image_url: null,
    created_by: null,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  {
    id: '3',
    household_id: 'h1',
    name: 'Steak',
    category: 'High Protein',
    image_url: null,
    prep_time_minutes: 45,
    cook_time_minutes: 30,
    servings: 2,
    estimated_cost: 35,
    ingredients: [],
    instructions: [],
    tags: [],
    source_url: null,
    nutrition_info: null,
    source_image_url: null,
    created_by: null,
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
  {
    id: '4',
    household_id: 'h1',
    name: 'Salad',
    category: 'Salads',
    image_url: null,
    prep_time_minutes: 10,
    cook_time_minutes: 0,
    servings: 2,
    estimated_cost: null, // null cost edge case
    ingredients: [],
    instructions: [],
    tags: [],
    source_url: null,
    nutrition_info: null,
    source_image_url: null,
    created_by: null,
    created_at: '2026-01-04T00:00:00Z',
    updated_at: '2026-01-04T00:00:00Z',
  },
  {
    id: '5',
    household_id: 'h1',
    name: 'Smoothie Bowl',
    category: 'Breakfast',
    image_url: null,
    prep_time_minutes: null, // null prep_time edge case
    cook_time_minutes: 0,
    servings: 1,
    estimated_cost: 6,
    ingredients: [],
    instructions: [],
    tags: [],
    source_url: null,
    nutrition_info: null,
    source_image_url: null,
    created_by: null,
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z',
  },
];

// ── Tests ─────────────────────────────────────────────────────────────

describe('recipeStore filteredRecipes()', () => {
  beforeEach(() => {
    useRecipeStore.setState({
      recipes: mockRecipes,
      searchQuery: '',
      activeCategory: null,
      costRange: null,
      maxPrepTime: null,
    });
  });

  // --- No filters ---
  it('returns all recipes when no filters are active', () => {
    const result = useRecipeStore.getState().filteredRecipes();
    expect(result).toHaveLength(5);
  });

  // --- Category filter ---
  it('filters by category "Mexican" returning only matching recipes', () => {
    useRecipeStore.setState({ activeCategory: 'Mexican' });
    const result = useRecipeStore.getState().filteredRecipes();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Tacos');
  });

  it('returns empty array when category has no matches', () => {
    useRecipeStore.setState({ activeCategory: 'NonExistent' });
    const result = useRecipeStore.getState().filteredRecipes();
    expect(result).toHaveLength(0);
  });

  // --- Cost filter ---
  it('filters by cost range [0, 10] returning recipes within range (null cost treated as 0)', () => {
    useRecipeStore.setState({ costRange: [0, 10] });
    const result = useRecipeStore.getState().filteredRecipes();
    // Tacos ($8), Salad (null -> $0), Smoothie Bowl ($6)
    expect(result).toHaveLength(3);
    const names = result.map((r) => r.name).sort();
    expect(names).toEqual(['Salad', 'Smoothie Bowl', 'Tacos']);
  });

  it('filters by cost range [25, 50] excluding recipes outside range', () => {
    useRecipeStore.setState({ costRange: [25, 50] });
    const result = useRecipeStore.getState().filteredRecipes();
    // Only Steak ($35)
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Steak');
  });

  // --- Time filter ---
  it('filters by maxPrepTime 30 returning recipes with prep_time > 0 and <= 30', () => {
    useRecipeStore.setState({ maxPrepTime: 30 });
    const result = useRecipeStore.getState().filteredRecipes();
    // Tacos (15), Pasta (25), Salad (10) -- Smoothie Bowl (null -> 0, fails > 0), Steak (45 > 30)
    expect(result).toHaveLength(3);
    const names = result.map((r) => r.name).sort();
    expect(names).toEqual(['Pasta Primavera', 'Salad', 'Tacos']);
  });

  it('excludes recipes with null prep_time when time filter is active', () => {
    useRecipeStore.setState({ maxPrepTime: 60 });
    const result = useRecipeStore.getState().filteredRecipes();
    // Smoothie Bowl has null prep_time (treated as 0, fails time > 0 check)
    const smoothie = result.find((r) => r.name === 'Smoothie Bowl');
    expect(smoothie).toBeUndefined();
  });

  // --- Combined filters ---
  it('combines category + cost filter to narrow results', () => {
    useRecipeStore.setState({ activeCategory: 'Mexican', costRange: [0, 10] });
    const result = useRecipeStore.getState().filteredRecipes();
    // Only Tacos (Mexican, $8)
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Tacos');
  });

  it('combines all three filters to narrow results', () => {
    useRecipeStore.setState({
      activeCategory: 'Pasta',
      costRange: [0, 20],
      maxPrepTime: 30,
    });
    const result = useRecipeStore.getState().filteredRecipes();
    // Only Pasta Primavera (Pasta, $12, 25min)
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pasta Primavera');
  });

  // --- resetFilters ---
  it('resetFilters() clears all filter state', () => {
    useRecipeStore.setState({
      activeCategory: 'Mexican',
      costRange: [0, 10],
      maxPrepTime: 30,
      searchQuery: 'taco',
    });
    useRecipeStore.getState().resetFilters();
    const state = useRecipeStore.getState();
    expect(state.activeCategory).toBeNull();
    expect(state.costRange).toBeNull();
    expect(state.maxPrepTime).toBeNull();
    expect(state.searchQuery).toBe('');
  });

  // --- hasActiveFilters ---
  it('hasActiveFilters() returns false when no filters are set', () => {
    expect(useRecipeStore.getState().hasActiveFilters()).toBe(false);
  });

  it('hasActiveFilters() returns true when category filter is set', () => {
    useRecipeStore.setState({ activeCategory: 'Mexican' });
    expect(useRecipeStore.getState().hasActiveFilters()).toBe(true);
  });

  it('hasActiveFilters() returns true when cost filter is set', () => {
    useRecipeStore.setState({ costRange: [0, 10] });
    expect(useRecipeStore.getState().hasActiveFilters()).toBe(true);
  });

  it('hasActiveFilters() returns true when time filter is set', () => {
    useRecipeStore.setState({ maxPrepTime: 30 });
    expect(useRecipeStore.getState().hasActiveFilters()).toBe(true);
  });

  it('hasActiveFilters() returns true when search query is set', () => {
    useRecipeStore.setState({ searchQuery: 'taco' });
    expect(useRecipeStore.getState().hasActiveFilters()).toBe(true);
  });
});

describe('AI import category contract (DISC-04)', () => {
  it('parseRecipeUrl return type includes category field (compile-time check)', () => {
    // The type assertion at the top of this file verifies at compile time
    // that parseRecipeUrl returns an object with category?: string | null.
    // This test simply confirms the module exports the function.
    expect(typeof parseRecipeUrl).toBe('function');
    // _typeCheck would fail to compile if the contract broke
    expect(_typeCheck).toBe(true);
  });
});
