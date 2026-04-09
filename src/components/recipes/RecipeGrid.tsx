import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { RecipeCard } from './RecipeCard';
import { FilterBar } from './FilterBar';
import { useRecipeStore } from '../../stores/recipeStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Recipe, RecipeRating } from '../../types/database';

interface RecipeGridProps {
  favorites?: Map<string, boolean>;
  ratings?: RecipeRating[];
}

export function RecipeGrid({ favorites, ratings }: RecipeGridProps) {
  const router = useRouter();
  const {
    loading,
    searchQuery,
    setSearchQuery,
    filteredRecipes,
    hasActiveFilters,
    resetFilters,
    setMaxPrepTime,
  } = useRecipeStore();

  const [selectedFilter, setSelectedFilter] = useState('All');

  const allRecipes = filteredRecipes();
  const favMap = favorites ?? new Map();

  // Apply filter chip logic on top of store filters
  const recipes = selectedFilter === 'Favorites'
    ? allRecipes.filter((r) => favMap.get(r.id))
    : allRecipes;

  const filtersActive = hasActiveFilters() || selectedFilter !== 'All';

  const handleFilterChange = useCallback((filter: string) => {
    setSelectedFilter(filter);
    if (filter === 'All') {
      resetFilters();
    } else if (filter === 'Quick Meals') {
      resetFilters();
      setMaxPrepTime(30);
    }
    // 'Favorites' uses client-side filtering above
  }, [resetFilters, setMaxPrepTime]);

  const getRating = useCallback((recipeId: string): number | undefined => {
    if (!ratings) return undefined;
    const r = ratings.find((rating) => rating.recipe_id === recipeId);
    return r?.rating ?? undefined;
  }, [ratings]);

  const renderRecipeCard = useCallback(({ item }: { item: Recipe }) => (
    <RecipeCard
      recipe={item}
      isFavorite={favMap.get(item.id) ?? false}
      rating={getRating(item.id)}
    />
  ), [favMap, getRating]);

  const renderFooter = useCallback(() => (
    <Pressable
      style={styles.importCta}
      onPress={() => router.push('/recipe/add')}
      testID="recipe-import-cta"
    >
      <View style={styles.importIconCircle}>
        <MaterialCommunityIcons name="plus" size={28} color={colors.onSurfaceVariant} />
      </View>
      <Text style={styles.importTitle}>Import New Recipe</Text>
      <Text style={styles.importSubtitle}>
        Add from URL, scan a photo, or start from scratch.
      </Text>
    </Pressable>
  ), [router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonGrid}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton.Card />
              <Skeleton.Text width="80%" style={{ marginTop: spacing.sm }} />
              <Skeleton.Text width="50%" style={{ marginTop: spacing.xs }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <Input
        placeholder="Search recipes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        testID="recipe-search-input"
      />

      {/* Filter chips */}
      <FilterBar
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Recipe list */}
      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🍽</Text>
          <Text style={styles.emptyTitle}>No recipes found</Text>
          <Text style={styles.emptySubtitle}>
            {filtersActive
              ? 'Try adjusting your search or filters'
              : 'Add your first recipe to get started'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={recipes}
          renderItem={renderRecipeCard}
          estimatedItemSize={320}
          keyExtractor={(item: Recipe) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  skeletonGrid: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  skeletonCard: {
    width: '100%',
    marginBottom: spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  importCta: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  importIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  importTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  importSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
