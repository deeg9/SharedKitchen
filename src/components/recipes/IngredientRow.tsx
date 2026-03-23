import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Ingredient } from '../../types/database';

interface IngredientRowProps {
  ingredient: Ingredient;
  multiplier?: number;
}

function formatAmount(amount: number): string {
  if (amount === 0) return '';
  // Show up to 2 decimal places, trim trailing zeros
  const formatted = parseFloat(amount.toFixed(2)).toString();
  return formatted;
}

export function IngredientRow({ ingredient, multiplier = 1 }: IngredientRowProps) {
  const [checked, setChecked] = useState(false);
  const scaledAmount = ingredient.amount * multiplier;

  return (
    <Pressable onPress={() => setChecked(!checked)} style={styles.container}>
      <MaterialCommunityIcons
        name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
        size={22}
        color={checked ? colors.primary : colors.outlineVariant}
      />
      <Text style={[styles.text, checked && styles.textChecked]}>
        {scaledAmount > 0 && (
          <Text style={styles.amount}>{formatAmount(scaledAmount)} </Text>
        )}
        {ingredient.unit && (
          <Text style={styles.unit}>{ingredient.unit} </Text>
        )}
        {ingredient.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  text: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  textChecked: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant,
  },
  amount: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  unit: {
    color: colors.onSurfaceVariant,
  },
});
