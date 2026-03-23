/**
 * TypeScript types for the Supabase database schema.
 * These can be refined later with `supabase gen types typescript`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Ingredient within a recipe's JSONB ingredients array */
export interface Ingredient {
  amount: number;
  unit: string;
  name: string;
  section?: string;
}

/** Single instruction step within a recipe's JSONB instructions array */
export interface InstructionStep {
  step_number: number;
  text: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
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
          created_by: string | null;
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
          created_by?: string | null;
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
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
      };
      meal_plans: {
        Row: {
          id: string;
          household_id: string;
          recipe_id: string | null;
          plan_date: string;
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
          assigned_cook?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
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
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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

/** Summary statistics for a grocery list */
export interface GrocerySummary {
  totalItems: number;
  checkedItems: number;
  estimatedTotal: number;
  progressPercent: number;
}
