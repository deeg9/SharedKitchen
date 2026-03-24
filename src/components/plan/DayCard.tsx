import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { formatDayLabel } from '../../lib/dates';
import { MealPlanWithRecipe } from '../../stores/planStore';
import { MealType, MEAL_TYPES, MEAL_TYPE_CONFIG } from '../../types/database';

// --- MealSlot: renders a single breakfast/lunch/dinner slot ---

interface MealSlotProps {
  mealType: MealType;
  plan?: MealPlanWithRecipe;
  onPress: () => void;
}

function MealSlot({ mealType, plan, onPress }: MealSlotProps) {
  const config = MEAL_TYPE_CONFIG[mealType];
  const hasRecipe = plan?.recipes != null;

  if (!hasRecipe) {
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

  const recipe = plan.recipes!;

  return (
    <Pressable onPress={onPress}>
      <Card variant="elevated" style={slotStyles.filled}>
        <View style={slotStyles.filledRow}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={slotStyles.thumbnail} />
          ) : (
            <View style={[slotStyles.thumbnail, slotStyles.placeholderImage]}>
              <MaterialCommunityIcons
                name={config.icon as any}
                size={16}
                color={colors.outlineVariant}
              />
            </View>
          )}

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
}

export function DaySection({ date, meals, isToday, onMealPress }: DaySectionProps) {
  const label = formatDayLabel(date);

  return (
    <View style={sectionStyles.container}>
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
});

// Keep backward-compatible export name
export { DaySection as DayCard };
