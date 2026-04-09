import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PremiumBadge } from './PremiumBadge';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { openCheckout, openBillingPortal } from '../../lib/stripe';
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

const FREE_VS_PREMIUM: { feature: string; icon: string; free: string; premium: string }[] = [
  { feature: 'Collaborative Planning', icon: 'calendar-check', free: 'check', premium: 'check' },
  { feature: 'Basic Grocery Lists', icon: 'format-list-checks', free: 'check', premium: 'check' },
  { feature: 'AI Recipe Import', icon: 'robot', free: '3/mo', premium: 'Unlimited' },
  { feature: 'Budget Analytics', icon: 'chart-line', free: 'dash', premium: 'check' },
  { feature: 'Social Feed Access', icon: 'account-group', free: 'dash', premium: 'check' },
  { feature: 'Advanced Leftover Tracker', icon: 'food-variant', free: 'dash', premium: 'check' },
];

function renderCellValue(value: string, isPremiumCol: boolean) {
  if (value === 'check') {
    return (
      <MaterialCommunityIcons
        name="check-circle"
        size={18}
        color={isPremiumCol ? colors.primary : colors.primary}
      />
    );
  }
  if (value === 'dash') {
    return <Text style={styles.dashText}>{'\u2014'}</Text>;
  }
  // Text values like "3/mo" or "Unlimited"
  if (value === 'Unlimited') {
    return <Text style={styles.unlimitedText}>{value}</Text>;
  }
  return <Text style={styles.cellText}>{value}</Text>;
}

