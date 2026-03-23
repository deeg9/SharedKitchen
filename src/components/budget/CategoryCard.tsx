import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type IconName = 'shopping' | 'silverware-fork-knife' | 'food-takeout-box';

interface CategoryCardProps {
  icon: IconName;
  category: string;
  amount: number;
  percentage: number;
}

export function CategoryCard({ icon, category, amount, percentage }: CategoryCardProps) {
  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.iconRow}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={colors.primary}
        />
        <Text style={styles.categoryName}>{category}</Text>
      </View>
      <Text style={styles.amount}>${Math.round(amount)}</Text>
      <Text style={styles.percentage}>{percentage}% of total</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  amount: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  percentage: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
});
