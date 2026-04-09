import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FoodSearchResult, FoodItem } from '../../types/food';
import { NutritionDetail } from './NutritionDetail';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface FoodResultRowProps {
  item: FoodSearchResult;
  isExpanded: boolean;
  expandedDetail: FoodItem | null;
  detailLoading: boolean;
  onToggleExpand: () => void;
}

export function FoodResultRow({
  item,
  isExpanded,
  expandedDetail,
  detailLoading,
  onToggleExpand,
}: FoodResultRowProps) {
  return (
    <Pressable onPress={onToggleExpand} style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.nameSection}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.brand != null && (
            <Text style={styles.brand} numberOfLines={1}>
              {item.brand}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.onSurfaceVariant}
        />
      </View>

      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{Math.round(item.calories)} cal</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{Math.round(item.protein_g)}g protein</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{Math.round(item.total_carbs_g)}g carbs</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{Math.round(item.total_fat_g)}g fat</Text>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedSection}>
          {detailLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : expandedDetail ? (
            <NutritionDetail nutrition={expandedDetail.nutrition} />
          ) : (
            <Text style={styles.unavailable}>Nutrition details unavailable</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.onSurface,
  },
  brand: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  pillText: {
    ...typography.labelSm,
    color: colors.onSurface,
    textTransform: 'none',
  },
  expandedSection: {
    marginTop: spacing.sm,
  },
  spinner: {
    paddingVertical: spacing.md,
  },
  unavailable: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
