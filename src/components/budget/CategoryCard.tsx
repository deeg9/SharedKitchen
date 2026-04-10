import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type IconName = 'shopping' | 'silverware-fork-knife' | 'food-takeout-box';

interface CategoryCardProps {
  icon: IconName;
  category: string;
  amount: number;
  percentage: number;
  budget: number;
}

export function CategoryCard({ icon, category, amount, percentage, budget }: CategoryCardProps) {
  const testId = `category-card-${category.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <Card variant="elevated" style={styles.card} testID={testId}>
      <View style={styles.topRow}>
        <View style={styles.iconRow}>
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color={colors.primary}
          />
          <Text style={styles.categoryName}>{category}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>${amount.toFixed(2)}</Text>
          <Pressable hitSlop={8}>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar value={amount} max={budget} height={6} />
      </View>

      <View style={styles.subtitleRow}>
        <Text style={styles.subtitle}>${amount.toFixed(2)} spent</Text>
        <Text style={styles.subtitle}>${budget.toFixed(2)} budget</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  amount: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
