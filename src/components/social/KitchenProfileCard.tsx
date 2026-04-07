import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { KitchenProfileWithRecipeCount } from '../../types/database';

interface KitchenProfileCardProps {
  profile: KitchenProfileWithRecipeCount;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function KitchenProfileCard({
  profile,
  isOwnProfile,
  onEditProfile,
}: KitchenProfileCardProps) {
  return (
    <View style={s.container}>
      {/* Avatar */}
      <View style={s.avatarContainer}>
        {profile.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={s.avatar}
            contentFit="cover"
            transition={200}
            testID="kitchen-profile-avatar"
          />
        ) : (
          <View style={[s.avatar, s.avatarPlaceholder]}>
            <Text style={s.avatarInitials}>
              {getInitials(profile.display_name)}
            </Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={s.displayName} testID="kitchen-profile-name">
        {profile.display_name}
      </Text>

      {/* Bio */}
      {profile.bio ? (
        <Text style={s.bio} numberOfLines={2} testID="kitchen-profile-bio">
          {profile.bio}
        </Text>
      ) : null}

      {/* Stats Row */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue} testID="kitchen-profile-recipe-count">
            {profile.recipe_count}
          </Text>
          <Text style={s.statLabel}>Recipes</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue} testID="kitchen-profile-follower-count">
            {profile.follower_count}
          </Text>
          <Text style={s.statLabel}>Followers</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue} testID="kitchen-profile-following-count">
            {profile.following_count}
          </Text>
          <Text style={s.statLabel}>Following</Text>
        </View>
      </View>

      {/* Action Button */}
      {isOwnProfile ? (
        <Pressable
          style={s.editButton}
          onPress={onEditProfile}
          testID="kitchen-profile-edit-button"
        >
          <Text style={s.editButtonText}>Edit Profile</Text>
        </Pressable>
      ) : (
        <View style={s.followButtonDisabled}>
          <Text style={s.followButtonDisabledText}>Follow</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },

  // Avatar
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },

  // Name & Bio
  displayName: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.25,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  bio: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.sm,
  },

  // Buttons
  editButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  editButtonText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  followButtonDisabled: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.outlineVariant,
    opacity: 0.6,
  },
  followButtonDisabledText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
});
