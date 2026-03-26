import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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
        disabled={checkoutLoading}
        style={styles.upgradeButton}
        testID="subscription-upgrade-button"
      >
        {checkoutLoading ? <ActivityIndicator size={18} color="#ffffff" /> : 'Upgrade to Premium'}
      </Button>
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
