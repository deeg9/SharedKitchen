import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Recipe } from '../../types/database';

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite?: boolean;
}

const FOOD_EMOJIS = ['🍳', '🥗', '🍝', '🌮', '🍕', '🍲', '🥘', '🍜'];

function getPlaceholderEmoji(name: string): string {
  const idx = name.length % FOOD_EMOJIS.length;
  return FOOD_EMOJIS[idx];
}

function getPlaceholderColor(name: string): string {
  const hues = ['#e8d5c0', '#c0d5c2', '#d5c0c0', '#c0c8d5', '#d5d0c0', '#c0d5d0'];
  const idx = name.length % hues.length;
  return hues[idx];
}

export function RecipeCard({ recipe, isFavorite = false }: RecipeCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/recipe/${recipe.id}`);
  };

  return (
    <Pressable onPress={handlePress} style={styles.pressable}>
      <Card variant="elevated" style={styles.card}>
        {/* Image or placeholder */}
        <View style={styles.imageContainer}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.image} />
          ) : (
            <View
              style={[
                styles.placeholder,
                { backgroundColor: getPlaceholderColor(recipe.name) },
              ]}
            >
              <Text style={styles.emoji}>{getPlaceholderEmoji(recipe.name)}</Text>
            </View>
          )}
          {isFavorite && (
            <View style={styles.heartOverlay}>
              <MaterialCommunityIcons name="heart" size={18} color={colors.error} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {recipe.name}
          </Text>
          <View style={styles.badges}>
            {recipe.prep_time_minutes != null && (
              <View style={styles.pill}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={12}
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.pillText}>{recipe.prep_time_minutes}m</Text>
              </View>
            )}
            {recipe.estimated_cost != null && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  ${Number(recipe.estimated_cost).toFixed(0)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    margin: spacing.xs,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
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
    padding: spacing.sm,
  },
  name: {
    ...typography.labelLg,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
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
    textTransform: 'none',
  },
});
