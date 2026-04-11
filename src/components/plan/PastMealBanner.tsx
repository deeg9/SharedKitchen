import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface UnloggedMeal {
  plan_id: string;
  recipe_id: string;
  recipe_name: string;
  recipe_image: string | null;
  plan_date: string;
}

interface PastMealBannerProps {
  meals: UnloggedMeal[];
  onLogCook: (recipeId: string, recipeName: string) => void;
  onDismiss: (planId: string) => void;
}

export function PastMealBanner({ meals, onLogCook, onDismiss }: PastMealBannerProps) {
  if (meals.length === 0) return null;

  // Show max 3 banners
  const visibleMeals = meals.slice(0, 3);

  return (
    <View>
      {visibleMeals.map((meal) => (
        <View key={meal.plan_id} style={styles.banner}>
          {/* Recipe image or placeholder */}
          {meal.recipe_image ? (
            <Image
              source={{ uri: meal.recipe_image }}
              style={styles.image}
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <MaterialCommunityIcons
                name="pot-steam"
                size={20}
                color={colors.onSurfaceVariant}
              />
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.promptText}>Did you cook</Text>
            <Text style={styles.recipeName} numberOfLines={1}>
              {meal.recipe_name}
            </Text>

            {/* Button row */}
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => onLogCook(meal.recipe_id, meal.recipe_name)}
                style={styles.yesButton}
                accessibilityRole="button"
                accessibilityLabel={`Yes, I cooked ${meal.recipe_name}`}
              >
                <Text style={styles.yesButtonText}>Yes</Text>
              </Pressable>
              <Pressable
                onPress={() => onDismiss(meal.plan_id)}
                accessibilityRole="button"
                accessibilityLabel="Skip, dismiss prompt"
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
  },
  placeholder: {
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  promptText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  recipeName: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  yesButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  yesButtonText: {
    ...typography.labelMd,
    color: colors.onPrimary,
  },
  skipButtonText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    paddingVertical: spacing.xs,
  },
});
