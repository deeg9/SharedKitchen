import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KitchenSearchBar } from '../../../src/components/social/KitchenSearchBar';
import { FeedList } from '../../../src/components/social/FeedList';
import { WeekHeader } from '../../../src/components/plan/WeekHeader';
import { DaySection } from '../../../src/components/plan/DayCard';
import { PlanEditSheet } from '../../../src/components/plan/PlanEditSheet';
import { SurpriseMe } from '../../../src/components/plan/SurpriseMe';
import { SuggestionCard } from '../../../src/components/plan/SuggestionCard';
import { DateStrip } from '../../../src/components/ui/DateStrip';
import { HeroDinnerCard } from '../../../src/components/plan/HeroDinnerCard';
import { DayViewMealSlot } from '../../../src/components/plan/DayViewMealSlot';
import { GroceryShortcutCard } from '../../../src/components/plan/GroceryShortcutCard';
import { usePlanStore } from '../../../src/stores/planStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { useRecipeStore } from '../../../src/stores/recipeStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { useSocialStore } from '../../../src/stores/socialStore';
import { useGroceryStore } from '../../../src/stores/groceryStore';
import { UpgradePrompt } from '../../../src/components/premium/UpgradePrompt';
import { toDateString, makePlanKey } from '../../../src/lib/dates';
import { generateSuggestions } from '../../../src/lib/suggestions';
import { MealType, MEAL_TYPES } from '../../../src/types/database';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { TAB_BAR_HEIGHT } from '../../../src/lib/constants';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeHouseholdId, households } = useHouseholdStore();
  const { myKitchenProfile, getOrCreateKitchenProfile, clearFeed } = useSocialStore();
  const [activeSegment, setActiveSegment] = useState<'plan' | 'feed'>('plan');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());
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
  const groceryItems = useGroceryStore(state => state.items);

  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [surpriseVisible, setSurpriseVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const days = weekDays();
  const label = weekLabel();
  const todayStr = toDateString(new Date());

  // Ensure kitchen profile is loaded for feed
  useEffect(() => {
    if (activeHouseholdId && !myKitchenProfile) {
      const household = households.find((h) => h.id === activeHouseholdId);
      const householdName = household?.name ?? 'My Kitchen';
      getOrCreateKitchenProfile(activeHouseholdId, householdName);
    }
  }, [activeHouseholdId, myKitchenProfile]);

  // Clear feed when switching away from feed segment
  const handleSegmentChange = useCallback(
    (segment: 'plan' | 'feed') => {
      if (activeSegment === 'feed' && segment === 'plan') {
        clearFeed();
      }
      setActiveSegment(segment);
    },
    [activeSegment, clearFeed]
  );

  // Fetch meal plan on mount and week change
  useEffect(() => {
    if (activeHouseholdId) {
      const startDate = toDateString(days[0]);
      fetchMealPlan(activeHouseholdId, startDate);
      fetchRecipes(activeHouseholdId);
    }
  }, [activeHouseholdId, weekOffset]);

  // Reset selectedDayDate when weekOffset changes
  useEffect(() => {
    if (weekOffset === 0) {
      setSelectedDayDate(new Date());
    } else {
      // Check if current selectedDayDate is within the new week range
      const weekStart = days[0]?.getTime() ?? 0;
      const weekEnd = days[6]?.getTime() ?? 0;
      const current = selectedDayDate.getTime();
      if (current < weekStart || current > weekEnd) {
        setSelectedDayDate(days[0]);
      }
    }
  }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Search Icon */}
      <View style={styles.headerActions}>
        <Pressable
          onPress={() => setShowSearch(true)}
          hitSlop={12}
          testID="plan-search-icon"
        >
          <MaterialCommunityIcons name="magnify" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      {/* Segmented Control: My Plan / Feed */}
      <View style={styles.segmentRow}>
        <Pressable
          onPress={() => handleSegmentChange('plan')}
          style={[styles.segmentBtn, activeSegment === 'plan' && styles.segmentBtnActive]}
        >
          <Text style={[styles.segmentText, activeSegment === 'plan' && styles.segmentTextActive]}>My Plan</Text>
        </Pressable>
        <Pressable
          onPress={() => handleSegmentChange('feed')}
          style={[styles.segmentBtn, activeSegment === 'feed' && styles.segmentBtnActive]}
        >
          <Text style={[styles.segmentText, activeSegment === 'feed' && styles.segmentTextActive]}>Feed</Text>
        </Pressable>
      </View>

      {activeSegment === 'plan' ? (
        <>
          {/* Single ScrollView for all plan content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* WeekHeader inside scroll, with viewMode toggle */}
            <WeekHeader
              weekLabel={label}
              weekOffset={weekOffset}
              onPrevWeek={() => setWeekOffset(weekOffset - 1)}
              onNextWeek={() => setWeekOffset(weekOffset + 1)}
              onToday={() => setWeekOffset(0)}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {viewMode === 'day' ? (
              <>
                {/* DateStrip scrolls with content */}
                <DateStrip
                  selectedDate={selectedDayDate}
                  onSelectDate={setSelectedDayDate}
                  startDate={days[0]}
                  endDate={days[6]}
                />

                {/* Day View Content */}
                <View style={styles.dayViewContent}>
                  {loading && mealPlan.size === 0 ? (
                    <>
                      <Skeleton width="100%" height={220} borderRadius={borderRadius.lg} />
                      <Skeleton width="100%" height={80} borderRadius={borderRadius.lg} />
                      <Skeleton width="100%" height={80} borderRadius={borderRadius.lg} />
                    </>
                  ) : (
                    (() => {
                      const selectedDayStr = toDateString(selectedDayDate);
                      const dinnerPlan = mealPlan.get(makePlanKey(selectedDayStr, 'dinner'));
                      const breakfastPlan = mealPlan.get(makePlanKey(selectedDayStr, 'breakfast'));
                      const lunchPlan = mealPlan.get(makePlanKey(selectedDayStr, 'lunch'));

                      return (
                        <>
                          <HeroDinnerCard
                            plan={dinnerPlan}
                            onPress={() => handleMealPress(selectedDayDate, 'dinner')}
                            onStartCooking={dinnerPlan?.recipe_id ? () => router.push(`/(app)/cooking/${dinnerPlan.recipe_id}` as any) : undefined}
                          />
                          <DayViewMealSlot
                            mealType="breakfast"
                            plan={breakfastPlan}
                            onPress={() => handleMealPress(selectedDayDate, 'breakfast')}
                          />
                          <DayViewMealSlot
                            mealType="lunch"
                            plan={lunchPlan}
                            onPress={() => handleMealPress(selectedDayDate, 'lunch')}
                          />
                          <GroceryShortcutCard
                            itemCount={groceryItems.length}
                            onPress={() => router.push('/(app)/(tabs)/grocery' as any)}
                          />
                        </>
                      );
                    })()
                  )}
                </View>
              </>
            ) : (
              <>
                {/* Week View */}
                {loading && mealPlan.size === 0 ? (
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
                    const isPast = dateStr < todayStr;

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
                        collapsed={isPast && weekOffset <= 0}
                      />
                    );
                  })
                )}

                {/* AI Suggestion Cards (Week view only) */}
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
              </>
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
        </>
      ) : (
        /* Feed View */
        myKitchenProfile ? (
          <FeedList myKitchenId={myKitchenProfile.id} />
        ) : (
          <View style={styles.feedLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )
      )}

      {/* Kitchen Search Overlay */}
      {showSearch && (
        <KitchenSearchBar onClose={() => setShowSearch(false)} />
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
    paddingBottom: TAB_BAR_HEIGHT,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: TAB_BAR_HEIGHT + 80, // Space for tab bar + FAB
  },
  dayViewContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
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
    marginLeft: 'auto' as const,
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
    bottom: TAB_BAR_HEIGHT + spacing.md,
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
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.full,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: borderRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
    textTransform: 'none',
  },
  segmentTextActive: {
    color: colors.onPrimary,
  },
  feedLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
