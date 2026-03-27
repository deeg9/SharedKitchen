import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBudgetStore } from '../../../src/stores/budgetStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { MonthlyProgress } from '../../../src/components/budget/MonthlyProgress';
import { CategoryCard } from '../../../src/components/budget/CategoryCard';
import { WeeklyBreakdown } from '../../../src/components/budget/WeeklyBreakdown';
import { AddExpenseSheet } from '../../../src/components/budget/AddExpenseSheet';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { TAB_BAR_HEIGHT } from '../../../src/lib/constants';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { UpgradePrompt } from '../../../src/components/premium/UpgradePrompt';

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const subscription = useSubscriptionStore();

  const { activeHouseholdId } = useHouseholdStore();
  const {
    loading,
    budgetTarget,
    fetchExpenses,
    fetchBudgetTarget,
    monthlyTotal,
    categoryTotals,
    weeklyBreakdown,
    selectedMonth,
  } = useBudgetStore();

  useEffect(() => {
    if (activeHouseholdId) {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      fetchExpenses(activeHouseholdId, currentMonth);
      fetchBudgetTarget(activeHouseholdId);
    }
  }, [activeHouseholdId]);

  const spent = monthlyTotal();
  const categories = categoryTotals();
  const weeks = weeklyBreakdown();

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Skeleton.Circle size={36} />
            <Skeleton.Text width={60} style={{ marginLeft: spacing.sm }} />
          </View>
        </View>
        <View style={styles.content}>
          <Skeleton.Card style={{ marginBottom: spacing.md }} />
          <Skeleton.Card style={{ marginBottom: spacing.md, height: 80 }} />
          <Skeleton.Card style={{ marginBottom: spacing.md, height: 80 }} />
          <Skeleton.Card style={{ marginBottom: spacing.md, height: 80 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MonthlyProgress spent={spent} target={budgetTarget} />

        <CategoryCard
          icon="shopping"
          category="Groceries"
          amount={categories.Groceries.amount}
          percentage={categories.Groceries.percentage}
        />
        <CategoryCard
          icon="silverware-fork-knife"
          category="Dining Out"
          amount={categories['Dining Out'].amount}
          percentage={categories['Dining Out'].percentage}
        />
        <CategoryCard
          icon="food-takeout-box"
          category="Takeout"
          amount={categories.Takeout.amount}
          percentage={categories.Takeout.percentage}
        />

        <WeeklyBreakdown weeks={weeks} budgetTarget={budgetTarget} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => setSheetOpen(true)}
        testID="budget-add-expense-button"
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </Pressable>

      {activeHouseholdId && (
        <AddExpenseSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          householdId={activeHouseholdId}
        />
      )}

      {/* Premium Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onDismiss={() => setShowUpgradePrompt(false)}
        feature="analytics_dashboard"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryFixed,
  },
  trendsText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  avatar: {
    marginRight: spacing.sm,
  },
  appTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + spacing.md,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.float,
  },
});
