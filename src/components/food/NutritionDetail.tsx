import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NutritionData } from '../../types/food';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface NutritionDetailProps {
  nutrition: NutritionData;
}

interface NutrientRow {
  label: string;
  value: number | undefined;
  unit: string;
  required?: boolean;
}

const NUTRIENT_ROWS: NutrientRow[] = [
  { label: 'Calories', value: undefined, unit: 'kcal', required: true },
  { label: 'Protein', value: undefined, unit: 'g', required: true },
  { label: 'Total Fat', value: undefined, unit: 'g', required: true },
  { label: 'Saturated Fat', value: undefined, unit: 'g' },
  { label: 'Trans Fat', value: undefined, unit: 'g' },
  { label: 'Cholesterol', value: undefined, unit: 'mg' },
  { label: 'Sodium', value: undefined, unit: 'mg', required: true },
  { label: 'Total Carbs', value: undefined, unit: 'g', required: true },
  { label: 'Dietary Fiber', value: undefined, unit: 'g' },
  { label: 'Total Sugars', value: undefined, unit: 'g' },
  { label: 'Vitamin D', value: undefined, unit: 'mcg' },
  { label: 'Calcium', value: undefined, unit: 'mg' },
  { label: 'Iron', value: undefined, unit: 'mg' },
  { label: 'Potassium', value: undefined, unit: 'mg' },
];

function getRows(nutrition: NutritionData): Array<{ label: string; display: string }> {
  const keyMap: Record<string, keyof NutritionData> = {
    'Calories': 'calories',
    'Protein': 'protein_g',
    'Total Fat': 'total_fat_g',
    'Saturated Fat': 'saturated_fat_g',
    'Trans Fat': 'trans_fat_g',
    'Cholesterol': 'cholesterol_mg',
    'Sodium': 'sodium_mg',
    'Total Carbs': 'total_carbs_g',
    'Dietary Fiber': 'dietary_fiber_g',
    'Total Sugars': 'total_sugars_g',
    'Vitamin D': 'vitamin_d_mcg',
    'Calcium': 'calcium_mg',
    'Iron': 'iron_mg',
    'Potassium': 'potassium_mg',
  };

  const rows: Array<{ label: string; display: string }> = [];

  for (const row of NUTRIENT_ROWS) {
    const key = keyMap[row.label];
    const val = nutrition[key];

    if (val == null && !row.required) continue;

    const numVal = val ?? 0;
    rows.push({
      label: row.label,
      display: `${Number(numVal).toFixed(1)} ${row.unit}`,
    });
  }

  return rows;
}

export function NutritionDetail({ nutrition }: NutritionDetailProps) {
  const rows = getRows(nutrition);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nutrition per 100g</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.display}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  header: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  label: {
    ...typography.bodySm,
    color: colors.onSurface,
  },
  value: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.onSurface,
  },
});
