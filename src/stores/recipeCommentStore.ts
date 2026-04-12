import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { RecipeCommentWithProfile, ThreadedComment } from '../types/database';
import { getErrorMessage } from '../lib/errors';
import { uploadCommentPhoto } from '../lib/commentPhotoHelpers';

/**
 * Groups a flat list of comments into threaded structure.
 * Single-level threading: replies-to-replies are flattened under the root parent.
 */
export function groupComments(comments: RecipeCommentWithProfile[]): ThreadedComment[] {
  if (comments.length === 0) return [];

  // Build a lookup map for all comments by id
  const byId = new Map<string, RecipeCommentWithProfile>();
  for (const c of comments) {
    byId.set(c.id, c);
  }

  // Resolve root parent for any comment (handles reply-to-reply flattening)
  function getRootParentId(comment: RecipeCommentWithProfile): string | null {
    if (comment.parent_id === null) return null;
    const parent = byId.get(comment.parent_id);
    if (!parent) return comment.parent_id;
    // If parent itself has a parent, flatten to the grandparent (root)
    if (parent.parent_id !== null) {
      return getRootParentId(parent);
    }
    return comment.parent_id;
  }

  // Separate top-level comments and replies
  const topLevel: RecipeCommentWithProfile[] = [];
  const repliesByParent = new Map<string, RecipeCommentWithProfile[]>();

  for (const comment of comments) {
    if (comment.parent_id === null) {
      topLevel.push(comment);
    } else {
      const rootId = getRootParentId(comment) ?? comment.parent_id;
      const existing = repliesByParent.get(rootId) ?? [];
      existing.push(comment);
      repliesByParent.set(rootId, existing);
    }
  }

  // Sort top-level by created_at ASC
  topLevel.sort((a, b) => a.created_at.localeCompare(b.created_at));

  return topLevel.map((comment) => ({
    comment,
    replies: (repliesByParent.get(comment.id) ?? []).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  }));
}

interface RecipeCommentState {
  comments: RecipeCommentWithProfile[];
  commentCount: number;
  loading: boolean;
  error: string | null;
  replyingTo: RecipeCommentWithProfile | null;

  fetchComments: (recipeId: string) => Promise<void>;
  addComment: (params: {
    recipeId: string;
    userId: string;
    body: string;
    parentId?: string | null;
    photoUri?: string | null;
  }) => Promise<boolean>;
  deleteComment: (commentId: string, recipeId: string) => Promise<void>;
  setReplyingTo: (comment: RecipeCommentWithProfile | null) => void;
  clearComments: () => void;
}

export const useRecipeCommentStore = create<RecipeCommentState>((set, get) => ({
  comments: [],
  commentCount: 0,
  loading: false,
  error: null,
  replyingTo: null,

  fetchComments: async (recipeId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('recipe_comments')
        .select('*, profiles(handle, avatar_url)')
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Also fetch comment_count from recipes table
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('comment_count')
        .eq('id', recipeId)
        .single();

      if (recipeError) throw recipeError;

      set({
        comments: (data as RecipeCommentWithProfile[]) ?? [],
        commentCount: recipeData?.comment_count ?? 0,
        loading: false,
      });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  addComment: async (params) => {
    const { comments: prevComments, commentCount: prevCount } = get();

    // Optimistic comment
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: RecipeCommentWithProfile = {
      id: tempId,
      recipe_id: params.recipeId,
      user_id: params.userId,
      parent_id: params.parentId ?? null,
      body: params.body,
      photo_url: null,
      created_at: new Date().toISOString(),
      profiles: null,
    };

    set({
      comments: [...prevComments, optimistic],
      commentCount: prevCount + 1,
      error: null,
    });

    try {
      // Upload photo if provided (non-blocking — returns null on failure)
      let photoUrl: string | null = null;
      if (params.photoUri) {
        photoUrl = await uploadCommentPhoto(params.userId, params.photoUri);
      }

      const { data, error } = await supabase
        .from('recipe_comments')
        .insert({
          recipe_id: params.recipeId,
          user_id: params.userId,
          parent_id: params.parentId ?? null,
          body: params.body,
          photo_url: photoUrl,
        })
        .select('*, profiles(handle, avatar_url)')
        .single();

      if (error) throw error;

      // Replace optimistic with real data
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === tempId ? (data as RecipeCommentWithProfile) : c
        ),
      }));

      return true;
    } catch (error: unknown) {
      // Rollback optimistic
      set({
        comments: prevComments,
        commentCount: prevCount,
        error: getErrorMessage(error),
      });
      return false;
    }
  },

  deleteComment: async (commentId: string, recipeId: string) => {
    const { comments: prevComments, commentCount: prevCount } = get();

    // Optimistic removal
    set({
      comments: prevComments.filter((c) => c.id !== commentId),
      commentCount: Math.max(0, prevCount - 1),
    });

    try {
      const { error } = await supabase
        .from('recipe_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (error: unknown) {
      // Rollback: re-fetch to restore correct state
      set({ error: getErrorMessage(error) });
      get().fetchComments(recipeId);
    }
  },

  setReplyingTo: (comment: RecipeCommentWithProfile | null) => {
    set({ replyingTo: comment });
  },

  clearComments: () => {
    set({
      comments: [],
      commentCount: 0,
      loading: false,
      error: null,
      replyingTo: null,
    });
  },
}));
