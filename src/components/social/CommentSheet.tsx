import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { useSocialStore } from '../../stores/socialStore';
import { PostComment } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  myKitchenId: string;
  kitchenProfiles: Map<string, { display_name: string; avatar_url: string | null }>;
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

export function CommentSheet({
  isOpen,
  onClose,
  postId,
  myKitchenId,
  kitchenProfiles,
}: CommentSheetProps) {
  const [text, setText] = useState('');
  const {
    comments,
    commentsLoading,
    fetchComments,
    addComment,
    deleteComment,
    clearComments,
  } = useSocialStore();

  // Fetch comments when sheet opens
  useEffect(() => {
    if (isOpen && postId) {
      fetchComments(postId);
    }
    if (!isOpen) {
      clearComments();
      setText('');
    }
  }, [isOpen, postId]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || commentsLoading) return;

    setText('');
    await addComment(postId, myKitchenId, trimmed);
  }, [text, commentsLoading, postId, myKitchenId, addComment]);

  const handleDelete = useCallback(
    (commentId: string) => {
      deleteComment(commentId, postId);
    },
    [postId, deleteComment]
  );

  const renderComment = useCallback(
    ({ item }: { item: PostComment }) => {
      const profile = kitchenProfiles.get(item.kitchen_id);
      const name = profile?.display_name ?? 'Kitchen';
      const avatarUrl = profile?.avatar_url ?? null;
      const isOwn = item.kitchen_id === myKitchenId;

      return (
        <View style={s.commentRow}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={s.commentAvatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[s.commentAvatar, s.commentAvatarPlaceholder]}>
              <Text style={s.commentAvatarInitials}>{getInitials(name)}</Text>
            </View>
          )}
          <View style={s.commentBody}>
            <View style={s.commentHeader}>
              <Text style={s.commentName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={s.commentTime}>{getRelativeTime(item.created_at)}</Text>
            </View>
            <Text style={s.commentContent}>{item.content}</Text>
          </View>
          {isOwn && (
            <Pressable
              onPress={() => handleDelete(item.id)}
              hitSlop={8}
              style={s.deleteBtn}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={16}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          )}
        </View>
      );
    },
    [kitchenProfiles, myKitchenId, handleDelete]
  );

  const keyExtractor = useCallback((item: PostComment) => item.id, []);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['70%']}>
      <View style={s.container}>
        <Text style={s.title}>Comments</Text>

        {commentsLoading && comments.length === 0 ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={s.loadingIndicator}
          />
        ) : comments.length === 0 ? (
          <View style={s.emptyContainer}>
            <Text style={s.emptyText}>No comments yet</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={keyExtractor}
            renderItem={renderComment}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input area */}
        <View style={s.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.onSurfaceVariant}
            maxLength={500}
            style={s.input}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || commentsLoading}
            hitSlop={8}
            style={s.sendBtn}
          >
            <MaterialCommunityIcons
              name="send"
              size={22}
              color={
                text.trim() && !commentsLoading
                  ? colors.primary
                  : colors.outlineVariant
              }
            />
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
  },
  commentAvatarPlaceholder: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  commentName: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  commentTime: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  commentContent: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  deleteBtn: {
    paddingLeft: spacing.sm,
    paddingTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 80,
  },
  sendBtn: {
    padding: spacing.xs,
  },
});
