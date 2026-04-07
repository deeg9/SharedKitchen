import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { KitchenProfileCard } from '../../../src/components/social/KitchenProfileCard';
import { useSocialStore } from '../../../src/stores/socialStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { colors } from '../../../src/theme/colors';
import { typography, fontFamily } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';

export default function KitchenProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    viewedProfile,
    loading,
    fetchKitchenProfile,
    clearViewedProfile,
  } = useSocialStore();

  const activeHousehold = useHouseholdStore((s) => s.activeHousehold());
  const myKitchenProfile = useSocialStore((s) => s.myKitchenProfile);

  useEffect(() => {
    if (id) {
      fetchKitchenProfile(id);
    }
    return () => {
      clearViewedProfile();
    };
  }, [id]);

  const isOwnProfile =
    viewedProfile != null &&
    myKitchenProfile != null &&
    viewedProfile.id === myKitchenProfile.id;

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
});
