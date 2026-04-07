import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSocialStore } from '../../stores/socialStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { supabase } from '../../lib/supabase';
import { uploadMealPhoto } from '../../lib/feedHelpers';
import { FeedCard } from './FeedCard';
import { CommentSheet } from './CommentSheet';
import { EmptyState } from '../ui/EmptyState';
import { CameraSheet } from '../camera/CameraSheet';
import { FeedPost } from '../../types/database';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { TAB_BAR_HEIGHT } from '../../lib/constants';

interface FeedListProps {
  myKitchenId: string;
}

type KitchenProfileLookup = Map<string, { display_name: string; avatar_url: string | null }>;

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
  } = useSocialStore();

  const { activeHouseholdId } = useHouseholdStore();

  const [kitchenProfiles, setKitchenProfiles] = useState<KitchenProfileLookup>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const [cameraSheetOpen, setCameraSheetOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const profilesFetched = useRef(false);

  // Load initial feed and blocked kitchens on mount
  useEffect(() => {
    if (myKitchenId) {
      fetchFeedPosts(myKitchenId);
      fetchBlockedKitchens(myKitchenId);
    }
  }, [myKitchenId]);

  // Batch-fetch kitchen profiles for all unique kitchen_ids in feed
  useEffect(() => {
    if (feedPosts.length === 0) return;

    const uniqueIds = [...new Set(feedPosts.map((p) => p.kitchen_id))];
    const missingIds = uniqueIds.filter((id) => !kitchenProfiles.has(id));

    if (missingIds.length === 0) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('kitchen_profiles')
          .select('id, display_name, avatar_url')
          .in('id', missingIds);

        if (error || !data) return;

        setKitchenProfiles((prev) => {
          const next = new Map(prev);
          for (const profile of data) {
            next.set(profile.id, {
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
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
        onPhotoAttach={() => handlePhotoAttach(item.id)}
      />
    ),
    [kitchenProfiles, myKitchenId, router, handlePhotoAttach, likedPostIds, toggleLike, saveRecipeFromPost, householdId]
  );

  const keyExtractor = useCallback((item: FeedPost) => item.id, []);

  return (
    <View style={s.container}>
      <FlatList
        data={feedPosts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
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
});
