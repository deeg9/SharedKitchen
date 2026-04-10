import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { formatDayLabel } from '../../lib/dates';
import { MealPlanWithRecipe, computeDayNutrition } from '../../stores/planStore';
import { MealType, MEAL_TYPES, MEAL_TYPE_CONFIG } from '../../types/database';
import { getDefaultRecipeImage } from '../../lib/images';

// --- MealSlot: renders a single breakfast/lunch/dinner slot ---

interface MealSlotProps {
  mealType: MealType;
  plan?: MealPlanWithRecipe;
  onPress: () => void;
}

function MealSlot({ mealType, plan, onPress }: MealSlotProps) {
  const config = MEAL_TYPE_CONFIG[mealType];
  const hasRecipe = plan?.recipes != null;
  const hasNotes = plan != null && !hasRecipe && plan.notes;

  // No plan at all — show empty "Add" slot
  if (!plan || (!hasRecipe && !hasNotes)) {
    return (
      <Pressable onPress={onPress}>
        <View style={slotStyles.empty}>
          <View style={slotStyles.emptyIcon}>
            <MaterialCommunityIcons name="plus" size={16} color={colors.outlineVariant} />
          </View>
          <Text style={slotStyles.emptyText}>Add {config.label}</Text>
        </View>
      </Pressable>
    );
  }

  // Recipe-less meal logged via photo (dish name stored in notes)
  if (hasNotes && !hasRecipe) {
    return (
      <Pressable onPress={onPress}>
        <Card variant="elevated" style={slotStyles.filled}>
          <View style={slotStyles.filledRow}>
            <View style={[slotStyles.thumbnail, slotStyles.notesPlaceholder]}>
              <MaterialCommunityIcons name="food" size={20} color={colors.onSurfaceVariant} />
            </View>
            <View style={slotStyles.info}>
              <Text style={slotStyles.mealLabel}>{config.label}</Text>
              <Text style={slotStyles.recipeName} numberOfLines={1}>
                {plan.notes}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  }

  const recipe = plan.recipes!;

  return (
    <Pressable onPress={onPress}>
      <Card variant="elevated" style={slotStyles.filled}>
        <View style={slotStyles.filledRow}>
          <Image
            source={{ uri: recipe.image_url || getDefaultRecipeImage(plan.recipe_id ?? plan.id, recipe.category) }}
            style={slotStyles.thumbnail}
          />

          <View style={slotStyles.info}>
            <Text style={slotStyles.mealLabel}>{config.label}</Text>
            <Text style={slotStyles.recipeName} numberOfLines={1}>
              {recipe.name}
            </Text>
            <View style={slotStyles.metaRow}>
              {recipe.prep_time_minutes != null && (
                <View style={slotStyles.pill}>
                  <MaterialCommunityIcons name="clock-outline" size={10} color={colors.onSurfaceVariant} />
                  <Text style={slotStyles.pillText}>
                    {recipe.prep_time_minutes + (recipe.cook_time_minutes ?? 0)}m
                  </Text>
                </View>
              )}
              {recipe.estimated_cost != null && (
                <View style={slotStyles.pill}>
                  <Text style={slotStyles.pillText}>${recipe.estimated_cost.toFixed(0)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const slotStyles = StyleSheet.create({
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
  },
  emptyIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.labelSm,
    color: colors.outlineVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filled: {
    padding: spacing.sm,
  },
  filledRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  placeholderImage: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesPlaceholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  info: {
    flex: 1,
  },
  mealLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  recipeName: {
    ...typography.titleSm,
    color: colors.onSurface,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
});

// --- DaySection: renders date header + 3 MealSlots ---

interface DaySectionProps {
  date: Date;
  meals: Partial<Record<MealType, MealPlanWithRecipe | undefined>>;
  isToday: boolean;
  onMealPress: (mealType: MealType) => void;
  collapsed?: boolean;
}

export function DaySection({ date, meals, isToday, onMealPress, collapsed }: DaySectionProps) {
  const label = formatDayLabel(date);

  // Collapsed single-line row for past days
  if (collapsed) {
    const mealCount = MEAL_TYPES.filter((mt) => meals[mt] != null).length;
    return (
      <Pressable
        onPress={() => onMealPress('dinner')}
        style={sectionStyles.collapsedRow}
        testID={`plan-day-${label.weekday}-collapsed`}
      >
        <Text style={sectionStyles.collapsedDate}>
          {label.month} {label.day} {label.weekday}
        </Text>
        <Text style={sectionStyles.collapsedMeals}>
          {mealCount > 0 ? `${mealCount} meal${mealCount > 1 ? 's' : ''}` : 'empty'}
        </Text>
      </Pressable>
    );
  }

  const dayNutrition = computeDayNutrition(meals);

  return (
    <View style={sectionStyles.container} testID={`plan-day-${label.weekday}`}>
      <View style={sectionStyles.row}>
        {/* Date header */}
        <View style={sectionStyles.dateCol}>
          <Text style={sectionStyles.dateLabel}>{label.month} {label.day}</Text>
          <Text style={[sectionStyles.weekday, isToday && sectionStyles.todayText]}>
            {label.weekday}
          </Text>
        </View>

        {/* Separator */}
        <View style={sectionStyles.separator} />

        {/* Meal slots */}
        <View style={sectionStyles.slotsCol}>
          {MEAL_TYPES.map((mt) => (
            <MealSlot
              key={mt}
              mealType={mt}
              plan={meals[mt]}
              onPress={() => onMealPress(mt)}
            />
          ))}
        </View>
      </View>

      {/* Daily nutrition totals */}
      {dayNutrition.nutrition && (
        <View style={sectionStyles.nutritionRow}>
          <Text style={sectionStyles.nutritionText}>
            {Math.round(dayNutrition.nutrition.calories)} cal
          </Text>
          <Text style={sectionStyles.nutritionDot}>{'\u00B7'}</Text>
          <Text style={sectionStyles.nutritionText}>
            {Math.round(dayNutrition.nutrition.protein_g)}g protein
          </Text>
          <Text style={sectionStyles.nutritionDot}>{'\u00B7'}</Text>
          <Text style={sectionStyles.nutritionText}>
            {Math.round(dayNutrition.nutrition.total_carbs_g)}g carbs
          </Text>
          <Text style={sectionStyles.nutritionDot}>{'\u00B7'}</Text>
          <Text style={sectionStyles.nutritionText}>
            {Math.round(dayNutrition.nutrition.total_fat_g)}g fat
          </Text>
          {dayNutrition.matchedMeals < dayNutrition.totalMeals && (
            <Text style={sectionStyles.nutritionPartial}>
              ({dayNutrition.matchedMeals} of {dayNutrition.totalMeals} meals)
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateCol: {
    width: 52,
    paddingTop: spacing.sm,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  weekday: {
    ...typography.labelMd,
    fontWeight: '700',
    color: colors.outline,
  },
  todayText: {
    color: colors.primary,
  },
  separator: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.outlineVariant,
    opacity: 0.3,
    marginHorizontal: spacing.sm,
  },
  slotsCol: {
    flex: 1,
    gap: spacing.xs + 2,
  },
  nutritionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingLeft: 52 + spacing.sm + 1,
    gap: 4,
  },
  nutritionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  nutritionDot: {
    fontSize: 11,
    color: colors.outlineVariant,
  },
  nutritionPartial: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.outline,
    fontStyle: 'italic',
  },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    height: 36,
  },
  collapsedDate: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collapsedMeals: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
});

// Keep backward-compatible export name
export { DaySection as DayCard };
