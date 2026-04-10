import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { getDefaultRecipeImage } from '../../lib/images';
import type { MealPlanWithRecipe } from '../../stores/planStore';
import type { MealType } from '../../types/database';

const MEAL_CONFIG: Record<
  string,
  {
    icon: 'bread-slice-outline' | 'food-apple-outline' | 'silverware-fork-knife';
    label: string;
  }
> = {
  breakfast: { icon: 'bread-slice-outline', label: 'Breakfast' },
  lunch: { icon: 'food-apple-outline', label: 'Lunch' },
  dinner: { icon: 'silverware-fork-knife', label: 'Dinner' },
};

// Small palette for avatar fallback colors
const AVATAR_COLORS = ['#6B7280', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface HouseholdMemberInfo {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface RsvpInfo {
  user_id: string;
  status: 'eating' | 'skipped';
}

interface DayViewMealSlotProps {
  mealType: MealType;
  plan?: MealPlanWithRecipe;
  onEditPress: () => void;
  onViewRecipe?: () => void;
  householdMembers?: HouseholdMemberInfo[];
  rsvps?: RsvpInfo[];
  onToggleRsvp?: (userId: string) => void;
}

export function DayViewMealSlot({
  mealType,
  plan,
  onEditPress,
  onViewRecipe,
  householdMembers,
  rsvps,
  onToggleRsvp,
}: DayViewMealSlotProps) {
  const config = MEAL_CONFIG[mealType] ?? MEAL_CONFIG.breakfast;
  const hasRecipe = plan?.recipes != null;
  const hasNotes = plan != null && !hasRecipe && plan.notes;

  // Notes-only state
  if (hasNotes && !hasRecipe) {
    return (
      <Pressable onPress={onEditPress} testID={`day-meal-${mealType}-notes`}>
        <Card variant="elevated" style={styles.card}>
          {/* Placeholder hero area */}
          <View style={styles.heroPlaceholder}>
            <MaterialCommunityIcons
              name="food"
              size={48}
              color={colors.outlineVariant}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.mealLabel}>{config.label.toUpperCase()}</Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onEditPress();
                }}
                hitSlop={8}
                style={styles.editButton}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={colors.onSurfaceVariant}
                />
              </Pressable>
            </View>
            <Text style={styles.recipeName} numberOfLines={1}>
              {plan!.notes}
            </Text>
          </View>
        </Card>
      </Pressable>
    );
  }

  // Empty state
  if (!plan || !hasRecipe) {
    return (
      <Pressable onPress={onEditPress} testID={`day-meal-${mealType}-empty`}>
        <Card variant="elevated" style={styles.card}>
          <View style={styles.heroPlaceholder}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={48}
              color={colors.outlineVariant}
            />
          </View>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.mealLabel}>{config.label.toUpperCase()}</Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onEditPress();
                }}
                hitSlop={8}
                style={styles.editButton}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={colors.onSurfaceVariant}
                />
              </Pressable>
            </View>
            <Text style={styles.emptyPrompt}>Tap to add a recipe</Text>
          </View>
        </Card>
      </Pressable>
    );
  }

  // Filled state
  const recipe = plan.recipes!;
  const imageUri =
    recipe.image_url ||
    getDefaultRecipeImage(plan.recipe_id ?? plan.id, recipe.category ?? undefined);
  const totalTime =
    recipe.prep_time_minutes != null
      ? recipe.prep_time_minutes + (recipe.cook_time_minutes ?? 0)
      : null;
  const description = recipe.instructions?.[0]?.text ?? '';
  const ingredientCount = recipe.ingredients?.length ?? 0;

  return (
    <Pressable onPress={onViewRecipe} testID={`day-meal-${mealType}-filled`}>
      <Card variant="elevated" style={styles.card}>
        {/* Hero image */}
        <Image
          source={{ uri: imageUri }}
          style={styles.heroImage}
          contentFit="cover"
        />

        {/* Content area */}
        <View style={styles.content}>
          {/* Header: meal label + pencil */}
          <View style={styles.headerRow}>
            <Text style={styles.mealLabel}>{config.label.toUpperCase()}</Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onEditPress();
              }}
              hitSlop={8}
              style={styles.editButton}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          </View>

          {/* Recipe name */}
          <Text style={styles.recipeName} numberOfLines={1}>
            {recipe.name}
          </Text>

          {/* Description */}
          {description ? (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          ) : null}

          {/* Meta row */}
          <View style={styles.metaRow}>
            {totalTime != null && (
              <View style={styles.pill}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={12}
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.pillText}>{totalTime}m</Text>
              </View>
            )}
            {recipe.estimated_cost != null && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  ${recipe.estimated_cost.toFixed(0)}
                </Text>
              </View>
            )}
            {recipe.servings != null && (
              <View style={styles.pill}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={12}
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.pillText}>{recipe.servings}</Text>
              </View>
            )}
          </View>

          {/* RSVP avatars + ingredient count */}
          <View style={styles.rsvpRow}>
            {/* Avatars */}
            <View style={styles.avatarRow}>
              {(householdMembers ?? []).map((member, index) => {
                const memberRsvp = (rsvps ?? []).find(
                  (r) => r.user_id === member.id
                );
                const isSkipped = memberRsvp?.status === 'skipped';
                const initial = (member.display_name ?? '?')[0].toUpperCase();

                return (
                  <Pressable
                    key={member.id}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      onToggleRsvp?.(member.id);
                    }}
                    style={[
                      styles.avatarWrapper,
                      index > 0 && styles.avatarOverlap,
                      isSkipped && styles.avatarSkipped,
                    ]}
                  >
                    {member.avatar_url ? (
                      <Image
                        source={{ uri: member.avatar_url }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          styles.avatarFallback,
                          { backgroundColor: getAvatarColor(member.id) },
                        ]}
                      >
                        <Text style={styles.avatarInitial}>{initial}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Ingredient count */}
            <View style={styles.pill}>
              <Text style={styles.pillText}>{ingredientCount} ingredients</Text>
            </View>
          </View>

          {/* View Recipe button */}
          {onViewRecipe && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onViewRecipe();
              }}
              style={styles.viewRecipeBtn}
            >
              <Text style={styles.viewRecipeText}>View Recipe</Text>
            </Pressable>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const HERO_HEIGHT = 140;

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  heroPlaceholder: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: colors.surfaceContainerHigh,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  mealLabel: {
    ...typography.labelSm,
    color: colors.secondary,
  },
  editButton: {
    padding: spacing.xs,
  },
  recipeName: {
    ...typography.titleLg,
    color: colors.onSurface,
    marginBottom: 2,
  },
  description: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  emptyPrompt: {
    ...typography.bodyMd,
    color: colors.outline,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  rsvpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    // no extra margin for first avatar
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarSkipped: {
    opacity: 0.4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLow,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  viewRecipeBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  viewRecipeText: {
    ...typography.labelMd,
    color: colors.primary,
  },
});
