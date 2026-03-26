import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeekHeader } from '../../../src/components/plan/WeekHeader';
import { DaySection } from '../../../src/components/plan/DayCard';
import { PlanEditSheet } from '../../../src/components/plan/PlanEditSheet';
import { SurpriseMe } from '../../../src/components/plan/SurpriseMe';
import { SuggestionCard } from '../../../src/components/plan/SuggestionCard';
import { usePlanStore } from '../../../src/stores/planStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { useRecipeStore } from '../../../src/stores/recipeStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { UpgradePrompt } from '../../../src/components/premium/UpgradePrompt';
import { toDateString, makePlanKey } from '../../../src/lib/dates';
import { generateSuggestions } from '../../../src/lib/suggestions';
import { MealType, MEAL_TYPES } from '../../../src/types/database';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { activeHouseholdId } = useHouseholdStore();
  const { fetchRecipes, recipes, ratings } = useRecipeStore();
  const {
    weekOffset,
    mealPlan,
    loading,
    weekDays,
    weekLabel,
    setWeekOffset,
    fetchMealPlan,
  } = usePlanStore();

  const subscription = useSubscriptionStore();

  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [surpriseVisible, setSurpriseVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const days = weekDays();
  const label = weekLabel();
  const todayStr = toDateString(new Date());

  // Fetch meal plan on mount and week change
  useEffect(() => {
    if (activeHouseholdId) {
      const startDate = toDateString(days[0]);
      fetchMealPlan(activeHouseholdId, startDate);
      fetchRecipes(activeHouseholdId);
    }
  }, [activeHouseholdId, weekOffset]);

  const handleMealPress = useCallback((date: Date, mealType: MealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setEditSheetOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditSheetOpen(false);
    setSelectedDate(null);
  }, []);

  // Generate AI suggestions from cooking history
  const suggestions = useMemo(() => {
    const mealPlanArray = Array.from(mealPlan.values());
    return generateSuggestions(recipes, mealPlanArray, ratings);
  }, [recipes, mealPlan, ratings]);

  const handleAddSuggestionToPlan = useCallback((recipeId: string) => {
    setSelectedDate(new Date());
    setSelectedMealType('dinner');
    setEditSheetOpen(true);
  }, []);

  const selectedDateStr = selectedDate ? toDateString(selectedDate) : '';
  const selectedPlan = selectedDateStr
    ? mealPlan.get(makePlanKey(selectedDateStr, selectedMealType))
    : undefined;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Week Navigation */}
      <WeekHeader
        weekLabel={label}
        weekOffset={weekOffset}
        onPrevWeek={() => setWeekOffset(weekOffset - 1)}
        onNextWeek={() => setWeekOffset(weekOffset + 1)}
        onToday={() => setWeekOffset(0)}
      />

      {/* Day Sections */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && mealPlan.size === 0 ? (
          // Skeleton loading state
          Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={40} height={40} borderRadius={8} />
              <View style={styles.skeletonContent}>
                <Skeleton width="60%" height={16} borderRadius={4} />
                <Skeleton width="40%" height={12} borderRadius={4} />
                <Skeleton width="40%" height={12} borderRadius={4} />
              </View>
            </View>
          ))
        ) : (
          days.map((date) => {
            const dateStr = toDateString(date);
            const isToday = dateStr === todayStr;

            // Build meals record for this day
            const meals: Partial<Record<MealType, any>> = {};
            for (const mt of MEAL_TYPES) {
              meals[mt] = mealPlan.get(makePlanKey(dateStr, mt));
            }

            return (
              <DaySection
                key={dateStr}
                date={date}
                meals={meals}
                isToday={isToday}
                onMealPress={(mt) => handleMealPress(date, mt)}
              />
            );
          })
        )}

        {/* AI Suggestion Cards */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.suggestionsTitleRow}>
              <Text style={styles.suggestionsTitle}>Suggestions</Text>
              {!subscription.canAccess('advanced_suggestions') && (
                <View style={styles.proIndicator}>
                  <Text style={styles.proIndicatorText}>PRO</Text>
                </View>
              )}
              <Pressable
                onPress={() => {
                  if (!subscription.canAccess('advanced_suggestions')) {
                    setShowUpgradePrompt(true);
                  }
                }}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.recipeId}
                  suggestion={s}
                  onAddToPlan={handleAddSuggestionToPlan}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Surprise Me FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => setSurpriseVisible(true)}
        testID="plan-surprise-me"
      >
        <MaterialCommunityIcons name="dice-multiple" size={24} color={colors.onPrimary} />
        <Text style={styles.fabText}>Surprise Me</Text>
      </Pressable>

      {/* Edit Sheet */}
      {selectedDate && (
        <PlanEditSheet
          isOpen={editSheetOpen}
          onClose={handleCloseEdit}
          date={selectedDate}
          dateString={selectedDateStr}
          mealType={selectedMealType}
          existingPlan={selectedPlan}
        />
      )}

      {/* Surprise Me Modal */}
      {activeHouseholdId && (
        <SurpriseMe
          visible={surpriseVisible}
          onClose={() => setSurpriseVisible(false)}
          householdId={activeHouseholdId}
          dateString={todayStr}
          mealType="dinner"
        />
      )}

      {/* Premium Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onDismiss={() => setShowUpgradePrompt(false)}
        feature="advanced_suggestions"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + 60, // Space for FAB
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    padding: spacing.md,
    gap: spacing.md,
  },
  skeletonContent: {
    flex: 1,
    gap: spacing.sm,
  },
  suggestionsSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  suggestionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  suggestionsTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  proIndicator: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  proIndicatorText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  viewAllButton: {
    marginLeft: 'auto' as any,
  },
  viewAllText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  suggestionsScroll: {
    paddingHorizontal: spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    ...shadows.float,
  },
  fabText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});
