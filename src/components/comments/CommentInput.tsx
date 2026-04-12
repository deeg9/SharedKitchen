import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
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
  onSubmit: (body: string, parentId?: string | null, photoUri?: string | null) => Promise<boolean>;
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const trimmed = text.trim();
  const canSend = (trimmed.length > 0 || photoUri !== null) && !submitting;

  const handlePickPhoto = async () => {
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Photo too large', 'Photo must be under 5MB.');
        return;
      }
      setPhotoUri(asset.uri);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    const body = trimmed;
    const parentId = replyingTo?.id ?? null;
    setText('');
    setSubmitting(true);
    try {
      const success = await onSubmit(body, parentId, photoUri);
      if (success) {
        setPhotoUri(null);
      }
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
      {photoUri && (
        <View style={s.photoPreview}>
          <View>
            <Image source={{ uri: photoUri }} style={s.previewThumb} contentFit="cover" />
            {submitting && (
              <View style={s.uploadOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>
          <Pressable
            onPress={() => setPhotoUri(null)}
            style={s.removePhoto}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
          >
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
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
        <Pressable
          onPress={handlePickPhoto}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Attach photo"
        >
          <MaterialCommunityIcons name="camera" size={22} color={colors.primary} />
        </Pressable>
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
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  previewThumb: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhoto: {
    padding: 4,
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
