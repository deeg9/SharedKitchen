import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NutritionData } from '../../types/food';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface NutritionCardProps {
  nutrition: NutritionData | null;
  servings: number;
  loading?: boolean;
  error?: string | null;
  onCalculate?: () => void;
}

const MACRO_COLORS = {
  protein: '#4CAF50',
  carbs: '#FF9800',
  fat: '#F44336',
} as const;

export function NutritionCard({
  nutrition,
  servings,
  loading,
  error,
  onCalculate,
}: NutritionCardProps) {
  // Loading state
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing ingredients...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>{error}</Text>
        {onCalculate && (
          <Pressable onPress={onCalculate} style={styles.retryButton}>
            <MaterialCommunityIcons name="refresh" size={16} color={colors.primary} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Calculate button state (no nutrition yet)
  if (!nutrition && onCalculate) {
    return (
      <Pressable onPress={onCalculate} style={styles.calculateButton}>
        <MaterialCommunityIcons name="calculator-variant" size={20} color={colors.onPrimary} />
        <Text style={styles.calculateText}>Calculate Nutrition</Text>
      </Pressable>
    );
  }

  // No nutrition and no way to calculate
  if (!nutrition) return null;

  // Compute macro percentages for bar widths
  const totalMacroG = nutrition.protein_g + nutrition.total_carbs_g + nutrition.total_fat_g;
  const proteinPct = totalMacroG > 0 ? (nutrition.protein_g / totalMacroG) * 100 : 33;
  const carbsPct = totalMacroG > 0 ? (nutrition.total_carbs_g / totalMacroG) * 100 : 33;
  const fatPct = totalMacroG > 0 ? (nutrition.total_fat_g / totalMacroG) * 100 : 33;

  const macros = [
    { label: 'Protein', value: nutrition.protein_g, pct: proteinPct, color: MACRO_COLORS.protein },
    { label: 'Carbs', value: nutrition.total_carbs_g, pct: carbsPct, color: MACRO_COLORS.carbs },
    { label: 'Fat', value: nutrition.total_fat_g, pct: fatPct, color: MACRO_COLORS.fat },
  ];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <Text style={styles.headerSubtitle}>Per serving (1 of {servings})</Text>
      </View>

      {/* Calories */}
      <View style={styles.caloriesRow}>
        <Text style={styles.caloriesValue}>{Math.round(nutrition.calories)}</Text>
        <Text style={styles.caloriesLabel}>kcal</Text>
      </View>

      {/* Macro bars */}
      <View style={styles.macrosSection}>
        {macros.map((macro) => (
          <View key={macro.label} style={styles.macroRow}>
            <Text style={styles.macroLabel}>{macro.label}</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max(macro.pct, 2)}%`, backgroundColor: macro.color },
                ]}
              />
            </View>
            <Text style={styles.macroValue}>{Math.round(macro.value)}g</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },

  // Error
  errorText: {
    ...typography.bodySm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  retryText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },

  // Calculate button
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    height: 44,
  },
  calculateText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 15,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 20,
    color: colors.primary,
  },
  headerSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },

  // Calories
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  caloriesLabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },

  // Macros
  macrosSection: {
    gap: spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  macroLabel: {
    width: 52,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: borderRadius.full,
  },
  macroValue: {
    width: 36,
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'right',
  },
});
