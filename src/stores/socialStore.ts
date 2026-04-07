import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  KitchenProfile,
  KitchenProfileUpdate,
  KitchenProfileWithRecipeCount,
  FeedPost,
  PostComment,
  Recipe,
} from '../types/database';
import { getErrorMessage } from '../lib/errors';

interface SocialState {
  // Profile being viewed (another kitchen's profile)
  viewedProfile: KitchenProfileWithRecipeCount | null;
  // Current user's kitchen profile (for active household)
  myKitchenProfile: KitchenProfile | null;
  // Search
  searchResults: KitchenProfile[];
  searchLoading: boolean;
  // Follow state
  isFollowing: boolean;
  followLoading: boolean;
  // Follower/following lists
  followers: KitchenProfile[];
  following: KitchenProfile[];
  followListLoading: boolean;
  // Feed
  feedPosts: FeedPost[];
  feedLoading: boolean;
  feedCursor: string | null;
  feedHasMore: boolean;
  // Likes
  likedPostIds: string[];
  // Comments
  comments: PostComment[];
  commentsLoading: boolean;
  // Blocked
  blockedKitchenIds: string[];
  // General
  loading: boolean;
  error: string | null;

  // Actions
  fetchKitchenProfile: (kitchenId: string) => Promise<void>;
  fetchMyKitchenProfile: (householdId: string) => Promise<void>;
  getOrCreateKitchenProfile: (
    householdId: string,
    householdName: string
  ) => Promise<KitchenProfile | null>;
  updateKitchenProfile: (
    kitchenId: string,
    updates: KitchenProfileUpdate
  ) => Promise<void>;
  searchKitchens: (query: string) => Promise<void>;
  checkIsFollowing: (myKitchenId: string, targetKitchenId: string) => Promise<void>;
  followKitchen: (myKitchenId: string, targetKitchenId: string) => Promise<void>;
  unfollowKitchen: (myKitchenId: string, targetKitchenId: string) => Promise<void>;
  fetchFollowers: (kitchenId: string) => Promise<void>;
  fetchFollowing: (kitchenId: string) => Promise<void>;
  clearFollowLists: () => void;
  clearFollowState: () => void;
  clearSearch: () => void;
  clearViewedProfile: () => void;
  // Feed actions
  fetchFeedPosts: (myKitchenId: string, cursor?: string) => Promise<void>;
  refreshFeed: (myKitchenId: string) => Promise<void>;
  clearFeed: () => void;
  // Interaction actions
  checkLikedPosts: (myKitchenId: string, postIds: string[]) => Promise<void>;
  toggleLike: (postId: string, myKitchenId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  addComment: (postId: string, myKitchenId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string, postId: string) => Promise<void>;
  clearComments: () => void;
  saveRecipeFromPost: (post: FeedPost, myKitchenId: string, myHouseholdId: string) => Promise<Recipe | null>;
  reportContent: (reporterKitchenId: string, contentType: 'post' | 'comment', postId?: string, commentId?: string, reason?: string) => Promise<void>;
  blockKitchen: (myKitchenId: string, blockedKitchenId: string) => Promise<void>;
  unblockKitchen: (myKitchenId: string, blockedKitchenId: string) => Promise<void>;
  fetchBlockedKitchens: (myKitchenId: string) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  viewedProfile: null,
  myKitchenProfile: null,
  searchResults: [],
  searchLoading: false,
  isFollowing: false,
  followLoading: false,
  followers: [],
  following: [],
  followListLoading: false,
  feedPosts: [],
  feedLoading: false,
  feedCursor: null,
  feedHasMore: true,
  likedPostIds: [],
  comments: [],
  commentsLoading: false,
  blockedKitchenIds: [],
  loading: false,
  error: null,

  fetchKitchenProfile: async (kitchenId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('kitchen_profiles')
        .select('*')
        .eq('id', kitchenId)
        .single();

      if (error) throw error;

      if (data) {
        // Get recipe count from recipes table
        const { count } = await supabase
          .from('recipes')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', data.household_id);

        set({
          viewedProfile: { ...data, recipe_count: count ?? 0 },
          loading: false,
        });
      } else {
        set({ viewedProfile: null, loading: false });
      }
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  fetchMyKitchenProfile: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('kitchen_profiles')
        .select('*')
        .eq('household_id', householdId)
        .maybeSingle();

      if (error) throw error;

      set({ myKitchenProfile: data, loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  getOrCreateKitchenProfile: async (
    householdId: string,
    householdName: string
  ) => {
    set({ loading: true, error: null });
    try {
      // First try to fetch existing profile
      const { data: existing, error: fetchError } = await supabase
        .from('kitchen_profiles')
        .select('*')
        .eq('household_id', householdId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        set({ myKitchenProfile: existing, loading: false });
        return existing;
      }

      // No profile exists -- create one lazily from household name
      const { data: created, error: createError } = await supabase
        .from('kitchen_profiles')
        .insert({ household_id: householdId, display_name: householdName })
        .select()
        .single();

      if (createError) throw createError;

      set({ myKitchenProfile: created, loading: false });
      return created;
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
      return null;
    }
  },

  updateKitchenProfile: async (
    kitchenId: string,
    updates: KitchenProfileUpdate
  ) => {
    set({ loading: true, error: null });
    try {
      const { error: updateError } = await supabase
        .from('kitchen_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', kitchenId);

      if (updateError) throw updateError;

      // Re-fetch to update local state
      const { data, error: fetchError } = await supabase
        .from('kitchen_profiles')
        .select('*')
        .eq('id', kitchenId)
        .single();

      if (fetchError) throw fetchError;

      set({ myKitchenProfile: data, loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  searchKitchens: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], searchLoading: false });
      return;
    }

    set({ searchLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('kitchen_profiles')
        .select('id, display_name, bio, avatar_url, follower_count')
        .eq('is_searchable', true)
        .ilike('display_name', `%${query}%`)
        .limit(20);

      if (error) throw error;

      set({
        searchResults: (data ?? []) as KitchenProfile[],
        searchLoading: false,
      });
    } catch (error: unknown) {
      set({ searchLoading: false, error: getErrorMessage(error) });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], searchLoading: false });
  },

  checkIsFollowing: async (myKitchenId: string, targetKitchenId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_kitchen_id', myKitchenId)
        .eq('following_kitchen_id', targetKitchenId)
        .maybeSingle();

      if (error) throw error;
      set({ isFollowing: !!data });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  followKitchen: async (myKitchenId: string, targetKitchenId: string) => {
    if (get().followLoading) return;
    set({ followLoading: true });

    // Optimistic: set following state and increment counter
    set((state) => ({
      isFollowing: true,
      viewedProfile: state.viewedProfile
        ? { ...state.viewedProfile, follower_count: state.viewedProfile.follower_count + 1 }
        : state.viewedProfile,
    }));

    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_kitchen_id: myKitchenId, following_kitchen_id: targetKitchenId });

      if (error) throw error;
      set({ followLoading: false });
    } catch (error: unknown) {
      // Rollback optimistic update
      set((state) => ({
        isFollowing: false,
        followLoading: false,
        error: getErrorMessage(error),
        viewedProfile: state.viewedProfile
          ? { ...state.viewedProfile, follower_count: Math.max(state.viewedProfile.follower_count - 1, 0) }
          : state.viewedProfile,
      }));
    }
  },

