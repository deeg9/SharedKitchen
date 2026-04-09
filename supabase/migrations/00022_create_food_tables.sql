-- Migration 00022: Create food data tables for v6.0 Food Data Integration
-- Tables: food_items (canonical food cache), food_search_cache (query result cache)
-- food_items: tsvector trigram search, 30-day TTL, nutrition per 100g in JSONB
-- food_search_cache: 24-hour TTL, keyed by query hash

-- =============================================================================
-- Extension: pg_trgm (trigram matching for fuzzy text search)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- Table 1: food_items
-- Canonical food data cache, shared across all households.
-- Stores normalized nutrition per 100g from USDA, Open Food Facts, or FatSecret.
-- =============================================================================
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fdc_id INTEGER UNIQUE,
  off_barcode TEXT,
  fatsecret_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  brand TEXT,
  barcode TEXT UNIQUE,
  category TEXT,
  nutrition JSONB NOT NULL,
  serving_sizes JSONB DEFAULT '[]'::jsonb,
  source TEXT NOT NULL CHECK (source IN ('usda', 'off', 'fatsecret')),
  image_url TEXT,
  data_quality SMALLINT DEFAULT 50,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  CONSTRAINT at_least_one_source CHECK (
    fdc_id IS NOT NULL OR off_barcode IS NOT NULL OR fatsecret_id IS NOT NULL
  )
);

-- =============================================================================
-- Indexes: food_items
-- =============================================================================
CREATE INDEX idx_food_items_name_trgm ON food_items USING gin (name_normalized gin_trgm_ops);
CREATE INDEX idx_food_items_barcode ON food_items (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_food_items_fdc_id ON food_items (fdc_id) WHERE fdc_id IS NOT NULL;
CREATE INDEX idx_food_items_expires ON food_items (expires_at);

-- =============================================================================
-- RLS: food_items (anyone reads, only service_role writes)
-- =============================================================================
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read food items" ON food_items FOR SELECT USING (true);

-- =============================================================================
-- Table 2: food_search_cache
-- Short-lived query result cache with 24-hour TTL, keyed by query hash.
-- =============================================================================
CREATE TABLE food_search_cache (
  query_hash TEXT PRIMARY KEY,
  query_text TEXT NOT NULL,
  results JSONB NOT NULL,
  result_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX idx_search_cache_expires ON food_search_cache (expires_at);

-- =============================================================================
-- RLS: food_search_cache (anyone reads, only service_role writes)
-- =============================================================================
ALTER TABLE food_search_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read search cache" ON food_search_cache FOR SELECT USING (true);
