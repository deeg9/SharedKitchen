import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface MonthPickerProps {
  selectedMonth: Date;
  onPrevious: () => void;
  onNext: () => void;
}

export function MonthPicker({ selectedMonth, onPrevious, onNext }: MonthPickerProps) {
  const label = selectedMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container} testID="budget-month-picker">
      <Pressable onPress={onPrevious} hitSlop={12} accessibilityLabel="Previous month">
        <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onNext} hitSlop={12} accessibilityLabel="Next month">
        <MaterialCommunityIcons name="chevron-right" size={28} color={colors.onSurface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  label: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
});
