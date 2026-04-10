import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface WeekData {
  weekNumber: number;
  dateRange: string;
  total: number;
  isCurrent: boolean;
  categoryBreakdown: Record<string, number>;
}

interface WeeklyBreakdownProps {
  weeks: WeekData[];
  budgetTarget: number;
  expenses?: Array<{ expense_date: string; amount: number }>;
}

const MAX_BAR_HEIGHT = 60;
const MIN_BAR_HEIGHT = 4;

function getWeekDates(weekStart: string): Date[] {
  // Parse the dateRange to extract the starting date info
  // WeekData dateRange format is like "Sep 1-7"
  // We just need a 7-day array for the mini chart
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(2024, 0, i + 1)); // placeholder dates for day slots
  }
  return dates;
}

function WeekCard({
  week,
  expenses,
  containerWidth,
}: {
  week: WeekData;
  expenses: Array<{ expense_date: string; amount: number }>;
  containerWidth: number;
}) {
  const hasData = week.total > 0;
  const transactionCount = expenses.length;

  // Group expenses by day of week (0=Mon to 6=Sun)
  const dailyTotals = new Array(7).fill(0);
  expenses.forEach((e) => {
    const d = new Date(e.expense_date + 'T00:00:00');
    // getDay() returns 0=Sun, convert to 0=Mon
    const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
    dailyTotals[dayIndex] += Number(e.amount);
  });

  const maxDaily = Math.max(...dailyTotals, 1);
  const barGap = spacing.xs;
  const chartWidth = containerWidth - spacing.md * 2; // card padding
  const barWidth = (chartWidth - barGap * 6) / 7;

  if (!hasData && !week.isCurrent) {
    return (
      <Card variant="elevated" style={styles.weekCard}>
        <View style={styles.weekHeader}>
          <View style={styles.weekInfo}>
            <Text style={styles.weekTitle}>
              Week {week.weekNumber}: {week.dateRange}
            </Text>
            <Text style={styles.weekSubtitle}>Pending completion</Text>
          </View>
          <MaterialCommunityIcons name="lock" size={20} color={colors.onSurfaceVariant} />
        </View>
      </Card>
    );
  }

  return (
    <Card variant="elevated" style={styles.weekCard}>
      <View style={styles.weekHeader}>
        <View style={styles.weekInfo}>
          <Text style={styles.weekTitle}>
            Week {week.weekNumber}: {week.dateRange}
          </Text>
          <Text style={styles.weekSubtitle}>{transactionCount} transactions</Text>
        </View>
        <Text style={styles.weekTotal}>${week.total.toFixed(2)}</Text>
      </View>

      <View style={styles.chartContainer}>
        {dailyTotals.map((amount, i) => {
          const ratio = amount / maxDaily;
          const barHeight = amount > 0
            ? Math.max(ratio * MAX_BAR_HEIGHT, MIN_BAR_HEIGHT)
            : MIN_BAR_HEIGHT;

          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  width: Math.max(barWidth, 8),
                  height: barHeight,
                  backgroundColor: amount > 0 ? colors.primaryFixed : colors.surfaceContainerHigh,
                },
              ]}
            />
          );
        })}
      </View>
    </Card>
  );
}

export function WeeklyBreakdown({ weeks, budgetTarget, expenses = [] }: WeeklyBreakdownProps) {
  const { width: screenWidth } = useWindowDimensions();
  // Account for screen padding
  const containerWidth = screenWidth - spacing.lg * 2;

  return (
    <View style={styles.container} testID="weekly-breakdown-section">
      <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
      {weeks.map((week) => {
        // Filter expenses for this week based on dateRange parsing
        const weekExpenses = expenses.filter((e) => {
          const d = new Date(e.expense_date + 'T00:00:00');
          // Simple approach: check if expense is within this week's range
          // weeks are consecutive 7-day buckets within the month
          const weekStartDay = (week.weekNumber - 1) * 7 + 1;
          const weekEndDay = weekStartDay + 6;
          const expDay = d.getDate();
          const expMonth = d.getMonth();
          // We only have dateRange string; use weekNumber to approximate
          return expDay >= weekStartDay && expDay <= weekEndDay;
        });

        return (
          <WeekCard
            key={week.weekNumber}
            week={week}
            expenses={weekExpenses}
            containerWidth={containerWidth}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  weekCard: {
    marginBottom: spacing.sm,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weekInfo: {
    flex: 1,
  },
  weekTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  weekSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  weekTotal: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.md,
    height: MAX_BAR_HEIGHT,
  },
  bar: {
    borderRadius: 3,
  },
});
