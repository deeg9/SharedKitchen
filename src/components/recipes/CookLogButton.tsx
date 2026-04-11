import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CookLogButtonProps {
  onPress: () => void;
}

export function CookLogButton({ onPress }: CookLogButtonProps) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={styles.button}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="I cooked this, log a cook"
    >
      <MaterialCommunityIcons name="pot-steam" size={20} color={colors.onPrimary} />
      <Text style={styles.label}>I Cooked This</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 48,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
  label: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});
