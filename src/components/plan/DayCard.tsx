import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { formatDayLabel, toDateString } from '../../lib/dates';
import { MealPlanWithRecipe } from '../../stores/planStore';

interface DayCardProps {
  date: Date;
  mealPlan?: MealPlanWithRecipe;
  isToday: boolean;
  onPress: () => void;
}

export function DayCard({ date, mealPlan, isToday, onPress }: DayCardProps) {
  const label = formatDayLabel(date);
  const hasRecipe = mealPlan?.recipes != null;

  if (!hasRecipe) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        <View style={[styles.emptyCard, isToday && styles.todayBorder]}>
          <View style={styles.dayHeader}>
            <Text style={[styles.weekday, isToday && styles.todayText]}>
              {label.weekday}
            </Text>
            <Text style={styles.dayNumber}>{label.day}</Text>
          </View>
          <View style={styles.emptyContent}>
            <MaterialCommunityIcons
              name="plus"
              size={24}
              color={colors.outlineVariant}
            />
            <Text style={styles.addText}>Add Dinner</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  const recipe = mealPlan.recipes!;

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Card variant="elevated" style={[styles.filledCard, isToday && styles.todayBorder]}>
        <View style={styles.dayHeader}>
          <Text style={[styles.weekday, isToday && styles.todayText]}>
            {label.weekday}
          </Text>
          <Text style={styles.dayNumber}>{label.day}</Text>
        </View>

        <View style={styles.recipeRow}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderImage]}>
              <MaterialCommunityIcons
                name="food-variant"
                size={20}
                color={colors.outlineVariant}
              />
            </View>
          )}

          <View style={styles.recipeInfo}>
            <Text style={styles.recipeName} numberOfLines={1}>
              {recipe.name}
            </Text>

            <View style={styles.metaRow}>
              {recipe.prep_time_minutes != null && (
                <View style={styles.pill}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={12}
                    color={colors.onSurfaceVariant}
                  />
                  <Text style={styles.pillText}>
                    {recipe.prep_time_minutes + (recipe.cook_time_minutes ?? 0)}m
                  </Text>
                </View>
              )}

              {recipe.estimated_cost != null && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    ${recipe.estimated_cost.toFixed(0)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  emptyCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
  },
  filledCard: {
    padding: spacing.sm,
  },
  todayBorder: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  dayHeader: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  weekday: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  dayNumber: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  todayText: {
    color: colors.primary,
  },
  emptyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addText: {
    ...typography.bodyMd,
    color: colors.outlineVariant,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  placeholderImage: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
