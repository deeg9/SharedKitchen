import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSubscriptionStore, SubscriptionStatus } from '../../stores/subscriptionStore';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';

interface PremiumBadgeProps {
  size?: 'small' | 'large';
  statusOverride?: SubscriptionStatus;
}

export function PremiumBadge({ size = 'small', statusOverride }: PremiumBadgeProps) {
  const storeStatus = useSubscriptionStore((s) => s.status);
  const status = statusOverride ?? storeStatus;

  if (status === 'free') return null;

  const isLarge = size === 'large';

  const badgeConfig: Record<string, { text: string; bg: string; textColor: string }> = {
    active: { text: 'PRO', bg: colors.secondary, textColor: '#ffffff' },
    past_due: { text: 'PAST DUE', bg: colors.error, textColor: '#ffffff' },
    canceled: { text: 'CANCELED', bg: colors.outlineVariant, textColor: colors.onSurface },
    trialing: { text: 'TRIAL', bg: '#d3e8d5', textColor: colors.primary },
  };

  const config = badgeConfig[status] ?? badgeConfig.active;

  return (
    <View style={[styles.badge, isLarge && styles.badgeLarge, { backgroundColor: config.bg }]}>
      {status === 'active' && (
        <MaterialCommunityIcons
          name="crown"
          size={isLarge ? 16 : 12}
          color={config.textColor}
        />
      )}
      <Text style={[styles.text, isLarge && styles.textLarge, { color: config.textColor }]}>
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 3,
  },
  badgeLarge: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  text: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  textLarge: {
    fontSize: 13,
  },
});
