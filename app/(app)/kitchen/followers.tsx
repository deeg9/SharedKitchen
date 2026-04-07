import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSocialStore } from '../../../src/stores/socialStore';
import { KitchenProfile } from '../../../src/types/database';
import { colors } from '../../../src/theme/colors';
import { typography, fontFamily } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';

type Segment = 'followers' | 'following';

export default function FollowersScreen() {
  const { kitchenId, tab } = useLocalSearchParams<{
    kitchenId: string;
    tab: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    followers,
    following,
    followListLoading,
    fetchFollowers,
    fetchFollowing,
    clearFollowLists,
    myKitchenProfile,
    followKitchen,
    unfollowKitchen,
  } = useSocialStore();

  const [activeSegment, setActiveSegment] = useState<Segment>(
    tab === 'following' ? 'following' : 'followers'
  );

  // Set of kitchen IDs that the current user follows (for inline button state)
  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!kitchenId) return;

    // Fetch both lists in parallel
    fetchFollowers(kitchenId);
    fetchFollowing(kitchenId);

    // Also fetch the current user's following list for button state
    if (myKitchenProfile) {
      (async () => {
        const { data } = await (await import('../../../src/lib/supabase')).supabase
          .from('follows')
          .select('following_kitchen_id')
          .eq('follower_kitchen_id', myKitchenProfile.id);

        if (data) {
          setMyFollowingIds(
            new Set(data.map((r: { following_kitchen_id: string }) => r.following_kitchen_id))
          );
        }
      })();
    }

    return () => {
      clearFollowLists();
    };
  }, [kitchenId]);

  const handleFollowToggle = useCallback(
    async (targetId: string) => {
      if (!myKitchenProfile || actionLoading.has(targetId)) return;

      setActionLoading((prev) => new Set(prev).add(targetId));

      const isCurrentlyFollowing = myFollowingIds.has(targetId);

      // Optimistic update
      setMyFollowingIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.delete(targetId);
        } else {
          next.add(targetId);
        }
        return next;
      });

      try {
        if (isCurrentlyFollowing) {
          await unfollowKitchen(myKitchenProfile.id, targetId);
        } else {
          await followKitchen(myKitchenProfile.id, targetId);
        }
      } catch {
        // Rollback on error
        setMyFollowingIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyFollowing) {
            next.add(targetId);
          } else {
            next.delete(targetId);
          }
          return next;
        });
      } finally {
        setActionLoading((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }
    },
    [myKitchenProfile, myFollowingIds, actionLoading, followKitchen, unfollowKitchen]
  );

  const activeList = activeSegment === 'followers' ? followers : following;

  const renderItem = useCallback(
    ({ item }: { item: KitchenProfile }) => {
      const initials = item.display_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const isOwnKitchen = myKitchenProfile?.id === item.id;
      const isFollowingItem = myFollowingIds.has(item.id);
      const isItemLoading = actionLoading.has(item.id);

      return (
        <Pressable
          style={({ pressed }) => [s.row, pressed && s.rowPressed]}
          onPress={() => router.push(`/kitchen/${item.id}` as any)}
          testID={`follower-row-${item.id}`}
        >
          {/* Avatar */}
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={s.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.initials}>{initials}</Text>
            </View>
          )}

          {/* Text */}
          <View style={s.textContainer}>
            <Text style={s.name} numberOfLines={1}>
              {item.display_name}
            </Text>
            <Text style={s.subtitle}>
              {item.follower_count ?? 0}{' '}
              {(item.follower_count ?? 0) === 1 ? 'follower' : 'followers'}
            </Text>
          </View>

          {/* Follow/Following button (not shown for own kitchen) */}
          {!isOwnKitchen && (
            <Pressable
              style={({ pressed }) => [
                s.followBtn,
                isFollowingItem ? s.followBtnFollowing : s.followBtnFollow,
                pressed && s.followBtnPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                handleFollowToggle(item.id);
              }}
              disabled={isItemLoading}
              testID={`follow-btn-${item.id}`}
            >
              {isItemLoading ? (
                <ActivityIndicator size="small" color={isFollowingItem ? colors.primary : colors.onPrimary} />
              ) : (
                <Text
                  style={[
                    s.followBtnText,
                    isFollowingItem ? s.followBtnTextFollowing : s.followBtnTextFollow,
                  ]}
                >
                  {isFollowingItem ? 'Following' : 'Follow'}
                </Text>
              )}
            </Pressable>
          )}
        </Pressable>
      );
    },
    [myKitchenProfile, myFollowingIds, actionLoading, handleFollowToggle, router]
  );

  const keyExtractor = useCallback((item: KitchenProfile) => item.id, []);

  const emptyMessage =
    activeSegment === 'followers' ? 'No followers yet' : 'Not following anyone yet';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/plan' as any)
          }
          style={s.headerBtn}
          testID="followers-close"
        >
          <MaterialCommunityIcons name="close" size={22} color={colors.primary} />
        </Pressable>
        <Text style={s.headerTitle}>Followers</Text>
        <View style={s.headerBtnPlaceholder} />
      </View>

      {/* Segmented control */}
      <View style={s.segmentContainer}>
        <Pressable
          style={[
            s.segmentTab,
            activeSegment === 'followers' && s.segmentTabActive,
          ]}
          onPress={() => setActiveSegment('followers')}
          testID="segment-followers"
        >
          <Text
            style={[
              s.segmentText,
              activeSegment === 'followers' && s.segmentTextActive,
            ]}
          >
            Followers
          </Text>
        </Pressable>
        <Pressable
          style={[
            s.segmentTab,
            activeSegment === 'following' && s.segmentTabActive,
          ]}
          onPress={() => setActiveSegment('following')}
          testID="segment-following"
        >
          <Text
            style={[
              s.segmentText,
              activeSegment === 'following' && s.segmentTextActive,
            ]}
          >
            Following
          </Text>
        </Pressable>
      </View>

      {/* List */}
      {followListLoading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeList.length === 0 ? (
        <View style={s.centered}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={48}
            color={colors.outlineVariant}
          />
          <Text style={s.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={activeList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
          showsVerticalScrollIndicator={false}
        />
      )}
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

  // Segmented control
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  segmentTabActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  segmentTextActive: {
    color: colors.onPrimary,
  },

  // List rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 60,
  },
  rowPressed: {
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

  // Follow button
  followBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnFollow: {
    backgroundColor: colors.primary,
  },
  followBtnFollowing: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  followBtnPressed: {
    opacity: 0.85,
  },
  followBtnText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
  },
  followBtnTextFollow: {
    color: colors.onPrimary,
  },
  followBtnTextFollowing: {
    color: colors.primary,
  },

  // Empty / loading
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
});
