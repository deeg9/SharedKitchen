import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FilterChips } from '../ui/FilterChips';
import { spacing } from '../../theme/spacing';

const FILTER_CHIPS = ['All', 'Quick Meals', 'Favorites'];

interface FilterBarProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export function FilterBar({ selectedFilter, onFilterChange }: FilterBarProps) {
  return (
    <View style={styles.container} testID="recipe-filter-bar">
      <FilterChips
        chips={FILTER_CHIPS}
        selectedChip={selectedFilter}
        onSelect={onFilterChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
});
