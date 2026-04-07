import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { KitchenProfileCard } from '../../../src/components/social/KitchenProfileCard';
import { useSocialStore } from '../../../src/stores/socialStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { colors } from '../../../src/theme/colors';
import { typography, fontFamily } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';

export default function KitchenProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    viewedProfile,
    loading,
    fetchKitchenProfile,
    getOrCreateKitchenProfile,
    myKitchenProfile,
    clearViewedProfile,
  } = useSocialStore();

  const activeHousehold = useHouseholdStore((s) => s.activeHousehold());
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id === 'me') {
      // Load own profile via lazy creation
      if (activeHouseholdId && activeHousehold?.name) {
        getOrCreateKitchenProfile(activeHouseholdId, activeHousehold.name).then(
          (profile) => {
            if (profile) {
              fetchKitchenProfile(profile.id);
            }
          }
        );
      }
    } else if (id) {
      fetchKitchenProfile(id);
    }
    return () => {
      clearViewedProfile();
    };
  }, [id, activeHouseholdId]);

  const isOwnProfile =
    viewedProfile != null &&
    activeHouseholdId != null &&
    viewedProfile.household_id === activeHouseholdId;

  const inviteCode = isOwnProfile ? viewedProfile.invite_code : null;

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const handleShareInvite = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Follow my kitchen on SharedKitchen! Use code: ${inviteCode}`,
      });
    } catch {
      // User cancelled share
    }
  };

  if (loading || !viewedProfile) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/plan')
            }
            style={s.headerBtn}
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.primary} />
          </Pressable>
        </View>
        {/* Loading skeleton */}
        <View style={s.skeletonContainer}>
          <Skeleton height={96} width={96} borderRadius={borderRadius.full} />
          <Skeleton.Text width="50%" style={{ marginTop: spacing.md }} />
          <Skeleton.Text width="70%" style={{ marginTop: spacing.sm }} />
          <View style={s.skeletonStats}>
            <Skeleton height={60} borderRadius={borderRadius.lg} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/plan')
          }
          style={s.headerBtn}
          testID="kitchen-profile-close"
        >
          <MaterialCommunityIcons name="close" size={22} color={colors.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Kitchen Profile</Text>
        <View style={s.headerBtnPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        {/* Multi-household context label */}
        {isOwnProfile && activeHousehold ? (
          <View style={s.contextBanner}>
            <MaterialCommunityIcons
              name="home-variant-outline"
              size={14}
              color={colors.onSurfaceVariant}
            />
            <Text style={s.contextText}>
              Viewing as {activeHousehold.name}
            </Text>
          </View>
        ) : null}

        <KitchenProfileCard
          profile={viewedProfile}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => {
            // Edit profile sheet will be wired in a later phase
          }}
        />

        {/* Invite sharing section -- only on own profile */}
        {isOwnProfile && inviteCode && (
          <View style={s.inviteSection}>
            <View style={s.inviteTitleRow}>
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={20}
                color={colors.onSurface}
              />
              <Text style={s.inviteTitle}>Share Your Kitchen</Text>
            </View>

            {/* Invite code display */}
            <Pressable onPress={handleCopyCode} style={s.codeBox} testID="invite-code-box">
              <Text style={s.codeText}>{inviteCode}</Text>
              <MaterialCommunityIcons
                name={copied ? 'check' : 'content-copy'}
                size={20}
                color={colors.primary}
              />
            </Pressable>

            {/* Action buttons */}
            <View style={s.inviteActions}>
              <Pressable
                style={({ pressed }) => [s.copyButton, pressed && s.pressed]}
                onPress={handleCopyCode}
                testID="invite-copy-button"
              >
                <MaterialCommunityIcons name="content-copy" size={18} color={colors.secondary} />
                <Text style={s.copyButtonText}>
                  {copied ? 'Copied!' : 'Copy Code'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [s.shareButton, pressed && s.pressed]}
                onPress={handleShareInvite}
                testID="invite-share-button"
              >
                <MaterialCommunityIcons name="share-outline" size={18} color={colors.onPrimary} />
                <Text style={s.shareButtonText}>Share Invite</Text>
              </Pressable>
            </View>

            {/* Search visibility hint */}
            <Text style={s.visibilityHint}>
              Your kitchen is currently {viewedProfile.is_searchable ? 'visible' : 'hidden'} in search.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },

  // Loading skeleton
  skeletonContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  skeletonStats: {
    width: '100%',
    marginTop: spacing.lg,
  },

  // Context banner
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  contextText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },

  // Invite section
  inviteSection: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  inviteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  inviteTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  codeText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 22,
    letterSpacing: 4,
    color: colors.onSurface,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: borderRadius.lg,
  },
  copyButtonText: {
    ...typography.labelLg,
    color: colors.secondary,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    ...shadows.editorial,
  },
  shareButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  pressed: {
    opacity: 0.85,
  },
  visibilityHint: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
