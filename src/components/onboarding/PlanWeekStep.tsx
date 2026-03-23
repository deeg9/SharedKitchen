import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useRecipeStore } from '../../stores/recipeStore';
import { usePlanStore } from '../../stores/planStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { toDateString } from '../../lib/dates';
import { addDays } from 'date-fns';
import { format } from 'date-fns';

interface DayAssignment {
  date: Date;
  dateStr: string;
  recipeName: string | null;
  assigned: boolean;
}

export function PlanWeekStep() {
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const addedRecipeIds = useOnboardingStore((s) => s.addedRecipeIds);
  const householdId = useOnboardingStore((s) => s.householdId);
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);
  const recipes = useRecipeStore((s) => s.recipes);
  const assignRecipe = usePlanStore((s) => s.assignRecipe);

  const effectiveHouseholdId = householdId ?? activeHouseholdId;

  const [assignments, setAssignments] = useState<DayAssignment[]>([]);
  const [autoAssigned, setAutoAssigned] = useState(false);

  // Build next 3 days with auto-assigned recipes
  useEffect(() => {
    const today = new Date();
    const days: DayAssignment[] = [];
    const addedRecipes = recipes.filter((r) => addedRecipeIds.includes(r.id));

    for (let i = 0; i < 3; i++) {
      const date = addDays(today, i + 1);
      const recipe = addedRecipes[i] ?? null;
      days.push({
        date,
        dateStr: toDateString(date),
        recipeName: recipe?.name ?? null,
        assigned: false,
      });
    }

    setAssignments(days);
  }, []);

  const handleConfirm = async () => {
    if (!effectiveHouseholdId || autoAssigned) {
      nextStep();
      return;
    }

    const addedRecipes = recipes.filter((r) => addedRecipeIds.includes(r.id));

    // Auto-assign recipes to the next days
    for (let i = 0; i < Math.min(addedRecipes.length, 3); i++) {
      try {
        await assignRecipe(
          effectiveHouseholdId,
          assignments[i].dateStr,
          addedRecipes[i].id
        );
      } catch {
        // Non-blocking -- continue with other assignments
      }
    }

    setAutoAssigned(true);
    nextStep();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headline}>Plan your first meals</Text>
        <Text style={styles.subtitle}>
          We've assigned your recipes to the next few days. You can always change them later.
        </Text>

        <View style={styles.dayList}>
          {assignments.map((day) => (
            <View key={day.dateStr} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{format(day.date, 'EEEE')}</Text>
                <Text style={styles.dayDate}>{format(day.date, 'MMM d')}</Text>
              </View>
              {day.recipeName ? (
                <View style={styles.recipeRow}>
                  <MaterialCommunityIcons name="food" size={18} color={colors.primary} />
                  <Text style={styles.recipeName}>{day.recipeName}</Text>
                </View>
              ) : (
                <View style={styles.recipeRow}>
                  <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.outlineVariant} />
                  <Text style={styles.emptyText}>No recipe assigned</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>Looks good!</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  headline: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  dayList: {
    gap: spacing.sm,
  },
  dayCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.editorial,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  dayDate: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recipeName: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  footer: {
    paddingTop: spacing.md,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.editorial,
  },
  pressed: {
    opacity: 0.85,
  },
  confirmText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
