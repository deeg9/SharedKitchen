import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { CameraSheet } from '../camera/CameraSheet';
import { CoCookPicker } from './CoCookPicker';
import { useCookLogStore } from '../../stores/cookLogStore';
import { useAuthStore } from '../../stores/authStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { useSocialStore } from '../../stores/socialStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CookLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  recipeImageUrl?: string | null;
  contextMessage?: string;
}

export function CookLogSheet({
  isOpen,
  onClose,
  recipeId,
  recipeName,
  recipeImageUrl,
  contextMessage,
}: CookLogSheetProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [coCooks, setCoCooks] = useState<Array<{ id: string; handle: string | null; avatar_url: string | null }>>([]);

  const userId = useAuthStore((s) => s.user?.id);
  const activeHousehold = useHouseholdStore((s) => s.activeHousehold);
  const householdId = activeHousehold()?.id;

  const handleSubmit = async () => {
    if (!userId || !householdId) return;

    setSubmitting(true);
    try {
      const kitchenId = useSocialStore.getState().myKitchenProfile?.id ?? undefined;
      const result = await useCookLogStore.getState().createCookLog({
        recipeId,
        userId,
        householdId,
        photoUri: photoUri ?? undefined,
        notes: notes.trim() || undefined,
        recipeName,
        recipeImageUrl: recipeImageUrl ?? undefined,
        kitchenId,
        participantIds: coCooks.map((u) => u.id),
      });

      if (result) {
        setPhotoUri(null);
        setNotes('');
        setCoCooks([]);
        onClose();
      } else {
        const errorMsg = useCookLogStore.getState().error;
        Alert.alert(
          'Error',
          errorMsg || "Couldn't save your cook log. Check your connection and try again."
        );
      }
    } catch {
      Alert.alert(
        'Error',
        "Couldn't save your cook log. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
  };

  const handleClose = () => {
    setPhotoUri(null);
    setNotes('');
    setCoCooks([]);
    onClose();
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={handleClose} snapPoints={['70%']}>
        <View style={styles.container}>
          {contextMessage ? (
            <Text style={styles.contextMessage}>{contextMessage}</Text>
          ) : null}

          {/* Photo area */}
          <View style={styles.photoSection}>
            {photoUri ? (
              <View style={styles.photoWrapper}>
                <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
                <Pressable
                  style={styles.removePhotoButton}
                  onPress={handleRemovePhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <Text style={styles.removePhotoX}>X</Text>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              onPress={() => setCameraOpen(true)}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Add media"
              style={styles.addMediaButton}
            >
              <MaterialCommunityIcons name="camera-plus-outline" size={20} color={colors.primary} />
              <Text style={styles.addPhotoText}>Add media</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Write a caption..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
            editable={!submitting}
            textAlignVertical="top"
            accessibilityLabel="Caption"
          />

          {/* Co-cook picker */}
          <Text style={styles.coCookLabel}>Who did you cook with?</Text>
          {userId ? (
            <CoCookPicker
              selectedUsers={coCooks}
              onSelectionChange={setCoCooks}
              currentUserId={userId}
              disabled={submitting}
            />
          ) : null}

          {/* Submit */}
          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Post to feed"
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.submitText}>Post to feed</Text>
            )}
          </Pressable>
        </View>
      </BottomSheet>

      <CameraSheet
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onImageCaptured={(uri) => {
          setPhotoUri(uri);
          setCameraOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  heading: {
    ...typography.titleLg,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  contextMessage: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoX: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  addPhotoText: {
    ...typography.labelLg,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  coCookLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  notesInput: {
    ...typography.bodyLg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.sm,
    minHeight: 80,
    color: colors.onSurface,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});