export function SubscriptionSheet() {
  const { status, currentPeriodEnd, cancelAtPeriodEnd, loading } = useSubscriptionStore();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not open billing portal. Please try again later.');
    } finally {
      setTimeout(() => setPortalLoading(false), 1000);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const success = await openCheckout();
      if (!success) {
        // User canceled -- do nothing
      }
    } catch (err: any) {
      setCheckoutError(err.message ?? 'Payment could not be completed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleYearlyUpgrade = () => {
    Alert.alert('Coming Soon', 'Yearly pricing will be available soon.');
  };

  if (isPremium()) {
    return (
      <View style={styles.container}>
        {/* Past due warning banner */}
        {status === 'past_due' && (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
            <View style={styles.warningContent}>
              <Text style={styles.warningText}>Your payment failed. Update your payment method to keep Premium access.</Text>
              <Button variant="secondary" size="sm" onPress={handleManageSubscription}>
                Update Payment
              </Button>
            </View>
          </View>
        )}

        {/* Canceled notice */}
        {status === 'canceled' && (
          <View style={styles.canceledBanner}>
            <Text style={styles.canceledText}>
              Your Premium access ends on {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : 'soon'}.
              Resubscribe anytime.
            </Text>
            <Button variant="secondary" size="sm" onPress={handleUpgrade}>
              Resubscribe
            </Button>
          </View>
        )}

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
          disabled={portalLoading}
          style={styles.manageButton}
          testID="subscription-manage-button"
        >
          {portalLoading ? <ActivityIndicator size="small" color={colors.primary} /> : 'Manage Subscription'}
        </Button>
      </View>
    );
  }

  // Free tier view -- redesigned with comparison table and pricing tiers
  return (
    <View style={styles.container}>
      {/* Compare Plans Section */}
      <View style={styles.comparePlansSection}>
        <Text style={styles.comparePlansTitle}>Compare Plans</Text>
        <Text style={styles.comparePlansSubtitle}>
          Simple, transparent, and built for your kitchen.
        </Text>

        {/* Column Headers */}
        <View style={styles.comparisonHeaderRow}>
          <Text style={styles.headerFeatureLabel}>Features</Text>
          <View style={styles.headerFreeCol}>
            <Text style={styles.headerColLabel}>Free</Text>
          </View>
          <View style={styles.headerPremiumCol}>
            <Text style={styles.headerPremiumLabel}>Premium</Text>
          </View>
        </View>

        {/* Feature Rows */}
        {FREE_VS_PREMIUM.map((row) => (
          <View key={row.feature} style={styles.featureRow}>
            <View style={styles.featureNameCol}>
              <MaterialCommunityIcons
                name={row.icon as any}
                size={16}
                color={colors.onSurfaceVariant}
              />
              <Text style={styles.featureName}>{row.feature}</Text>
            </View>
            <View style={styles.freeValueCol}>
              {renderCellValue(row.free, false)}
            </View>
            <View style={styles.premiumValueCol}>
              {renderCellValue(row.premium, true)}
            </View>
          </View>
        ))}
      </View>

      {/* Monthly Pricing Tier */}
      <View style={styles.monthlyCard}>
        <Text style={styles.tierLabel}>Monthly</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>$4.99</Text>
          <Text style={styles.pricePeriod}>/mo</Text>
        </View>
        <Text style={styles.tierSubtitle}>Flexible planning for individual creators.</Text>
        <Pressable
          style={styles.monthlyButton}
          onPress={handleUpgrade}
          disabled={checkoutLoading}
          testID="subscription-upgrade-monthly"
        >
          {checkoutLoading ? (
            <ActivityIndicator size={18} color={colors.primary} />
          ) : (
            <Text style={styles.monthlyButtonText}>Get Monthly</Text>
          )}
        </Pressable>
      </View>

      {/* BEST VALUE Badge */}
      <View style={styles.bestValueBadge}>
        <Text style={styles.bestValueText}>BEST VALUE</Text>
      </View>

      {/* Yearly Pricing Tier */}
      <View style={styles.yearlyCard}>
        <Text style={styles.yearlyTierLabel}>Yearly</Text>
        <View style={styles.priceRow}>
          <Text style={styles.yearlyPriceAmount}>$39.99</Text>
          <Text style={styles.yearlyPricePeriod}>/yr</Text>
        </View>
        <Text style={styles.yearlySaveText}>Save 33% annually</Text>
        <Text style={styles.yearlySubtitle}>Full access for the dedicated home chef.</Text>
        <Pressable
          style={styles.yearlyButton}
          onPress={handleYearlyUpgrade}
          testID="subscription-upgrade-yearly"
        >
          <Text style={styles.yearlyButtonText}>Upgrade to Premium</Text>
        </Pressable>
      </View>

      {/* Secure checkout note */}
      <View style={styles.secureNote}>
        <View style={styles.secureRow}>
          <MaterialCommunityIcons name="lock-outline" size={14} color={colors.onSurfaceVariant} />
          <Text style={styles.secureText}>Secure checkout via App Store</Text>
        </View>
        <Text style={styles.disclaimerText}>
          Subscription automatically renews unless canceled 24 hours before the end of the period. Manage in Account Settings.
        </Text>
      </View>

      {/* Checkout loading indicator */}
      {checkoutLoading && (
        <Text style={styles.checkoutLoadingText}>Preparing secure checkout...</Text>
      )}

      {/* Checkout error display */}
      {checkoutError && (
        <View style={styles.errorCard}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorHeading}>Payment could not be completed</Text>
          <Text style={styles.errorBody}>Your card was not charged. Please check your payment details and try again.</Text>
          <Button variant="secondary" size="md" onPress={handleUpgrade}>Retry Payment</Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  // Premium view styles
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
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#ffdad6',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  warningContent: { flex: 1, gap: spacing.sm },
  warningText: { ...typography.bodyMd, color: colors.onSurface },
  canceledBanner: {
    backgroundColor: '#eae8e4',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  canceledText: { ...typography.bodyMd, color: colors.onSurface },

  // Compare Plans section
  comparePlansSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  comparePlansTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  comparePlansSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerFeatureLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  headerFreeCol: {
    width: 60,
    alignItems: 'center',
  },
  headerColLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  headerPremiumCol: {
    width: 70,
    alignItems: 'center',
  },
  headerPremiumLabel: {
    ...typography.labelSm,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  featureNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  featureName: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  freeValueCol: {
    width: 60,
    alignItems: 'center',
  },
  premiumValueCol: {
    width: 70,
    alignItems: 'center',
  },
  dashText: {
    ...typography.bodyMd,
    color: colors.outlineVariant,
  },
  unlimitedText: {
    ...typography.bodySm,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  cellText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },

  // Monthly pricing tier
  monthlyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  tierLabel: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  priceAmount: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  pricePeriod: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  tierSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  monthlyButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  monthlyButtonText: {
    ...typography.titleMd,
    color: colors.primary,
  },

  // BEST VALUE badge
  bestValueBadge: {
    backgroundColor: colors.primaryFixed,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'center',
    marginBottom: -spacing.sm,
    marginTop: spacing.lg,
    zIndex: 1,
  },
  bestValueText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },

  // Yearly pricing tier
  yearlyCard: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  yearlyTierLabel: {
    ...typography.titleMd,
    color: colors.onSecondary,
  },
  yearlyPriceAmount: {
    ...typography.headlineLg,
    color: colors.onSecondary,
  },
  yearlyPricePeriod: {
    ...typography.bodyMd,
    color: colors.onSecondary,
  },
  yearlySaveText: {
    ...typography.bodySm,
    color: colors.onSecondary,
    fontStyle: 'italic',
    textDecorationLine: 'underline',
    marginTop: spacing.xs,
  },
  yearlySubtitle: {
    ...typography.bodySm,
    color: colors.onSecondary,
    marginTop: spacing.xs,
  },
  yearlyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  yearlyButtonText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },

  // Secure checkout note
  secureNote: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  secureText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  disclaimerText: {
    ...typography.bodySm,
    fontSize: 10,
    color: colors.outlineVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Checkout states
  checkoutLoadingText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  errorCard: {
    backgroundColor: '#ffdad6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  errorHeading: { ...typography.bodyMd, color: colors.onSurface },
  errorBody: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },
});
