/**
 * TypeScript types for the Supabase database schema.
 * Regenerated from live schema + custom types preserved.
 * Phase 49: Tech Debt & Type Safety
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Meal type for meal plan entries */
export type MealType = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export const MEAL_TYPE_CONFIG: Record<MealType, { label: string; icon: 'food-croissant' | 'food-apple' | 'food-variant' }> = {
  breakfast: { label: 'Breakfast', icon: 'food-croissant' },
  lunch: { label: 'Lunch', icon: 'food-apple' },
  dinner: { label: 'Dinner', icon: 'food-variant' },
};

/** Meal source for meal plan entries */
export type MealSource = 'home-cooked' | 'takeout' | 'eating-out';

export const MEAL_SOURCES: MealSource[] = ['home-cooked', 'takeout', 'eating-out'];

export const MEAL_SOURCE_CONFIG: Record<MealSource, { label: string; icon: 'pot-steam' | 'motorbike' | 'silverware-fork-knife' }> = {
  'home-cooked': { label: 'Home-cooked', icon: 'pot-steam' },
  'takeout': { label: 'Takeout', icon: 'motorbike' },
  'eating-out': { label: 'Eating Out', icon: 'silverware-fork-knife' },
};

/** Ingredient within a recipe's JSONB ingredients array */
export interface Ingredient {
  amount: number;
  unit: string;
  name: string;
  section?: string;
  food_id?: string;
  matched_confidence?: number;
}

/** Single instruction step within a recipe's JSONB instructions array */
export interface InstructionStep {
  step_number: number;
  text: string;
  timers?: Array<{ duration_seconds: number; label: string }>;
}

/** Nutrition information extracted from recipe source */
export interface NutritionInfo {
  calories?: string;
  protein?: string;
  fat?: string;
  carbohydrates?: string;
  fiber?: string;
  sodium?: string;
  sugar?: string;
}

