import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRecipeCommentStore, groupComments } from '../../stores/recipeCommentStore';
import { CommentItem } from './CommentItem';
import { CommentReplyItem } from './CommentReplyItem';
import { CommentInput } from './CommentInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface RecipeCommentsSectionProps {
  recipeId: string;
  currentUserId: string | null;
  recipeCreatorId: string | null;
  userHandle: string | null;
  userAvatarUrl: string | null;
}

export function RecipeCommentsSection({
  recipeId,
  currentUserId,
  recipeCreatorId,
  userHandle,
  userAvatarUrl,
}: RecipeCommentsSectionProps) {
  const comments = useRecipeCommentStore((s) => s.comments);
  const commentCount = useRecipeCommentStore((s) => s.commentCount);
  const loading = useRecipeCommentStore((s) => s.loading);
  const error = useRecipeCommentStore((s) => s.error);
  const replyingTo = useRecipeCommentStore((s) => s.replyingTo);
  const fetchComments = useRecipeCommentStore((s) => s.fetchComments);
  const addComment = useRecipeCommentStore((s) => s.addComment);
  const deleteComment = useRecipeCommentStore((s) => s.deleteComment);
  const setReplyingTo = useRecipeCommentStore((s) => s.setReplyingTo);
  const clearComments = useRecipeCommentStore((s) => s.clearComments);

  const isRecipeCreator = currentUserId != null && currentUserId === recipeCreatorId;

  useEffect(() => {
    fetchComments(recipeId);
    return () => {
      clearComments();
    };
  }, [recipeId]);

  const threaded = groupComments(comments);

  const handleReply = (comment: Parameters<typeof setReplyingTo>[0]) => {
    setReplyingTo(comment);
  };

  const handleDelete = (commentId: string) => {
    deleteComment(commentId, recipeId);
  };

  const handleSubmit = async (body: string, parentId?: string | null): Promise<boolean> => {
    if (!currentUserId) return false;
    const success = await addComment({
      recipeId,
      userId: currentUserId,
      body,
      parentId: parentId ?? null,
    });
    if (success) {
      setReplyingTo(null);
    }
    return success;
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <View style={s.section}>
      {/* Section Header */}
      <View style={s.header}>
        <MaterialCommunityIcons name="comment-text-outline" size={20} color={colors.primary} />
        <Text
          style={s.heading}
          accessibilityRole="header"
          accessibilityLabel={`Comments, ${commentCount} comments`}
        >
          Comments
        </Text>
        {commentCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{commentCount}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {loading && comments.length === 0 ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={s.loading}
        />
      ) : error ? (
        <Text style={s.errorText}>
          Couldn't load comments. Pull down to retry.
        </Text>
      ) : comments.length === 0 ? (
        <View
          style={s.emptyState}
          accessibilityLabel="No comments yet. Be the first to share your thoughts on this recipe."
        >
          <Text style={s.emptyHeading}>No comments yet</Text>
          <Text style={s.emptyBody}>
            Be the first to share your thoughts on this recipe.
          </Text>
        </View>
      ) : (
        <View>
          {threaded.map((thread) => (
            <View key={thread.comment.id}>
              <CommentItem
                comment={thread.comment}
                currentUserId={currentUserId}
                isRecipeCreator={isRecipeCreator}
                onReply={handleReply}
                onDelete={handleDelete}
              />
              {thread.replies.map((reply) => (
                <CommentReplyItem
                  key={reply.id}
                  reply={reply}
                  currentUserId={currentUserId}
                  isRecipeCreator={isRecipeCreator}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Input Bar */}
      {currentUserId && (
        <CommentInput
          recipeId={recipeId}
          userId={currentUserId}
          userHandle={userHandle}
          userAvatarUrl={userAvatarUrl}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onSubmit={handleSubmit}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heading: {
    ...typography.titleLg,
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
  },
  loading: {
    paddingVertical: spacing.xl,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyHeading: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