  unfollowKitchen: async (myKitchenId: string, targetKitchenId: string) => {
    if (get().followLoading) return;
    set({ followLoading: true });

    // Optimistic: unset following state and decrement counter
    set((state) => ({
      isFollowing: false,
      viewedProfile: state.viewedProfile
        ? { ...state.viewedProfile, follower_count: Math.max(state.viewedProfile.follower_count - 1, 0) }
        : state.viewedProfile,
    }));

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_kitchen_id', myKitchenId)
        .eq('following_kitchen_id', targetKitchenId);

      if (error) throw error;
      set({ followLoading: false });
    } catch (error: unknown) {
      // Rollback optimistic update
      set((state) => ({
        isFollowing: true,
        followLoading: false,
        error: getErrorMessage(error),
        viewedProfile: state.viewedProfile
          ? { ...state.viewedProfile, follower_count: state.viewedProfile.follower_count + 1 }
          : state.viewedProfile,
      }));
    }
  },

  fetchFollowers: async (kitchenId: string) => {
    set({ followListLoading: true });
    try {
      // Two-step approach: get follower IDs, then fetch profiles
      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('follower_kitchen_id')
        .eq('following_kitchen_id', kitchenId);

      if (followError) throw followError;

      const followerIds = (followRows ?? []).map((r: { follower_kitchen_id: string }) => r.follower_kitchen_id);

      if (followerIds.length === 0) {
        set({ followers: [], followListLoading: false });
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('kitchen_profiles')
        .select('id, display_name, bio, avatar_url, follower_count, following_count, household_id')
        .in('id', followerIds);

      if (profileError) throw profileError;

      set({ followers: (profiles ?? []) as KitchenProfile[], followListLoading: false });
    } catch (error: unknown) {
      set({ followListLoading: false, error: getErrorMessage(error) });
    }
  },

  fetchFollowing: async (kitchenId: string) => {
    set({ followListLoading: true });
    try {
      // Two-step approach: get following IDs, then fetch profiles
      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('following_kitchen_id')
        .eq('follower_kitchen_id', kitchenId);

      if (followError) throw followError;

      const followingIds = (followRows ?? []).map((r: { following_kitchen_id: string }) => r.following_kitchen_id);

      if (followingIds.length === 0) {
        set({ following: [], followListLoading: false });
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('kitchen_profiles')
        .select('id, display_name, bio, avatar_url, follower_count, following_count, household_id')
        .in('id', followingIds);

      if (profileError) throw profileError;

      set({ following: (profiles ?? []) as KitchenProfile[], followListLoading: false });
    } catch (error: unknown) {
      set({ followListLoading: false, error: getErrorMessage(error) });
    }
  },

  clearFollowLists: () => {
    set({ followers: [], following: [], followListLoading: false });
  },

  clearFollowState: () => {
    set({ isFollowing: false, followLoading: false });
  },

  clearViewedProfile: () => {
    set({ viewedProfile: null, isFollowing: false, followLoading: false, followers: [], following: [], followListLoading: false });
  },

  fetchFeedPosts: async (myKitchenId: string, cursor?: string) => {
    set({ feedLoading: true });
    try {
      // Step 1: Get IDs of kitchens I follow
      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('following_kitchen_id')
        .eq('follower_kitchen_id', myKitchenId);

      if (followError) throw followError;

      const followingIds = (followRows ?? []).map(
        (r: { following_kitchen_id: string }) => r.following_kitchen_id
      );

      // Also include own kitchen so user sees their own posts
      followingIds.push(myKitchenId);

      // Filter out blocked kitchens
      const blockedIds = get().blockedKitchenIds;
      const filteredIds = followingIds.filter((id: string) => !blockedIds.includes(id));

      if (filteredIds.length === 0) {
        set({ feedPosts: [], feedLoading: false, feedHasMore: false });
        return;
      }

      // Step 2: Query feed_posts from followed kitchens
      let query = supabase
        .from('feed_posts')
        .select('*')
        .in('kitchen_id', filteredIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Additionally filter out any posts from blocked kitchens (safety net)
      const posts = (data ?? []).filter(
        (p: FeedPost) => !blockedIds.includes(p.kitchen_id)
      ) as FeedPost[];

      if (cursor) {
        // Append for pagination
        set((state) => ({
          feedPosts: [...state.feedPosts, ...posts],
          feedCursor: posts.length > 0 ? posts[posts.length - 1].created_at : state.feedCursor,
          feedHasMore: posts.length === 20,
          feedLoading: false,
        }));
      } else {
        // Replace for initial load / refresh
        set({
          feedPosts: posts,
          feedCursor: posts.length > 0 ? posts[posts.length - 1].created_at : null,
          feedHasMore: posts.length === 20,
          feedLoading: false,
        });
      }

      // Check which posts current user has liked
      const postIds = posts.map((p: FeedPost) => p.id);
      if (postIds.length > 0) {
        await get().checkLikedPosts(myKitchenId, postIds);
      }
    } catch (error: unknown) {
      set({ feedLoading: false, error: getErrorMessage(error) });
    }
  },

  refreshFeed: async (myKitchenId: string) => {
    await get().fetchFeedPosts(myKitchenId);
  },

  clearFeed: () => {
    set({ feedPosts: [], feedCursor: null, feedHasMore: true });
  },

  // --- Interaction methods ---

  checkLikedPosts: async (myKitchenId: string, postIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('kitchen_id', myKitchenId)
        .in('post_id', postIds);

      if (error) throw error;

      const likedIds = (data ?? []).map((r: { post_id: string }) => r.post_id);
      // Merge with existing likedPostIds (for pagination)
      set((state) => {
        const existing = new Set(state.likedPostIds);
        likedIds.forEach((id: string) => existing.add(id));
        return { likedPostIds: Array.from(existing) };
      });
    } catch (error: unknown) {
      console.warn('[socialStore] checkLikedPosts error:', getErrorMessage(error));
    }
  },

  toggleLike: async (postId: string, myKitchenId: string) => {
    const isLiked = get().likedPostIds.includes(postId);
    const prevLikedPostIds = [...get().likedPostIds];
    const prevFeedPosts = [...get().feedPosts];

    if (isLiked) {
      // Optimistic unlike
      set((state) => ({
        likedPostIds: state.likedPostIds.filter((id) => id !== postId),
        feedPosts: state.feedPosts.map((p) =>
          p.id === postId ? { ...p, like_count: Math.max(p.like_count - 1, 0) } : p
        ),
      }));

      try {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('kitchen_id', myKitchenId);

        if (error) throw error;
      } catch (error: unknown) {
        // Rollback
        set({ likedPostIds: prevLikedPostIds, feedPosts: prevFeedPosts });
        console.warn('[socialStore] toggleLike unlike error:', getErrorMessage(error));
      }
    } else {
      // Optimistic like
      set((state) => ({
        likedPostIds: [...state.likedPostIds, postId],
        feedPosts: state.feedPosts.map((p) =>
          p.id === postId ? { ...p, like_count: p.like_count + 1 } : p
        ),
      }));

      try {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, kitchen_id: myKitchenId });

        if (error) throw error;
      } catch (error: unknown) {
        // Rollback
        set({ likedPostIds: prevLikedPostIds, feedPosts: prevFeedPosts });
        console.warn('[socialStore] toggleLike like error:', getErrorMessage(error));
      }
    }
  },

  fetchComments: async (postId: string) => {
    set({ commentsLoading: true });
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ comments: (data ?? []) as PostComment[], commentsLoading: false });
    } catch (error: unknown) {
      set({ commentsLoading: false, error: getErrorMessage(error) });
    }
  },

  addComment: async (postId: string, myKitchenId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, kitchen_id: myKitchenId, content })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Append to comments and optimistically increment comment_count
        set((state) => ({
          comments: [...state.comments, data as PostComment],
          feedPosts: state.feedPosts.map((p) =>
            p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
          ),
        }));
      }
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  deleteComment: async (commentId: string, postId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      set((state) => ({
        comments: state.comments.filter((c) => c.id !== commentId),
        feedPosts: state.feedPosts.map((p) =>
          p.id === postId ? { ...p, comment_count: Math.max(p.comment_count - 1, 0) } : p
        ),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  clearComments: () => {
    set({ comments: [], commentsLoading: false });
  },

  saveRecipeFromPost: async (post: FeedPost, myKitchenId: string, myHouseholdId: string) => {
    try {
      let recipeData: Recipe | null = null;

      // Step A: Look up the recipe
      if (post.recipe_id) {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', post.recipe_id)
          .single();

        if (!error && data) {
          recipeData = data as Recipe;
        }
      }

      // Fallback: look up via meal_plan_id
      if (!recipeData && post.meal_plan_id) {
        const { data: mealPlan, error: mpError } = await supabase
          .from('meal_plans')
          .select('recipe_id')
          .eq('id', post.meal_plan_id)
          .single();

        if (!mpError && mealPlan?.recipe_id) {
          const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', mealPlan.recipe_id)
            .single();

          if (!error && data) {
            recipeData = data as Recipe;
          }
        }
      }

      if (!recipeData) {
        console.warn('[socialStore] saveRecipeFromPost: could not find source recipe');
        return null;
      }

      // Step B: Clone the recipe
      // Get source kitchen display name for badge
      const { data: sourceKitchen } = await supabase
        .from('kitchen_profiles')
        .select('display_name')
        .eq('id', post.kitchen_id)
        .single();

      const sourceLabel = sourceKitchen?.display_name ?? 'another kitchen';
      const savedTag = `Saved from ${sourceLabel}`;

      const { data: newRecipe, error: insertError } = await supabase
        .from('recipes')
        .insert({
          household_id: myHouseholdId,
          name: recipeData.name,
          category: recipeData.category,
          image_url: recipeData.image_url,
          prep_time_minutes: recipeData.prep_time_minutes,
          cook_time_minutes: recipeData.cook_time_minutes,
          servings: recipeData.servings,
          estimated_cost: recipeData.estimated_cost,
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          tags: [...(recipeData.tags || []), savedTag],
          source_url: recipeData.source_url,
          nutrition_info: recipeData.nutrition_info,
          source_image_url: recipeData.source_image_url,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (!newRecipe) return null;

      // Step C: Record in saved_recipes
      await supabase
        .from('saved_recipes')
        .insert({
          kitchen_id: myKitchenId,
          source_kitchen_id: post.kitchen_id,
          recipe_id: (newRecipe as Recipe).id,
          feed_post_id: post.id,
        });

      return newRecipe as Recipe;
    } catch (error: unknown) {
      console.warn('[socialStore] saveRecipeFromPost error:', getErrorMessage(error));
      return null;
    }
  },

  reportContent: async (
    reporterKitchenId: string,
    contentType: 'post' | 'comment',
    postId?: string,
    commentId?: string,
    reason?: string
  ) => {
    try {
      const { error } = await supabase
        .from('reported_content')
        .insert({
          reporter_kitchen_id: reporterKitchenId,
          content_type: contentType,
          post_id: postId ?? null,
          comment_id: commentId ?? null,
          reason: reason ?? null,
        });

      if (error) {
        console.warn('[socialStore] reportContent error:', error.message);
      }
    } catch (err) {
      console.warn('[socialStore] reportContent exception:', err);
    }
  },

  blockKitchen: async (myKitchenId: string, blockedKitchenId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_kitchens')
        .insert({ blocker_kitchen_id: myKitchenId, blocked_kitchen_id: blockedKitchenId });

      if (error) throw error;

      // Add to local blocked list
      set((state) => ({
        blockedKitchenIds: [...state.blockedKitchenIds, blockedKitchenId],
      }));

      // Refresh feed to filter out blocked kitchen's posts
      await get().refreshFeed(myKitchenId);
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  unblockKitchen: async (myKitchenId: string, blockedKitchenId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_kitchens')
        .delete()
        .eq('blocker_kitchen_id', myKitchenId)
        .eq('blocked_kitchen_id', blockedKitchenId);

      if (error) throw error;

      set((state) => ({
        blockedKitchenIds: state.blockedKitchenIds.filter((id) => id !== blockedKitchenId),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  fetchBlockedKitchens: async (myKitchenId: string) => {
    try {
      const { data, error } = await supabase
        .from('blocked_kitchens')
        .select('blocked_kitchen_id')
        .eq('blocker_kitchen_id', myKitchenId);

      if (error) throw error;

      const blockedIds = (data ?? []).map((r: { blocked_kitchen_id: string }) => r.blocked_kitchen_id);
      set({ blockedKitchenIds: blockedIds });
    } catch (error: unknown) {
      console.warn('[socialStore] fetchBlockedKitchens error:', getErrorMessage(error));
    }
  },
}));
