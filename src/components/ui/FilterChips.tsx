import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export interface FilterChipsProps {
  chips: string[];
  selectedChip: string;
  onSelect: (chip: string) => void;
}

export function FilterChips({ chips, selectedChip, onSelect }: FilterChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map((chip, index) => {
        const isSelected = chip === selectedChip;

        return (
          <TouchableOpacity
            key={chip}
            activeOpacity={0.7}
            onPress={() => onSelect(chip)}
            style={[
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
              index < chips.length - 1 && styles.chipMargin,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.chipText,
                isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
              ]}
            >
              {chip}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: colors.surfaceContainer,
  },
  chipMargin: {
    marginRight: spacing.sm,
  },
  chipText: {
    ...typography.labelLg,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  chipTextUnselected: {
    color: colors.onSurfaceVariant,
  },
});
