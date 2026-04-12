import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface WeekHeaderProps {
  weekLabel: string;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  viewMode?: 'day' | 'week';
  onViewModeChange?: (mode: 'day' | 'week') => void;
}

export function WeekHeader({
  weekLabel,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onToday,
  viewMode,
  onViewModeChange,
}: WeekHeaderProps) {
  const isCurrentWeek = weekOffset === 0;

  return (
    <View style={styles.container}>
      <Pressable onPress={onPrevWeek} style={styles.arrow} hitSlop={12} testID="week-header-prev">
        <MaterialCommunityIcons
          name="chevron-left"
          size={28}
          color={colors.onSurface}
        />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.label}>{weekLabel}</Text>
        {!isCurrentWeek && (
          <Pressable onPress={onToday} style={styles.todayPill} testID="week-header-today">
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={onNextWeek} style={styles.arrow} hitSlop={12} testID="week-header-next">
        <MaterialCommunityIcons
          name="chevron-right"
          size={28}
          color={colors.onSurface}
        />
      </Pressable>

      {viewMode != null && onViewModeChange != null && (
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => onViewModeChange('day')}
            style={[
              styles.toggleIcon,
              viewMode === 'day' && styles.toggleIconActive,
            ]}
            hitSlop={8}
            testID="week-header-day-toggle"
          >
            <MaterialCommunityIcons
              name="calendar-today"
              size={20}
              color={viewMode === 'day' ? colors.onPrimary : colors.onSurfaceVariant}
            />
          </Pressable>
          <Pressable
            onPress={() => onViewModeChange('week')}
            style={[
              styles.toggleIcon,
              viewMode === 'week' && styles.toggleIconActive,
            ]}
            hitSlop={8}
            testID="week-header-week-toggle"
          >
            <MaterialCommunityIcons
              name="calendar-week"
              size={20}
              color={viewMode === 'week' ? colors.onPrimary : colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  arrow: {
    padding: spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  todayPill: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  todayText: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: spacing.xs,
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconActive: {
    backgroundColor: colors.primary,
  },
});
