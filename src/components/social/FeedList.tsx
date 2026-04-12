import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Alert, ActionSheetIOS, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSocialStore } from '../../stores/socialStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { usePlanStore } from '../../stores/planStore';
import { supabase } from '../../lib/supabase';
import { uploadMealPhoto } from '../../lib/feedHelpers';
import { FeedCard } from './FeedCard';
import { FollowingStrip } from './FollowingStrip';
import { CommentSheet } from './CommentSheet';
import { MealSlotPickerSheet } from '../meal-logging/MealSlotPickerSheet';
import { EmptyState } from '../ui/EmptyState';
import { CameraSheet } from '../camera/CameraSheet';
import { FeedPost, MealType } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { TAB_BAR_HEIGHT } from '../../lib/constants';

interface FeedListProps {
  myKitchenId: string;
}

type KitchenProfileLookup = Map<string, { display_name: string; avatar_url: string | null; handle?: string | null }>;

export function FeedList({ myKitchenId }: FeedListProps) {
  const router = useRouter();
  const {
    feedPosts,
    feedLoading,
    feedHasMore,
    feedCursor,
    fetchFeedPosts,
    refreshFeed,
    toggleLike,
    saveRecipeFromPost,
    likedPostIds,
    fetchBlockedKitchens,
    reportContent,
    blockKitchen,
    following,
    fetchFollowing,
  } = useSocialStore();

  const { activeHouseholdId } = useHouseholdStore();

  const [kitchenProfiles, setKitchenProfiles] = useState<KitchenProfileLookup>(new Map());
  const [postParticipants, setPostParticipants] = useState<Map<string, Array<{ handle: string | null; user_id: string }>>>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const [cameraSheetOpen, setCameraSheetOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [cookThisPost, setCookThisPost] = useState<FeedPost | null>(null);
  const profilesFetched = useRef(false);

  // Load initial feed and blocked kitchens on mount
  useEffect(() => {
    if (myKitchenId) {
      fetchFeedPosts(myKitchenId);
      fetchBlockedKitchens(myKitchenId);
    }
  }, [myKitchenId]);

  // Fetch following list for the avatar strip
  useEffect(() => {
    if (myKitchenId && following.length === 0) {
      fetchFollowing(myKitchenId);
    }
  }, [myKitchenId]);

  // Batch-fetch co-cook participants for cook_log posts
  useEffect(() => {
    const cookLogIds = feedPosts
      .filter((p) => p.post_type === 'cook_log' && p.cook_log_id)
      .map((p) => p.cook_log_id as string);

    if (cookLogIds.length === 0) return;

    const missingIds = cookLogIds.filter((id) => !postParticipants.has(id));
    if (missingIds.length === 0) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('cook_log_participants')
          .select('cook_log_id, user_id, profiles:user_id(handle)')
          .in('cook_log_id', missingIds);

        if (error || !data) return;

        setPostParticipants((prev) => {
          const newMap = new Map(prev);
          for (const row of data) {
            const clId = row.cook_log_id;
            if (!newMap.has(clId)) newMap.set(clId, []);
            const profileData = row.profiles as unknown as { handle: string | null } | null;
            newMap.get(clId)!.push({
              handle: profileData?.handle ?? null,
              user_id: row.user_id,
            });
          }
          return newMap;
        });
      } catch {
        // Non-critical: feed cards will render without co-cook line
      }
    })();
  }, [feedPosts]);

  // Batch-fetch kitchen profiles for all unique kitchen_ids in feed
  useEffect(() => {
    if (feedPosts.length === 0) return;

    const uniqueIds = [...new Set(feedPosts.map((p) => p.kitchen_id))];
    const missingIds = uniqueIds.filter((id) => !kitchenProfiles.has(id));

    if (missingIds.length === 0) return;

    (async () => {
      try {
        // Fetch kitchen profiles with household_id for handle lookup
        const { data: kitchens, error } = await supabase
          .from('kitchen_profiles')
          .select('id, display_name, avatar_url, household_id')
          .in('id', missingIds);

        if (error || !kitchens) return;

        // Fetch first member's handle for each household (admin = earliest member)
        const householdIds = kitchens.map((k) => k.household_id);
        const { data: members } = await supabase
          .from('household_members')
          .select('household_id, profiles!inner(handle)')
          .in('household_id', householdIds)
          .order('created_at', { ascending: true });

        // Build household -> handle lookup (first member = admin)
        const handleByHousehold = new Map<string, string | null>();
        if (members) {
          for (const m of members) {
            if (!handleByHousehold.has(m.household_id)) {
              handleByHousehold.set(m.household_id, (m.profiles as any)?.handle ?? null);
            }
          }
        }

        setKitchenProfiles((prev) => {
          const next = new Map(prev);
          for (const profile of kitchens) {
            next.set(profile.id, {
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              handle: handleByHousehold.get(profile.household_id) ?? null,
            });
          }
          return next;
        });
      } catch {
        // Non-critical: cards will show fallback "Kitchen" name
      }
    })();
  }, [feedPosts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFeed(myKitchenId);
    setRefreshing(false);
  }, [myKitchenId, refreshFeed]);

  const handleEndReached = useCallback(() => {
    if (feedHasMore && !feedLoading && feedCursor) {
      fetchFeedPosts(myKitchenId, feedCursor);
    }
  }, [feedHasMore, feedLoading, feedCursor, myKitchenId, fetchFeedPosts]);

  const handlePhotoAttach = useCallback((postId: string) => {
    setActivePostId(postId);
    setCameraSheetOpen(true);
  }, []);

  const handleImageCaptured = useCallback(
    async (uri: string) => {
      setCameraSheetOpen(false);
      if (!activePostId) return;

      await uploadMealPhoto(activePostId, uri);
      // Refresh feed to show the newly attached photo
      await refreshFeed(myKitchenId);
      setActivePostId(null);
    },
    [activePostId, myKitchenId, refreshFeed]
  );

  const householdId = activeHouseholdId ?? '';

  // Long-press action sheet for report/block
  const handleLongPress = useCallback((post: FeedPost) => {
    if (post.kitchen_id === myKitchenId) return; // Don't report/block own posts

    const options = ['Report Post', 'Block Kitchen', 'Cancel'];
    const cancelIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: 1 },
        (index) => {
          if (index === 0) {
            reportContent(myKitchenId, 'post', post.id);
            Alert.alert('Reported', 'Thank you for reporting. We will review this content.');
          } else if (index === 1) {
            Alert.alert(
              'Block Kitchen',
              'You will no longer see posts from this kitchen. You can unblock from settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Block',
                  style: 'destructive',
                  onPress: () => blockKitchen(myKitchenId, post.kitchen_id),
                },
              ]
            );
          }
        }
      );
    } else {
      // Android fallback with Alert
      Alert.alert('Options', undefined, [
        { text: 'Report Post', onPress: () => {
          reportContent(myKitchenId, 'post', post.id);
          Alert.alert('Reported', 'Thank you for reporting.');
        }},
        { text: 'Block Kitchen', style: 'destructive', onPress: () => {
          blockKitchen(myKitchenId, post.kitchen_id);
        }},
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [myKitchenId, reportContent, blockKitchen]);

  // Cook This Too handlers
  const handleCookThisToo = useCallback((post: FeedPost) => {
    setCookThisPost(post);
    setSlotPickerOpen(true);
  }, []);

  const handleSlotSelect = useCallback(async (date: string, mealType: MealType) => {
    setSlotPickerOpen(false);
    if (!cookThisPost) return;

    // Step 1: Save recipe to library
    const savedRecipe = await saveRecipeFromPost(cookThisPost, myKitchenId, householdId);
    if (!savedRecipe) {
      Alert.alert('Error', 'Could not save recipe.');
      return;
    }

    // Step 2: Assign to meal plan
    await usePlanStore.getState().assignRecipe(householdId, date, mealType, savedRecipe.id);
    Alert.alert('Added!', `"${cookThisPost.recipe_name}" saved and added to your plan.`);
    setCookThisPost(null);
  }, [cookThisPost, myKitchenId, householdId, saveRecipeFromPost]);

  const renderItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <FeedCard
        post={item}
        kitchenProfile={kitchenProfiles.get(item.kitchen_id)}
        isOwnPost={item.kitchen_id === myKitchenId}
        isLiked={likedPostIds.includes(item.id)}
        onKitchenPress={() => router.push(`/kitchen/${item.kitchen_id}` as any)}
        onRecipePress={() => {
          // TODO: Recipe detail navigation deferred
        }}
        onLikePress={() => toggleLike(item.id, myKitchenId)}
        onCommentPress={() => {
          setActiveCommentPostId(item.id);
          setCommentSheetOpen(true);
        }}
        onSavePress={async () => {
          const result = await saveRecipeFromPost(item, myKitchenId, householdId);
          if (result) {
            Alert.alert('Recipe Saved', `"${item.recipe_name}" saved to your library`);
          } else {
            Alert.alert('Error', 'Could not save recipe. It may not be available.');
          }
        }}
        onLongPress={() => handleLongPress(item)}
        onCookThisToo={item.kitchen_id !== myKitchenId ? () => handleCookThisToo(item) : undefined}
        onPhotoAttach={() => handlePhotoAttach(item.id)}
        participants={item.cook_log_id ? postParticipants.get(item.cook_log_id) : undefined}
        onProfilePress={(userId) => router.push(`/user/${userId}` as any)}
      />
    ),
    [kitchenProfiles, myKitchenId, router, handlePhotoAttach, likedPostIds, toggleLike, saveRecipeFromPost, householdId, handleLongPress, handleCookThisToo, postParticipants]
  );

  const keyExtractor = useCallback((item: FeedPost) => item.id, []);

  const listHeader = useCallback(() => (
    <View>
      <View style={s.feedHeaderTitle} testID="feed-header-title">
        <Text style={s.feedTitle}>Feed</Text>
      </View>
      <FollowingStrip
        following={following}
        onKitchenPress={(kitchenId) => router.push(`/kitchen/${kitchenId}` as any)}
      />
    </View>
  ), [following, router]);

  return (
    <View style={s.container}>
      <FlatList
        data={feedPosts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListFooterComponent={
          feedLoading && feedPosts.length > 0 ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={s.footer}
            />
          ) : null
        }
        ListEmptyComponent={
          feedLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={s.loading}
            />
          ) : (
            <EmptyState
              icon="food-off"
              title="No meals in your feed yet"
              subtitle="Follow kitchens to see what they're eating"
              actionLabel="Find Kitchens"
              onAction={() => {
                // Navigate back to plan tab and hint to open search
                // The search icon is always visible on the plan tab
              }}
              style={s.emptyState}
            />
          )
        }
        contentContainerStyle={
          feedPosts.length === 0 ? s.emptyContainer : s.contentContainer
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Camera sheet for photo attachment on own posts */}
      <CameraSheet
        isOpen={cameraSheetOpen}
        onClose={() => {
          setCameraSheetOpen(false);
          setActivePostId(null);
        }}
        onImageCaptured={handleImageCaptured}
      />

      {/* Comment sheet */}
      <CommentSheet
        isOpen={commentSheetOpen}
        onClose={() => {
          setCommentSheetOpen(false);
          setActiveCommentPostId(null);
        }}
        postId={activeCommentPostId ?? ''}
        myKitchenId={myKitchenId}
        kitchenProfiles={kitchenProfiles}
      />

      {/* Meal slot picker for Cook This Too */}
      <MealSlotPickerSheet
        isOpen={slotPickerOpen}
        dishName={cookThisPost?.recipe_name ?? ''}
        onClose={() => {
          setSlotPickerOpen(false);
          setCookThisPost(null);
        }}
        onSelect={handleSlotSelect}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.md,
    paddingBottom: TAB_BAR_HEIGHT + spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: TAB_BAR_HEIGHT,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
  loading: {
    paddingVertical: spacing.xxl,
  },
  emptyState: {
    paddingHorizontal: spacing.lg,
  },
  feedHeaderTitle: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  feedTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
});
