import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { RecipeCard } from './RecipeCard';
import { useRecipeStore } from '../../stores/recipeStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Recipe, RecipeRating } from '../../types/database';

const CATEGORIES = [
  'All',
  'Mexican',
  'Seafood',
  'Chicken',
  'Vegetarian',
  'Pasta',
  'Asian',
  'Salads',
  'Soups',
  'Desserts',
];

interface RecipeGridProps {
  favorites?: Map<string, boolean>;
}

export function RecipeGrid({ favorites }: RecipeGridProps) {
  const {
    loading,
    searchQuery,
    activeCategory,
    setSearchQuery,
    setActiveCategory,
    filteredRecipes,
  } = useRecipeStore();

  const recipes = filteredRecipes();
  const favMap = favorites ?? new Map();

  const handleCategoryPress = (category: string) => {
    if (category === 'All') {
      setActiveCategory(null);
    } else {
      setActiveCategory(activeCategory === category ? null : category);
    }
  };

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
      />

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContainer}
      >
        {CATEGORIES.map((cat) => {
          const isActive =
            cat === 'All' ? activeCategory === null : activeCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => handleCategoryPress(cat)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Recipe grid */}
      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🍽</Text>
          <Text style={styles.emptyTitle}>No recipes found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || activeCategory
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
  chipScroll: {
    maxHeight: 44,
    marginBottom: spacing.md,
  },
  chipContainer: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: colors.onPrimary,
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
