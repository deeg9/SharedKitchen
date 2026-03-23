import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function WeekCard({ week, weeklyAvg }: { week: WeekData; weeklyAvg: number }) {
  const [expanded, setExpanded] = useState(false);
  const showAlert = week.isCurrent && week.total > weeklyAvg;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <Card variant="elevated" style={styles.weekCard}>
      <Pressable onPress={toggleExpand} style={styles.weekHeader}>
        <View style={styles.weekIconContainer}>
          <MaterialCommunityIcons
            name="calendar-week"
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>
            Week {week.weekNumber}
            {week.isCurrent ? ' (Current)' : ''}
          </Text>
          <Text style={styles.weekDateRange}>{week.dateRange}</Text>
        </View>
        <View style={styles.weekRight}>
          <Text style={styles.weekTotal}>${Math.round(week.total)} total</Text>
          {showAlert && (
            <Text style={styles.budgetAlert}>BUDGET ALERT</Text>
          )}
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.onSurfaceVariant}
        />
      </Pressable>
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((day) => (
              <Text
                key={day}
                style={[
                  styles.dayLabel,
                  day === getDayAbbrev() && styles.dayLabelCurrent,
                ]}
              >
                {day}
              </Text>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

function getDayAbbrev(): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[new Date().getDay()];
}

export function WeeklyBreakdown({ weeks, budgetTarget }: WeeklyBreakdownProps) {
  const weeklyAvg = weeks.length > 0 ? budgetTarget / weeks.length : 0;
  // Sort with most recent week first
  const sortedWeeks = [...weeks].sort((a, b) => b.weekNumber - a.weekNumber);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
        <Pressable style={styles.exportLink}>
          <Text style={styles.exportText}>Export Report</Text>
          <MaterialCommunityIcons
            name="download"
            size={16}
            color={colors.primary}
          />
        </Pressable>
      </View>
      {sortedWeeks.map((week) => (
        <WeekCard key={week.weekNumber} week={week} weeklyAvg={weeklyAvg} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  exportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exportText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  weekCard: {
    marginBottom: spacing.sm,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  weekInfo: {
    flex: 1,
  },
  weekLabel: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  weekDateRange: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  weekRight: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  weekTotal: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  budgetAlert: {
    ...typography.labelSm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  dayLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  dayLabelCurrent: {
    color: colors.primary,
  },
});
