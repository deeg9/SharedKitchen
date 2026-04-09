---
phase: 37-barcode-scanning
plan: "01"
subsystem: barcode-scanning
tags: [edge-function, barcode, expo-camera, food-lookup, open-food-facts, fatsecret]
dependency_graph:
  requires: [food-search-edge-function, food-items-table, ai-usage-log]
  provides: [food-barcode-edge-function, barcode-scanner-component, barcode-store-methods]
  affects: [food-api, food-store, app-json]
tech_stack:
  added: [expo-camera]
  patterns: [cache-first-barcode-lookup, off-fatsecret-fallback, barcode-normalization]
key_files:
  created:
    - supabase/functions/food-barcode/index.ts
    - src/components/barcode/BarcodeScannerScreen.tsx
  modified:
    - src/lib/food-api.ts
    - src/stores/foodStore.ts
    - package.json
    - app.json
decisions:
  - "UPC-A to EAN-13 normalization (prepend '0' for 12-digit barcodes) before all lookups"
  - "Shared 20/day rate limit with food-search via same function_name in ai_usage_log"
  - "expo-camera plugin added alongside existing expo-image-picker for barcode-specific permission message"
metrics:
  duration_seconds: 214
  completed: "2026-04-07"
---

# Phase 37 Plan 01: Barcode Scanning Infrastructure Summary

Edge Function with Open Food Facts-first, FatSecret-fallback barcode lookup; cache-first food_items check; expo-camera barcode scanner with throttled detection and loading/error overlays.

## What Was Built

### Task 1: food-barcode Edge Function and Client API

- **Edge Function** (`supabase/functions/food-barcode/index.ts`): Accepts `{ barcode }`, validates 8-14 digit format (T-37-02), normalizes UPC-A to EAN-13, checks food_items cache first, queries Open Food Facts then FatSecret fallback, upserts result, returns `{ found, food }`.
- **Client API** (`src/lib/food-api.ts`): Added `lookupBarcode()` that invokes `food-barcode` Edge Function with SearchLimitError handling matching `searchFoods()` pattern.
- **Store** (`src/stores/foodStore.ts`): Added `scannedProduct`, `scanLoading`, `scanError`, `scanNotFound` state fields and `lookupBarcode()`, `clearScan()` actions.

### Task 2: expo-camera and BarcodeScannerScreen

- **expo-camera** installed via `npx expo install` with plugin entry in `app.json`.
- **BarcodeScannerScreen** (`src/components/barcode/BarcodeScannerScreen.tsx`): Fullscreen camera overlay supporting EAN-13, EAN-8, UPC-A, UPC-E, Code128 barcode types. Features scan throttling (3s per barcode), loading overlay with spinner, error state with Try Again, close button with safe area insets, and corner-bracketed scanner frame with instruction text.

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|------------|
| T-37-01 | Auth header validated, requires authenticated user |
| T-37-02 | Barcode validated as 8-14 digit string, non-digits stripped |
| T-37-03 | Shared 20/day rate limit, 10s AbortController timeout per external call |
| T-37-04 | FatSecret credentials read from Deno.env (Supabase secrets), never sent to client |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 483249b | food-barcode Edge Function and client API/store |
| 2 | 4ad8062 | expo-camera install and BarcodeScannerScreen component |

## Self-Check: PASSED

All files exist, all commits verified, all content patterns confirmed.
