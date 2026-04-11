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
import { BottomSheet } from '../ui/BottomSheet';
import { CameraSheet } from '../camera/CameraSheet';
import { useCookLogStore } from '../../stores/cookLogStore';
import { useAuthStore } from '../../stores/authStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CookLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  contextMessage?: string;
}

export function CookLogSheet({
  isOpen,
  onClose,
  recipeId,
  recipeName,
  contextMessage,
}: CookLogSheetProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const userId = useAuthStore((s) => s.user?.id);
  const activeHousehold = useHouseholdStore((s) => s.activeHousehold);
  const householdId = activeHousehold()?.id;

  const handleSubmit = async () => {
    if (!userId || !householdId) return;

    setSubmitting(true);
    try {
      const result = await useCookLogStore.getState().createCookLog({
        recipeId,
        userId,
        householdId,
        photoUri: photoUri ?? undefined,
        notes: notes.trim() || undefined,
      });

      if (result) {
        setPhotoUri(null);
        setNotes('');
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
    onClose();
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={handleClose} snapPoints={['55%']}>
        <View style={styles.container}>
          <Text style={styles.heading}>Log this cook</Text>
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
            ) : (
              <View style={styles.photoPlaceholder} />
            )}
            <Pressable
              onPress={() => setCameraOpen(true)}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Add a photo"
            >
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </Pressable>
          </View>

          {/* Notes */}
          <Text style={styles.notesLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How did it turn out?"
            placeholderTextColor={colors.onSurfaceVariant}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
            editable={!submitting}
            textAlignVertical="top"
            accessibilityLabel="Notes, optional"
          />

          {/* Submit */}
          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Log cook"
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.submitText}>Log Cook</Text>
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
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.sm,
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
  notesLabel: {
    ...typography.labelLg,
    color: colors.onSurface,
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
