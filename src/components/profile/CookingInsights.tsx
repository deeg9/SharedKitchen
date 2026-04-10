import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DonutChart } from '../ui/DonutChart';
import { Skeleton } from '../ui/Skeleton';
import { CookingStats } from '../../stores/planStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CookingInsightsProps {
  stats: CookingStats | null;
  loading: boolean;
}

function getCompletionDescriptor(percent: number): string {
  if (percent >= 75) return 'Great';
  if (percent >= 40) return 'Steady';
  return 'Needs Work';
}

export function CookingInsights({ stats, loading }: CookingInsightsProps) {
  if (loading) {
    return (
      <View style={styles.container} testID="cooking-insights-section">
        <Text style={styles.sectionHeader}>COOKING INSIGHTS</Text>
        <View style={styles.cardsRow}>
          <View style={[styles.card, { flex: 1 }]}>
            <Skeleton.Circle size={28} />
            <Skeleton.Text width={80} style={{ marginTop: spacing.sm }} />
            <Skeleton.Text width={60} style={{ marginTop: spacing.xs }} />
          </View>
          <View style={[styles.card, { flex: 1 }]}>
            <Skeleton.Circle size={60} />
            <Skeleton.Text width={80} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
        <View style={styles.mostCookedCard}>
          <Skeleton.Card />
        </View>
      </View>
    );
  }

  const streak = stats?.streak ?? 0;
  const completionPercent = stats?.completionPercent ?? 0;
  const mostCooked = stats?.mostCookedRecipe ?? null;

  return (
    <View style={styles.container} testID="cooking-insights-section">
      <Text style={styles.sectionHeader}>COOKING INSIGHTS</Text>

      {/* Two-card row: Streak + Completion */}
      <View style={styles.cardsRow}>
        {/* Streak Card */}
        <View style={[styles.card, { flex: 1 }]}>
          <MaterialCommunityIcons name="fire" size={28} color={colors.secondary} />
          <Text style={styles.cardLabel}>Cooking Streak</Text>
          <Text style={styles.streakValue}>
            {streak} {streak === 1 ? 'Day' : 'Days'} {'\uD83D\uDD25'}
          </Text>
        </View>

        {/* Completion Card */}
        <View style={[styles.card, { flex: 1 }]}>
          <DonutChart
            value={completionPercent}
            max={100}
            label={`${completionPercent}%`}
            sublabel=""
            size={60}
            strokeWidth={6}
          />
          <Text style={styles.cardLabel}>Plan Completion</Text>
          <Text style={styles.descriptorText}>
            {getCompletionDescriptor(completionPercent)}
          </Text>
        </View>
      </View>

      {/* Most Cooked Recipe */}
      {mostCooked && (
        <View style={styles.mostCookedCard}>
          <View style={styles.mostCookedRow}>
            {mostCooked.imageUrl ? (
              <Image
                source={{ uri: mostCooked.imageUrl }}
                style={styles.recipeImage}
              />
            ) : (
              <View style={styles.recipeImagePlaceholder}>
                <MaterialCommunityIcons
                  name="chef-hat"
                  size={24}
                  color={colors.onSurfaceVariant}
                />
              </View>
            )}
            <View style={styles.mostCookedInfo}>
              <Text style={styles.mostCookedLabel}>Most Cooked</Text>
              <Text style={styles.mostCookedName} numberOfLines={1}>
                {mostCooked.name}
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {mostCooked.count}x this month
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  cardLabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  streakValue: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  descriptorText: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  mostCookedCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  mostCookedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  recipeImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mostCookedInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  mostCookedLabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  mostCookedName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  countBadge: {
    backgroundColor: colors.secondaryFixed,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  countBadgeText: {
    ...typography.labelSm,
    color: colors.secondary,
  },
});