export interface Database {
  public: {
    Tables: {
      ai_usage_log: {
        Row: {
          id: string;
          user_id: string;
          function_name: string;
          tokens_used: number | null;
          input_hash: string | null;
          cached_response: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          function_name: string;
          tokens_used?: number | null;
          input_hash?: string | null;
          cached_response?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          function_name?: string;
          tokens_used?: number | null;
          input_hash?: string | null;
          cached_response?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      blocked_kitchens: {
        Row: {
          id: string;
          blocker_kitchen_id: string;
          blocked_kitchen_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_kitchen_id: string;
          blocked_kitchen_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_kitchen_id?: string;
          blocked_kitchen_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      budget_settings: {
        Row: {
          id: string;
          household_id: string;
          monthly_target: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          monthly_target?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          monthly_target?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      cook_logs: {
        Row: {
          id: string;
          recipe_id: string;
          user_id: string;
          household_id: string;
          photo_url: string | null;
          notes: string | null;
          cooked_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          user_id: string;
          household_id: string;
          photo_url?: string | null;
          notes?: string | null;
          cooked_at?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          user_id?: string;
          household_id?: string;
          photo_url?: string | null;
          notes?: string | null;
          cooked_at?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          amount: number;
          category: 'Groceries' | 'Dining Out' | 'Takeout';
          description: string | null;
          expense_date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          amount: number;
          category: 'Groceries' | 'Dining Out' | 'Takeout';
          description?: string | null;
          expense_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          amount?: number;
          category?: 'Groceries' | 'Dining Out' | 'Takeout';
          description?: string | null;
          expense_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      feed_posts: {
        Row: {
          id: string;
          kitchen_id: string;
          meal_plan_id: string | null;
          recipe_id: string | null;
          recipe_name: string;
          recipe_image_url: string | null;
          post_type: string;
          cook_log_id: string | null;
          meal_date: string | null;
          meal_type: string | null;
          caption: string | null;
          photo_url: string | null;
          like_count: number;
          comment_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          kitchen_id: string;
          meal_plan_id?: string | null;
          recipe_id?: string | null;
          recipe_name: string;
          recipe_image_url?: string | null;
          post_type?: string;
          cook_log_id?: string | null;
          meal_date?: string | null;
          meal_type?: string | null;
          caption?: string | null;
          photo_url?: string | null;
          like_count?: number;
          comment_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          kitchen_id?: string;
          meal_plan_id?: string | null;
          recipe_id?: string | null;
          recipe_name?: string;
          recipe_image_url?: string | null;
          post_type?: string;
          cook_log_id?: string | null;
          meal_date?: string | null;
          meal_type?: string | null;
          caption?: string | null;
          photo_url?: string | null;
          like_count?: number;
          comment_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          id: string;
          follower_kitchen_id: string;
          following_kitchen_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_kitchen_id: string;
          following_kitchen_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_kitchen_id?: string;
          following_kitchen_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      food_items: {
        Row: {
          id: string;
          fdc_id: number | null;
          off_barcode: string | null;
          fatsecret_id: number | null;
          name: string;
          name_normalized: string;
          brand: string | null;
          barcode: string | null;
          category: string | null;
          nutrition: Json;
          serving_sizes: Json;
          source: 'usda' | 'off' | 'fatsecret';
          image_url: string | null;
          data_quality: number;
          fetched_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          fdc_id?: number | null;
          off_barcode?: string | null;
          fatsecret_id?: number | null;
          name: string;
          name_normalized: string;
          brand?: string | null;
          barcode?: string | null;
          category?: string | null;
          nutrition: Json;
          serving_sizes?: Json;
          source: 'usda' | 'off' | 'fatsecret';
          image_url?: string | null;
          data_quality?: number;
          fetched_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          fdc_id?: number | null;
          off_barcode?: string | null;
          fatsecret_id?: number | null;
          name?: string;
          name_normalized?: string;
          brand?: string | null;
          barcode?: string | null;
          category?: string | null;
          nutrition?: Json;
          serving_sizes?: Json;
          source?: 'usda' | 'off' | 'fatsecret';
          image_url?: string | null;
          data_quality?: number;
          fetched_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      food_search_cache: {
        Row: {
          query_hash: string;
          query_text: string;
          results: Json;
          result_count: number;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          query_hash: string;
          query_text: string;
          results: Json;
          result_count: number;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          query_hash?: string;
          query_text?: string;
          results?: Json;
          result_count?: number;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      grocery_items: {
        Row: {
          id: string;
          grocery_list_id: string;
          name: string;
          quantity: string | null;
          estimated_price: number | null;
          section: 'Proteins' | 'Produce' | 'Dairy & Eggs' | 'Pantry' | 'Other' | null;
          is_checked: boolean;
          checked_by: string | null;
          checked_at: string | null;
          is_manual: boolean;
          source_recipe_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          grocery_list_id?: string;
          name: string;
          quantity?: string | null;
          estimated_price?: number | null;
          section?: 'Proteins' | 'Produce' | 'Dairy & Eggs' | 'Pantry' | 'Other' | null;
          is_checked?: boolean;
          checked_by?: string | null;
          checked_at?: string | null;
          is_manual?: boolean;
          source_recipe_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          grocery_list_id?: string;
          name?: string;
          quantity?: string | null;
          estimated_price?: number | null;
          section?: 'Proteins' | 'Produce' | 'Dairy & Eggs' | 'Pantry' | 'Other' | null;
          is_checked?: boolean;
          checked_by?: string | null;
          checked_at?: string | null;
          is_manual?: boolean;
          source_recipe_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      grocery_lists: {
        Row: {
          id: string;
          household_id: string;
          week_start: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          week_start: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          week_start?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      kitchen_profiles: {
        Row: {
          id: string;
          household_id: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          invite_code: string;
          is_public: boolean;
          is_searchable: boolean;
          follower_count: number;
          following_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          invite_code?: string;
          is_public?: boolean;
          is_searchable?: boolean;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          invite_code?: string;
          is_public?: boolean;
          is_searchable?: boolean;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leftovers: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          date_made: string;
          use_by_date: string;
          portions: number;
          status: 'fresh' | 'frozen';
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          date_made?: string;
          use_by_date: string;
          portions?: number;
          status?: 'fresh' | 'frozen';
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          date_made?: string;
          use_by_date?: string;
          portions?: number;
          status?: 'fresh' | 'frozen';
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      meal_generation_log: {
        Row: {
          id: string;
          user_id: string;
          household_id: string;
          prompt_context: Json | null;
          suggestions: Json | null;
          tokens_used: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          household_id: string;
          prompt_context?: Json | null;
          suggestions?: Json | null;
          tokens_used?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          household_id?: string;
          prompt_context?: Json | null;
          suggestions?: Json | null;
          tokens_used?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      meal_plans: {
        Row: {
          id: string;
          household_id: string;
          recipe_id: string | null;
          plan_date: string;
          meal_type: MealType;
          meal_source: MealSource;
          meal_cost: number | null;
          assigned_cook: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          recipe_id?: string | null;
          plan_date: string;
          meal_type?: MealType;
          meal_source?: MealSource;
          meal_cost?: number | null;
          assigned_cook?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          recipe_id?: string | null;
          plan_date?: string;
          meal_type?: MealType;
          meal_source?: MealSource;
          meal_cost?: number | null;
          assigned_cook?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      meal_rsvps: {
        Row: {
          id: string;
          meal_plan_id: string;
          user_id: string;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          user_id: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          meal_plan_id?: string;
          user_id?: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      pantry_items: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          quantity: string | null;
          unit: string | null;
          category: string | null;
          added_at: string;
          expires_at: string | null;
          created_by: string | null;
          source_grocery_item_id: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          quantity?: string | null;
          unit?: string | null;
          category?: string | null;
          added_at?: string;
          expires_at?: string | null;
          created_by?: string | null;
          source_grocery_item_id?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          quantity?: string | null;
          unit?: string | null;
          category?: string | null;
          added_at?: string;
          expires_at?: string | null;
          created_by?: string | null;
          source_grocery_item_id?: string | null;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          kitchen_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          kitchen_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          kitchen_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          kitchen_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          kitchen_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          kitchen_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      processed_webhook_events: {
        Row: {
          event_id: string;
          event_type: string;
          processed_at: string | null;
        };
        Insert: {
          event_id: string;
          event_type: string;
          processed_at?: string | null;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          processed_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          handle: string | null;
          handle_changed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          handle?: string | null;
          handle_changed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          handle?: string | null;
          handle_changed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          device_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          device_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expo_push_token?: string;
          device_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_comments: {
        Row: {
          id: string;
          recipe_id: string;
          user_id: string;
          parent_id: string | null;
          body: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          user_id: string;
          parent_id?: string | null;
          body: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          user_id?: string;
          parent_id?: string | null;
          body?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      recipe_notes: {
        Row: {
          id: string;
          recipe_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      recipe_ratings: {
        Row: {
          id: string;
          recipe_id: string;
          user_id: string;
          rating: number | null;
          is_favorite: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          user_id: string;
          rating?: number | null;
          is_favorite?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          user_id?: string;
          rating?: number | null;
          is_favorite?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          category: string | null;
          image_url: string | null;
          prep_time_minutes: number | null;
          cook_time_minutes: number | null;
          servings: number;
          estimated_cost: number | null;
          ingredients: Ingredient[];
          instructions: InstructionStep[];
          tags: string[];
          source_url: string | null;
          nutrition_info: NutritionInfo | null;
          source_image_url: string | null;
          computed_nutrition: Record<string, unknown> | null;
          ingredient_matches: Record<string, unknown>[] | null;
          comment_count: number | null;
          created_by: string | null;
          saved_from_kitchen_id: string | null;
          saved_from_recipe_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          category?: string | null;
          image_url?: string | null;
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          servings?: number;
          estimated_cost?: number | null;
          ingredients?: Ingredient[];
          instructions?: InstructionStep[];
          tags?: string[];
          source_url?: string | null;
          nutrition_info?: NutritionInfo | null;
          source_image_url?: string | null;
          computed_nutrition?: Record<string, unknown> | null;
          ingredient_matches?: Record<string, unknown>[] | null;
          comment_count?: number | null;
          created_by?: string | null;
          saved_from_kitchen_id?: string | null;
          saved_from_recipe_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          category?: string | null;
          image_url?: string | null;
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          servings?: number;
          estimated_cost?: number | null;
          ingredients?: Ingredient[];
          instructions?: InstructionStep[];
          tags?: string[];
          source_url?: string | null;
          nutrition_info?: NutritionInfo | null;
          source_image_url?: string | null;
          computed_nutrition?: Record<string, unknown> | null;
          ingredient_matches?: Record<string, unknown>[] | null;
          comment_count?: number | null;
          created_by?: string | null;
          saved_from_kitchen_id?: string | null;
          saved_from_recipe_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reported_content: {
        Row: {
          id: string;
          reporter_kitchen_id: string;
          content_type: 'post' | 'comment';
          post_id: string | null;
          comment_id: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_kitchen_id: string;
          content_type: 'post' | 'comment';
          post_id?: string | null;
          comment_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_kitchen_id?: string;
          content_type?: 'post' | 'comment';
          post_id?: string | null;
          comment_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_recipes: {
        Row: {
          id: string;
          kitchen_id: string;
          source_kitchen_id: string | null;
          recipe_id: string;
          feed_post_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kitchen_id: string;
          source_kitchen_id?: string | null;
          recipe_id: string;
          feed_post_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kitchen_id?: string;
          source_kitchen_id?: string | null;
          recipe_id?: string;
          feed_post_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          price_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string;
          handle: string | null;
          display_name: string | null;
          avatar_url: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      clone_recipe_to_household: {
        Args: {
          p_created_by: string;
          p_source_kitchen_id: string;
          p_source_recipe_id: string;
          p_target_household_id: string;
        };
        Returns: string;
      };
      is_household_admin: {
        Args: { p_household_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_household_member: {
        Args: { p_household_id: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

/** Convenience type aliases */
export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];
export type RecipeRating = Database['public']['Tables']['recipe_ratings']['Row'];
export type RecipeNote = Database['public']['Tables']['recipe_notes']['Row'];

export type MealPlan = Database['public']['Tables']['meal_plans']['Row'];
export type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];
export type MealPlanUpdate = Database['public']['Tables']['meal_plans']['Update'];

export interface MealPlanWithRecipe extends MealPlan {
  recipes: Recipe | null;
}

export type GroceryList = Database['public']['Tables']['grocery_lists']['Row'];
export type GroceryItem = Database['public']['Tables']['grocery_items']['Row'];
export type GroceryItemInsert = Database['public']['Tables']['grocery_items']['Insert'];

export type Expense = Database['public']['Tables']['expenses']['Row'];
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];
export type BudgetSettings = Database['public']['Tables']['budget_settings']['Row'];

export type Leftover = Database['public']['Tables']['leftovers']['Row'];
export type LeftoverInsert = Database['public']['Tables']['leftovers']['Insert'];
export type LeftoverUpdate = Database['public']['Tables']['leftovers']['Update'];

export type PantryItem = Database['public']['Tables']['pantry_items']['Row'];
export type PantryItemInsert = Database['public']['Tables']['pantry_items']['Insert'];
export type PantryItemUpdate = Database['public']['Tables']['pantry_items']['Update'];

export type KitchenProfile = Database['public']['Tables']['kitchen_profiles']['Row'];
export type KitchenProfileInsert = Database['public']['Tables']['kitchen_profiles']['Insert'];
export type KitchenProfileUpdate = Database['public']['Tables']['kitchen_profiles']['Update'];
export type Follow = Database['public']['Tables']['follows']['Row'];
export type FeedPost = Database['public']['Tables']['feed_posts']['Row'];
export type FeedPostInsert = Database['public']['Tables']['feed_posts']['Insert'];
export type PostLike = Database['public']['Tables']['post_likes']['Row'];
export type PostComment = Database['public']['Tables']['post_comments']['Row'];
export type PostCommentInsert = Database['public']['Tables']['post_comments']['Insert'];
export type SavedRecipe = Database['public']['Tables']['saved_recipes']['Row'];
export type BlockedKitchen = Database['public']['Tables']['blocked_kitchens']['Row'];
export type ReportedContent = Database['public']['Tables']['reported_content']['Row'];

export type FoodItemRow = Database['public']['Tables']['food_items']['Row'];
export type FoodItemInsert = Database['public']['Tables']['food_items']['Insert'];
export type FoodItemUpdate = Database['public']['Tables']['food_items']['Update'];
export type FoodSearchCacheRow = Database['public']['Tables']['food_search_cache']['Row'];

export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type PushToken = Database['public']['Tables']['push_tokens']['Row'];
export type AiUsageLog = Database['public']['Tables']['ai_usage_log']['Row'];
export type MealRsvp = Database['public']['Tables']['meal_rsvps']['Row'];
export type RecipeCommentRow = Database['public']['Tables']['recipe_comments']['Row'];
export type CookLogRow = Database['public']['Tables']['cook_logs']['Row'];

export interface KitchenProfileWithRecipeCount extends KitchenProfile {
  recipe_count: number;
}

/** A frequently-added grocery item derived from past lists */
export interface FrequentItem {
  name: string;
  quantity: string | null;
  section: string | null;
  estimated_price: number | null;
  count: number;
}

/** Summary statistics for a grocery list */
export interface GrocerySummary {
  totalItems: number;
  checkedItems: number;
  estimatedTotal: number;
  progressPercent: number;
}

/** Cook log types */
export interface CookLog {
  id: string;
  recipe_id: string;
  user_id: string;
  household_id: string;
  photo_url: string | null;
  notes: string | null;
  cooked_at: string;
  created_at: string;
}

export interface CookLogInsert {
  recipe_id: string;
  user_id: string;
  household_id: string;
  photo_url?: string | null;
  notes?: string | null;
  cooked_at?: string;
}

export interface CookLogWithProfile extends CookLog {
  profiles: { handle: string | null; avatar_url: string | null } | null;
}

/** Recipe comment types */
export interface RecipeComment {
  id: string;
  recipe_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
}

export interface RecipeCommentInsert {
  recipe_id: string;
  user_id: string;
  parent_id?: string | null;
  body: string;
}

export interface RecipeCommentWithProfile extends RecipeComment {
  profiles: { handle: string | null; avatar_url: string | null } | null;
}

export interface ThreadedComment {
  comment: RecipeCommentWithProfile;
  replies: RecipeCommentWithProfile[];
}
