import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';
import { RecipeCommentWithProfile } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CommentItemProps {
  comment: RecipeCommentWithProfile;
  currentUserId: string | null;
  isRecipeCreator: boolean;
  onReply: (comment: RecipeCommentWithProfile) => void;
  onDelete: (commentId: string) => void;
}

export function CommentItem({
  comment,
  currentUserId,
  isRecipeCreator,
  onReply,
  onDelete,
}: CommentItemProps) {
  const handle = comment.profiles?.handle ?? 'user';
  const avatarUrl = comment.profiles?.avatar_url ?? null;
  const timestamp = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
  const canDelete = currentUserId === comment.user_id || isRecipeCreator;

  const handleLongPress = () => {
    if (!canDelete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(comment.id) },
      ]
    );
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={s.container}
      accessibilityLabel={`Comment by @${handle}, ${timestamp}: ${comment.body}`}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={s.avatar} contentFit="cover" transition={200} />
      ) : (
        <View style={[s.avatar, s.avatarPlaceholder]}>
          <Text style={s.avatarInitial}>{handle.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={s.content}>
        <View style={s.headerRow}>
          <Text style={s.handle} numberOfLines={1}>@{handle}</Text>
          <Text style={s.timestamp}>{timestamp}</Text>
        </View>
        <Text style={s.body}>{comment.body}</Text>
        <Pressable
          onPress={() => onReply(comment)}
          style={s.replyAction}
          accessibilityRole="button"
          accessibilityLabel={`Reply to @${handle}`}
        >
          <MaterialCommunityIcons name="reply" size={14} color={colors.primary} />
          <Text style={s.replyText}>Reply</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  handle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  timestamp: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  body: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  replyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  replyText: {
    ...typography.labelMd,
    color: colors.primary,
  },
});
