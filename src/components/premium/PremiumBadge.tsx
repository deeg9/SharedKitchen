import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePremiumStore } from '../../stores/premiumStore';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';

interface PremiumBadgeProps {
  size?: 'small' | 'large';
}

export function PremiumBadge({ size = 'small' }: PremiumBadgeProps) {
  const isPremium = usePremiumStore((s) => s.isPremium);

  if (!isPremium()) return null;

  const isLarge = size === 'large';

  return (
    <View style={[styles.badge, isLarge && styles.badgeLarge]}>
      <MaterialCommunityIcons
        name="crown"
        size={isLarge ? 16 : 12}
        color="#ffffff"
      />
      <Text style={[styles.text, isLarge && styles.textLarge]}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
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
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  textLarge: {
    fontSize: 13,
  },
});
