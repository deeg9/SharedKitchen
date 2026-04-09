import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Recipe } from '../../types/database';
import { getDefaultRecipeImage } from '../../lib/images';

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite?: boolean;
  rating?: number;
}

function getDifficulty(recipe: Recipe): { label: string; bg: string } {
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  if (totalTime <= 0) {
    return { label: 'BEGINNER', bg: colors.primaryFixed };
  }
  if (totalTime < 20) {
    return { label: 'BEGINNER', bg: colors.primaryFixed };
  }
  if (totalTime <= 45) {
    return { label: 'INTERMEDIATE', bg: colors.secondaryFixed };
  }
  return { label: 'ADVANCED', bg: colors.surfaceContainerHigh };
}

function getTotalTime(recipe: Recipe): number | null {
  const prep = recipe.prep_time_minutes ?? 0;
  const cook = recipe.cook_time_minutes ?? 0;
  const total = prep + cook;
  return total > 0 ? total : null;
}

export function RecipeCard({ recipe, isFavorite = false, rating }: RecipeCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/recipe/${recipe.id}`);
  };

  const difficulty = getDifficulty(recipe);
  const totalTime = getTotalTime(recipe);

  return (
    <Pressable onPress={handlePress} style={styles.pressable} testID={`recipe-card-${recipe.id}`}>
      <Card variant="elevated" style={styles.card}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image_url || getDefaultRecipeImage(recipe.id, recipe.category) }}
            style={styles.image}
          />
          {isFavorite && (
            <View style={styles.heartOverlay}>
              <MaterialCommunityIcons name="heart" size={18} color={colors.error} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          {/* Name + Rating row */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {recipe.name}
            </Text>
            {rating != null && rating > 0 && (
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={14} color={colors.secondary} />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Description derived from first instruction step */}
          {recipe.instructions != null && recipe.instructions.length > 0 && recipe.instructions[0].text.length > 0 && (
            <Text style={styles.description} numberOfLines={2}>
              {recipe.instructions[0].text}
            </Text>
          )}

          {/* Bottom pills row */}
          <View style={styles.pillRow}>
            {totalTime != null && (
              <View style={styles.pill}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={12}
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.pillText}>{totalTime}M</Text>
              </View>
            )}
            <View style={[styles.difficultyBadge, { backgroundColor: difficulty.bg }]}>
              <Text style={styles.difficultyText}>{difficulty.label}</Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.md,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  heartOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: borderRadius.full,
    padding: 4,
  },
  info: {
    padding: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.titleMd,
    color: colors.onSurface,
    flex: 1,
    marginRight: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  description: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  pillText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  difficultyText: {
    ...typography.labelSm,
    color: colors.onSurface,
  },
});
