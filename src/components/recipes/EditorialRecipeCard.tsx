import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { Recipe, Ingredient } from '../../types/database';
import { getDefaultRecipeImage } from '../../lib/images';

interface EditorialRecipeCardProps {
  recipe: Recipe;
  isFavorite?: boolean;
  rating?: number;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getTotalTime(recipe: Recipe): number | null {
  const prep = recipe.prep_time_minutes ?? 0;
  const cook = recipe.cook_time_minutes ?? 0;
  const total = prep + cook;
  return total > 0 ? total : null;
}

function getIngredientCount(recipe: Recipe): number {
  const ingredients = recipe.ingredients as Ingredient[] | null;
  return ingredients?.length ?? 0;
}

export function EditorialRecipeCard({
  recipe,
  isFavorite = false,
  rating,
}: EditorialRecipeCardProps) {
  const router = useRouter();
  const imageUri = recipe.image_url || getDefaultRecipeImage(recipe.id, recipe.category);
  const totalTime = getTotalTime(recipe);
  const ingredientCount = getIngredientCount(recipe);

  const handlePress = () => {
    router.push(`/recipe/${recipe.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
      {isFavorite && (
        <View style={styles.heart}>
          <MaterialCommunityIcons name="heart" size={18} color={colors.error} />
        </View>
      )}
      {rating != null && rating > 0 && (
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={13} color={colors.secondary} />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.name}
        </Text>
        <View style={styles.meta}>
          {totalTime != null && (
            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={colors.onSurfaceVariant} />
              <Text style={styles.metaText}>{formatTime(totalTime)}</Text>
            </View>
          )}
          {recipe.servings != null && recipe.servings > 0 && (
            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="account-outline" size={13} color={colors.onSurfaceVariant} />
              <Text style={styles.metaText}>{recipe.servings} servings</Text>
            </View>
          )}
          {ingredientCount > 0 && (
            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="format-list-bulleted" size={13} color={colors.onSurfaceVariant} />
              <Text style={styles.metaText}>{ingredientCount} ingredients</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  container: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.editorial,
  },
  image: {
    width: '100%',
    height: 200,
  },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: borderRadius.full,
    padding: 5,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  ratingText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    color: colors.onSurface,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.25,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
});
