import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CameraSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCaptured: (uri: string) => void;
}

export function CameraSheet({ isOpen, onClose, onImageCaptured }: CameraSheetProps) {
  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      onImageCaptured(result.assets[0].uri);
      onClose();
    }
  };

  const handleChooseFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      onImageCaptured(result.assets[0].uri);
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['35%']}>
      <View style={styles.container}>
        <Text style={styles.heading}>Add a Photo</Text>

        <Pressable
          style={styles.row}
          onPress={handleTakePhoto}
          accessibilityLabel="Take a photo with camera"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="camera" size={24} color={colors.primary} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Take Photo</Text>
            <Text style={styles.rowSubtitle}>Use your camera</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={handleChooseFromGallery}
          accessibilityLabel="Choose photo from gallery"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="image-multiple" size={24} color={colors.primary} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Choose from Gallery</Text>
            <Text style={styles.rowSubtitle}>Select an existing photo</Text>
          </View>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  heading: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  rowSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
