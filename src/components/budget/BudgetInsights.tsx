import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { InsightCard } from '../ui/InsightCard';
import { ExpenseCategory } from '../../stores/budgetStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface CategoryTotal {
  amount: number;
  percentage: number;
}

interface BudgetInsightsProps {
  currentTotal: number;
  previousTotal: number;
  categoryTotals: Record<ExpenseCategory, CategoryTotal>;
  categoryBudgets: Record<ExpenseCategory, number>;
}

interface InsightItem {
  icon: string;
  message: string;
  badgeLabel: string;
  rightIcon?: string;
}

export function BudgetInsights({
  currentTotal,
  previousTotal,
  categoryTotals,
  categoryBudgets,
}: BudgetInsightsProps) {
  const insights: InsightItem[] = [];

  // Month-over-month comparison
  if (previousTotal > 0) {
    const percentChange = Math.round(((previousTotal - currentTotal) / previousTotal) * 100);
    if (percentChange > 0) {
      insights.push({
        icon: 'trending-down',
        message: `You spent ${percentChange}% less this month`,
        badgeLabel: 'SAVINGS ALERT',
        rightIcon: 'lock',
      });
    } else if (percentChange < 0) {
      insights.push({
        icon: 'trending-up',
        message: `Spending is up ${Math.abs(percentChange)}% from last month`,
        badgeLabel: 'HEADS UP',
        rightIcon: 'lock',
      });
    }
  }

  // Over-budget category alerts
  const categories: ExpenseCategory[] = ['Groceries', 'Dining Out', 'Takeout'];
  for (const cat of categories) {
    if (categoryTotals[cat].amount > categoryBudgets[cat]) {
      insights.push({
        icon: 'alert-circle-outline',
        message: `You're over budget on ${cat}`,
        badgeLabel: 'OVER BUDGET',
      });
    }
  }

  // Show max 3 insights
  const visibleInsights = insights.slice(0, 3);

  if (visibleInsights.length === 0) return null;

  return (
    <View style={styles.container} testID="budget-insights-section">
      <View style={styles.header}>
        <Text style={styles.title}>Budget Insights</Text>
        <Pressable>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>
      <View style={styles.cards}>
        {visibleInsights.map((insight, index) => (
          <InsightCard
            key={index}
            icon={insight.icon}
            message={insight.message}
            badgeLabel={insight.badgeLabel}
            rightIcon={insight.rightIcon}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  viewAll: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  cards: {
    gap: spacing.sm,
  },
});
