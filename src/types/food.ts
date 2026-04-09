/**
 * Canonical food data types for v6.0 Food Data Integration.
 *
 * These types represent the food_items Postgres cache table and
 * the normalized nutrition data format used across all food sources
 * (USDA, Open Food Facts, FatSecret).
 *
 * NOTE: The existing NutritionInfo interface (string-based, from recipe URL
 * extraction) in database.ts remains unchanged. NutritionData (numeric) is
 * the new canonical format for food database entries. Display logic should
 * prefer NutritionData when available, falling back to NutritionInfo.
 */

/** Food data source identifier */
export type FoodSource = 'usda' | 'off' | 'fatsecret';

/**
 * Canonical numeric nutrition data, normalized per 100g.
 * All values are numeric for computation. Optional fields may be absent
 * depending on the data source.
 */
export interface NutritionData {
  calories: number;            // kcal per 100g
  protein_g: number;
  total_fat_g: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  cholesterol_mg?: number;
  sodium_mg: number;
  total_carbs_g: number;
  dietary_fiber_g?: number;
  total_sugars_g?: number;
  added_sugars_g?: number;
  vitamin_d_mcg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  potassium_mg?: number;
}

/**
 * A serving size option for a food item.
 * Each food may have multiple serving size descriptions
 * (e.g., "1 cup", "100g", "1 medium breast").
 */
export interface ServingSize {
  description: string;         // e.g., "1 cup (240ml)", "1 medium (150g)"
  amount_g: number;            // weight in grams for this serving
  nutrition: NutritionData;    // nutrition for this specific serving size
}

/**
 * A cached food item from external APIs (USDA, OFF, FatSecret).
 * Mirrors the food_items Postgres table schema.
 * Nutrition in the `nutrition` field is always per 100g canonical.
 */
export interface FoodItem {
  id: string;                  // UUID
  fdc_id: number | null;       // USDA FoodData Central ID
  off_barcode: string | null;  // Open Food Facts barcode
  fatsecret_id: number | null; // FatSecret food_id
  name: string;
  name_normalized: string;     // lowercase, trimmed for search/dedup
  brand: string | null;
  barcode: string | null;      // UPC/EAN for barcode lookups
  category: string | null;
  nutrition: NutritionData;    // per 100g canonical
  serving_sizes: ServingSize[];
  source: FoodSource;
  image_url: string | null;
  data_quality: number;        // 0-100 quality score for ranking
  fetched_at: string;          // ISO timestamp
  expires_at: string;          // ISO timestamp
}

/**
 * Lightweight food search result returned from the food-search Edge Function.
 * Subset of FoodItem with just enough data for search result display.
 */
export interface FoodSearchResult {
  id: string;
  name: string;
  brand: string | null;
  source: FoodSource;
  calories: number;            // kcal per 100g (denormalized for display)
  protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  image_url: string | null;
}

/**
 * The "big 6" nutrition values displayed in most contexts.
 * Used by NutritionCard component for the default compact view.
 */
export interface NutritionSummaryData {
  calories: number;
  protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  dietary_fiber_g: number;
  sodium_mg: number;
}

/**
 * Nutrition values scaled to a specific serving.
 * Result of scaling NutritionData from per-100g to a target amount.
 */
export interface ScaledNutrition {
  nutrition: NutritionData;
  serving_description: string; // e.g., "2 cups (480g)"
  serving_weight_g: number;
}
