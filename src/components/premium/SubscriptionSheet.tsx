import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PremiumBadge } from './PremiumBadge';
import { usePremiumStore } from '../../stores/premiumStore';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

const PREMIUM_PERKS = [
  'Advanced Analytics Dashboard',
  'AI-Powered Meal Suggestions',
  'Unlimited Recipe Storage',
  'Export Grocery Lists',
  'Priority Support',
];

const FREE_VS_PREMIUM: { feature: string; free: boolean; premium: boolean }[] = [
  { feature: 'Basic Meal Planning', free: true, premium: true },
  { feature: 'Grocery Lists', free: true, premium: true },
  { feature: 'Budget Tracking', free: true, premium: true },
  { feature: 'Advanced Analytics', free: false, premium: true },
  { feature: 'AI Suggestions', free: false, premium: true },
  { feature: 'Unlimited Recipes', free: false, premium: true },
  { feature: 'Export Lists', free: false, premium: true },
];

export function SubscriptionSheet() {
  const { tier, upgradeToPremium } = usePremiumStore();
  const isPremium = tier === 'premium';

  const handleManageSubscription = () => {
    Alert.alert(
      'Coming Soon',
      'Subscription management will be available in a future update.'
    );
  };

  const handleUpgrade = async () => {
    await upgradeToPremium();
  };

  if (isPremium) {
    return (
      <View style={styles.container}>
        {/* Premium Plan Card */}
        <Card variant="elevated" style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planTitleRow}>
              <MaterialCommunityIcons name="crown" size={24} color={colors.secondary} />
              <Text style={styles.planTitle}>Premium Plan</Text>
            </View>
            <PremiumBadge size="large" />
          </View>

          <Text style={styles.memberSince}>
            Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>

          <View style={styles.perksList}>
            {PREMIUM_PERKS.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Button
          variant="tertiary"
          size="md"
          onPress={handleManageSubscription}
          style={styles.manageButton}
        >
          Manage Subscription
        </Button>
      </View>
    );
  }

  // Free tier view
  return (
    <View style={styles.container}>
      {/* Free Plan Card */}
      <Card variant="filled" style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>Free Plan</Text>
        </View>
        <Text style={styles.planSubtitle}>
          Upgrade to unlock all premium features
        </Text>
      </Card>

      {/* Feature Comparison */}
      <View style={styles.comparisonSection}>
        <Text style={styles.comparisonTitle}>Compare Plans</Text>

        {/* Column Headers */}
        <View style={styles.comparisonHeaderRow}>
          <Text style={[styles.comparisonFeature, styles.comparisonHeaderText]}>Feature</Text>
          <Text style={[styles.comparisonCol, styles.comparisonHeaderText]}>Free</Text>
          <Text style={[styles.comparisonCol, styles.comparisonHeaderText]}>Premium</Text>
        </View>

        {FREE_VS_PREMIUM.map((row) => (
          <View key={row.feature} style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>{row.feature}</Text>
            <View style={styles.comparisonCol}>
              <MaterialCommunityIcons
                name={row.free ? 'check' : 'close'}
                size={18}
                color={row.free ? colors.primary : colors.outlineVariant}
              />
            </View>
            <View style={styles.comparisonCol}>
              <MaterialCommunityIcons
                name={row.premium ? 'check' : 'close'}
                size={18}
                color={row.premium ? colors.primary : colors.outlineVariant}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Price + Upgrade */}
      <View style={styles.upgradeSection}>
        <Text style={styles.priceTag}>$9.99</Text>
        <Text style={styles.pricePeriod}>/month</Text>
      </View>

      <Button
        variant="secondary"
        size="lg"
        onPress={handleUpgrade}
        style={styles.upgradeButton}
      >
        Upgrade to Premium
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  planCard: {
    marginBottom: spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  planSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  memberSince: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  perksList: {
    gap: spacing.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  perkText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  manageButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  comparisonSection: {
    marginBottom: spacing.lg,
  },
  comparisonTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  comparisonHeaderText: {
    fontFamily: fontFamily.bodySemiBold,
    color: colors.onSurfaceVariant,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  comparisonFeature: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  comparisonCol: {
    width: 60,
    alignItems: 'center',
  },
  upgradeSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  priceTag: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 32,
    color: colors.onSurface,
  },
  pricePeriod: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
  upgradeButton: {
    marginBottom: spacing.lg,
  },
});
