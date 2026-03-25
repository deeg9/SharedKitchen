import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { FrequentItem } from '../../types/database';

interface QuickAddChipsProps {
  items: FrequentItem[];
  onQuickAdd: (item: FrequentItem) => void;
}

export function QuickAddChips({ items, onQuickAdd }: QuickAddChipsProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quick Add</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {items.map((item) => (
          <Pressable
            key={item.name}
            style={styles.chip}
            onPress={() => onQuickAdd(item)}
          >
            <MaterialCommunityIcons name="plus" size={14} color={colors.primary} />
            <Text style={styles.chipText} numberOfLines={1}>{item.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  chipRow: {
    gap: spacing.xs,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    fontWeight: '500',
    color: colors.onSurface,
    maxWidth: 120,
  },
});
