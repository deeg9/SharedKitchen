import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { RecipeCard } from './RecipeCard';
import { FilterBar } from './FilterBar';
import { useRecipeStore } from '../../stores/recipeStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Recipe } from '../../types/database';

interface RecipeGridProps {
  favorites?: Map<string, boolean>;
}

export function RecipeGrid({ favorites }: RecipeGridProps) {
  const {
    loading,
    searchQuery,
    setSearchQuery,
    filteredRecipes,
    hasActiveFilters,
  } = useRecipeStore();

  const recipes = filteredRecipes();
  const favMap = favorites ?? new Map();
  const filtersActive = hasActiveFilters();

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <RecipeCard recipe={item} isFavorite={favMap.get(item.id) ?? false} />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
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

      {/* Filter dropdowns */}
      <View style={{ zIndex: 1, position: 'relative' }}>
        <FilterBar />
      </View>

      {/* Recipe grid */}
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
          numColumns={2}
          estimatedItemSize={200}
          keyExtractor={(item: Recipe) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  skeletonCard: {
    width: '48%',
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
});
