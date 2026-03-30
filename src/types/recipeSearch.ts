export interface DishIdentification {
  name: string;
  confidence: number;
  description?: string;
}

export interface RecipeSearchResult {
  title: string;
  url: string;
  source: string;       // domain name e.g. "allrecipes.com"
  thumbnail?: string;
  cookTime?: string;     // e.g. "30 min"
}
