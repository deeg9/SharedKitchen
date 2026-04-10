import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBudgetStore } from '../../../src/stores/budgetStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { MonthPicker } from '../../../src/components/budget/MonthPicker';
import { MonthlyProgress } from '../../../src/components/budget/MonthlyProgress'; // DonutChart hero via MonthlyProgress
import { BudgetInsights } from '../../../src/components/budget/BudgetInsights';
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
  const [previousTotal, setPreviousTotal] = useState(0);
  const subscription = useSubscriptionStore();

  const { activeHouseholdId } = useHouseholdStore();
  const {
    loading,
    expenses,
    budgetTarget,
    fetchExpenses,
    fetchBudgetTarget,
    monthlyTotal,
    categoryTotals,
    categoryBudgets,
    weeklyBreakdown,
    selectedMonth,
    previousMonthTotal,
    setSelectedMonth,
  } = useBudgetStore();

  useEffect(() => {
    if (activeHouseholdId) {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      fetchExpenses(activeHouseholdId, currentMonth);
      fetchBudgetTarget(activeHouseholdId);
    }
  }, [activeHouseholdId]);

  // Fetch previous month total when selectedMonth changes
  useEffect(() => {
    if (activeHouseholdId) {
      previousMonthTotal(activeHouseholdId).then(setPreviousTotal);
    }
  }, [activeHouseholdId, selectedMonth]);

  const handlePreviousMonth = () => {
    if (!activeHouseholdId) return;
    const prev = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    setSelectedMonth(prev);
    fetchExpenses(activeHouseholdId, prev);
  };

  const handleNextMonth = () => {
    if (!activeHouseholdId) return;
    const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    setSelectedMonth(next);
    fetchExpenses(activeHouseholdId, next);
  };

  const spent = monthlyTotal();
  const categories = categoryTotals();
  const budgets = categoryBudgets();
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
    <View style={[styles.container, { paddingTop: insets.top }]} testID="budget-screen">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MonthPicker
          selectedMonth={selectedMonth}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
        />

        <MonthlyProgress spent={spent} target={budgetTarget} />

        <BudgetInsights
          currentTotal={spent}
          previousTotal={previousTotal}
          categoryTotals={categories}
          categoryBudgets={budgets}
        />

        <Text style={styles.sectionTitle}>Spending Categories</Text>

        <CategoryCard
          icon="shopping"
          category="Groceries"
          amount={categories.Groceries.amount}
          percentage={categories.Groceries.percentage}
          budget={budgets.Groceries}
        />
        <CategoryCard
          icon="silverware-fork-knife"
          category="Dining Out"
          amount={categories['Dining Out'].amount}
          percentage={categories['Dining Out'].percentage}
          budget={budgets['Dining Out']}
        />
        <CategoryCard
          icon="food-takeout-box"
          category="Takeout"
          amount={categories.Takeout.amount}
          percentage={categories.Takeout.percentage}
          budget={budgets.Takeout}
        />

        <WeeklyBreakdown
          weeks={weeks}
          budgetTarget={budgetTarget}
          expenses={expenses.map((e) => ({
            expense_date: e.expense_date,
            amount: Number(e.amount),
          }))}
        />
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
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
