import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '../ui/Avatar';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface CreatorAttributionProps {
  handle: string;
  avatarUrl?: string | null;
  creatorId: string;
}

export function CreatorAttribution({ handle, avatarUrl, creatorId }: CreatorAttributionProps) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push(`/(app)/user/${creatorId}`)}
      accessibilityRole="button"
      accessibilityLabel={`Created by @${handle}, view profile`}
    >
      <Avatar uri={avatarUrl} name={handle} size="sm" />
      <Text style={styles.text}>Created by @{handle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.labelLg,
    color: colors.primary,
  },
});
