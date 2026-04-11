import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';
import { RecipeCommentWithProfile } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CommentReplyItemProps {
  reply: RecipeCommentWithProfile;
  currentUserId: string | null;
  isRecipeCreator: boolean;
  onDelete: (commentId: string) => void;
}

export function CommentReplyItem({
  reply,
  currentUserId,
  isRecipeCreator,
  onDelete,
}: CommentReplyItemProps) {
  const handle = reply.profiles?.handle ?? 'user';
  const avatarUrl = reply.profiles?.avatar_url ?? null;
  const timestamp = formatDistanceToNow(new Date(reply.created_at), { addSuffix: true });
  const canDelete = currentUserId === reply.user_id || isRecipeCreator;

  const handleLongPress = () => {
    if (!canDelete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(reply.id) },
      ]
    );
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={s.container}
      accessibilityLabel={`Reply by @${handle}, ${timestamp}: ${reply.body}`}
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
        <Text style={s.body}>{reply.body}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 64,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
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
    fontSize: 10,
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
});
