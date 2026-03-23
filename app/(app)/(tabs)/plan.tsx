import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeekHeader } from '../../../src/components/plan/WeekHeader';
import { DayCard } from '../../../src/components/plan/DayCard';
import { PlanEditSheet } from '../../../src/components/plan/PlanEditSheet';
import { SurpriseMe } from '../../../src/components/plan/SurpriseMe';
import { usePlanStore } from '../../../src/stores/planStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { useRecipeStore } from '../../../src/stores/recipeStore';
import { toDateString } from '../../../src/lib/dates';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { activeHouseholdId } = useHouseholdStore();
  const { fetchRecipes } = useRecipeStore();
  const {
    weekOffset,
    mealPlan,
    loading,
    weekDays,
    weekLabel,
    setWeekOffset,
    fetchMealPlan,
  } = usePlanStore();

  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [surpriseVisible, setSurpriseVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const handleDayPress = useCallback((date: Date) => {
    setSelectedDate(date);
    setEditSheetOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditSheetOpen(false);
    setSelectedDate(null);
  }, []);

  const selectedDateStr = selectedDate ? toDateString(selectedDate) : '';
  const selectedPlan = selectedDateStr
    ? mealPlan.get(selectedDateStr)
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

      {/* Day Cards */}
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
              </View>
            </View>
          ))
        ) : (
          days.map((date) => {
            const dateStr = toDateString(date);
            const plan = mealPlan.get(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <DayCard
                key={dateStr}
                date={date}
                mealPlan={plan}
                isToday={isToday}
                onPress={() => handleDayPress(date)}
              />
            );
          })
        )}
      </ScrollView>

      {/* Surprise Me FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => setSurpriseVisible(true)}
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
        />
      )}
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
