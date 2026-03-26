import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRecipeStore } from '../../stores/recipeStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { CATEGORIES } from '../../lib/categories';

const COST_OPTIONS: { label: string; range: [number, number] | null }[] = [
  { label: 'Any', range: null },
  { label: 'Under $10', range: [0, 10] },
  { label: '$10 – $25', range: [0, 25] },
  { label: '$25 – $50', range: [25, 50] },
  { label: '$50+', range: [50, 9999] },
];

const TIME_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: 'Any', minutes: null },
  { label: 'Under 15m', minutes: 15 },
  { label: '15 – 30m', minutes: 30 },
  { label: '30 – 60m', minutes: 60 },
  { label: '60m+', minutes: 120 },
];

type DropdownType = 'category' | 'cost' | 'time' | null;

export function FilterBar() {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

  const {
    activeCategory,
    costRange,
    maxPrepTime,
    setActiveCategory,
    setCostRange,
    setMaxPrepTime,
    resetFilters,
    hasActiveFilters,
  } = useRecipeStore();

  const filtersActive = hasActiveFilters();

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown(openDropdown === type ? null : type);
  };

  const getCostLabel = () => {
    if (!costRange) return 'Cost';
    const option = COST_OPTIONS.find(
      (o) => o.range && o.range[0] === costRange[0] && o.range[1] === costRange[1]
    );
    return option?.label ?? 'Cost';
  };

  const getTimeLabel = () => {
    if (!maxPrepTime) return 'Time';
    const option = TIME_OPTIONS.find((o) => o.minutes === maxPrepTime);
    return option?.label ?? 'Time';
  };

  const handleReset = () => {
    resetFilters();
    setOpenDropdown(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Category */}
        <Pressable
          style={[styles.filterButton, activeCategory && styles.filterButtonActive]}
          onPress={() => toggleDropdown('category')}
        >
          <Text style={[styles.filterText, activeCategory && styles.filterTextActive]}>
            {activeCategory ?? 'Category'}
          </Text>
          <MaterialCommunityIcons
            name={openDropdown === 'category' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={activeCategory ? colors.onPrimary : colors.onSurfaceVariant}
          />
        </Pressable>

        {/* Cost */}
        <Pressable
          style={[styles.filterButton, costRange && styles.filterButtonActive]}
          onPress={() => toggleDropdown('cost')}
        >
          <Text style={[styles.filterText, costRange && styles.filterTextActive]}>
            {getCostLabel()}
          </Text>
          <MaterialCommunityIcons
            name={openDropdown === 'cost' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={costRange ? colors.onPrimary : colors.onSurfaceVariant}
          />
        </Pressable>

        {/* Time */}
        <Pressable
          style={[styles.filterButton, maxPrepTime && styles.filterButtonActive]}
          onPress={() => toggleDropdown('time')}
        >
          <Text style={[styles.filterText, maxPrepTime && styles.filterTextActive]}>
            {getTimeLabel()}
          </Text>
          <MaterialCommunityIcons
            name={openDropdown === 'time' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={maxPrepTime ? colors.onPrimary : colors.onSurfaceVariant}
          />
        </Pressable>

        {/* Reset */}
        {filtersActive && (
          <Pressable style={styles.resetButton} onPress={handleReset}>
            <MaterialCommunityIcons name="close" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        )}
      </View>

      {/* Dropdown overlay */}
      {openDropdown && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setOpenDropdown(null)} />
          <View style={styles.dropdown}>
            {openDropdown === 'category' &&
              CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.dropdownItem, activeCategory === cat && styles.dropdownItemActive]}
                  onPress={() => {
                    setActiveCategory(activeCategory === cat ? null : cat);
                    setOpenDropdown(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      activeCategory === cat && styles.dropdownTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                  {activeCategory === cat && (
                    <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
                  )}
                </Pressable>
              ))}

            {openDropdown === 'cost' &&
              COST_OPTIONS.map((option) => {
                const isActive =
                  option.range === null
                    ? costRange === null
                    : costRange !== null &&
                      option.range[0] === costRange[0] &&
                      option.range[1] === costRange[1];
                return (
                  <Pressable
                    key={option.label}
                    style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                    onPress={() => {
                      setCostRange(isActive ? null : option.range);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={[styles.dropdownText, isActive && styles.dropdownTextActive]}>
                      {option.label}
                    </Text>
                    {isActive && option.range !== null && (
                      <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}

            {openDropdown === 'time' &&
              TIME_OPTIONS.map((option) => {
                const isActive =
                  option.minutes === null ? maxPrepTime === null : maxPrepTime === option.minutes;
                return (
                  <Pressable
                    key={option.label}
                    style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                    onPress={() => {
                      setMaxPrepTime(isActive ? null : option.minutes);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={[styles.dropdownText, isActive && styles.dropdownTextActive]}>
                      {option.label}
                    </Text>
                    {isActive && option.minutes !== null && (
                      <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  resetText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    bottom: -1000,
    zIndex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    zIndex: 2,
    ...shadows.float,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryFixed,
  },
  dropdownText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  dropdownTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
