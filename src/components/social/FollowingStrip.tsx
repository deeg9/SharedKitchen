import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface FollowingItem {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface FollowingStripProps {
  following: FollowingItem[];
  onKitchenPress: (kitchenId: string) => void;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function FollowingStrip({ following, onKitchenPress }: FollowingStripProps) {
  if (following.length === 0) return null;

  return (
    <View style={s.container} testID="following-avatar-strip">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {following.map((kitchen) => (
          <Pressable
            key={kitchen.id}
            onPress={() => onKitchenPress(kitchen.id)}
            style={s.item}
          >
            {kitchen.avatar_url ? (
              <Image
                source={{ uri: kitchen.avatar_url }}
                style={s.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]}>
                <Text style={s.avatarInitial}>{getInitial(kitchen.display_name)}</Text>
              </View>
            )}
            <Text style={s.name} numberOfLines={1}>
              {kitchen.display_name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  item: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 56,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  name: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    maxWidth: 56,
    textAlign: 'center',
    textTransform: 'none',
  },
});
