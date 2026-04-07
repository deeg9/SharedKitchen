import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KitchenProfile } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface KitchenSearchResultProps {
  profile: KitchenProfile;
  onPress: (kitchenId: string) => void;
}

export function KitchenSearchResult({ profile, onPress }: KitchenSearchResultProps) {
  const initials = profile.display_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => onPress(profile.id)}
      testID={`search-result-${profile.id}`}
    >
      {/* Avatar */}
      {profile.avatar_url ? (
        <Image
          source={{ uri: profile.avatar_url }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {profile.display_name}
        </Text>
        <Text style={styles.subtitle}>
          {profile.follower_count ?? 0} {(profile.follower_count ?? 0) === 1 ? 'follower' : 'followers'}
        </Text>
      </View>

      {/* Chevron */}
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.onSurfaceVariant}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 60,
  },
  pressed: {
    backgroundColor: colors.surfaceContainerLow,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    color: colors.onPrimary,
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
});
