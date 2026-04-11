import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipeCommentWithProfile } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CommentInputProps {
  recipeId: string;
  userId: string;
  userHandle: string | null;
  userAvatarUrl: string | null;
  replyingTo: RecipeCommentWithProfile | null;
  onCancelReply: () => void;
  onSubmit: (body: string, parentId?: string | null) => Promise<boolean>;
}

export function CommentInput({
  userHandle,
  userAvatarUrl,
  replyingTo,
  onCancelReply,
  onSubmit,
}: CommentInputProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !submitting;

  const handleSend = async () => {
    if (!canSend) return;
    const body = trimmed;
    const parentId = replyingTo?.id ?? null;
    setText('');
    setSubmitting(true);
    try {
      await onSubmit(body, parentId);
    } finally {
      setSubmitting(false);
    }
  };

  const replyHandle = replyingTo?.profiles?.handle ?? 'user';

  return (
    <View>
      {replyingTo && (
        <View style={s.replyBanner}>
          <Text style={s.replyBannerText}>Replying to @{replyHandle}</Text>
          <Pressable
            onPress={onCancelReply}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
          >
            <MaterialCommunityIcons name="close" size={16} color={colors.outlineVariant} />
          </Pressable>
        </View>
      )}
      <View style={s.inputRow}>
        {userAvatarUrl ? (
          <Image
            source={{ uri: userAvatarUrl }}
            style={s.avatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[s.avatar, s.avatarPlaceholder]}>
            <Text style={s.avatarInitial}>
              {(userHandle ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment..."
          placeholderTextColor={colors.onSurfaceVariant}
          maxLength={500}
          multiline
          style={s.input}
          accessibilityLabel="Add a comment"
          accessibilityHint="Type your comment, then tap send"
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Send comment"
        >
          <MaterialCommunityIcons
            name="send"
            size={22}
            color={canSend ? colors.primary : colors.outlineVariant}
          />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  replyBannerText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
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
  avatar: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 80,
  },
});
