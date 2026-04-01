import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface AddActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onManualEntry: () => void;
  onUseCamera: () => void;
}

export function AddActionSheet({ isOpen, onClose, onManualEntry, onUseCamera }: AddActionSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['40%']}>
      <View style={styles.container}>
        <Text style={styles.heading}>Add Items</Text>

        <Pressable
          style={styles.row}
          onPress={() => {
            onClose();
            onManualEntry();
          }}
          accessibilityLabel="Enter items manually"
          accessibilityRole="button"
          testID="action-sheet-manual"
        >
          <MaterialCommunityIcons name="pencil-outline" size={24} color={colors.primary} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Enter Manually</Text>
            <Text style={styles.rowSubtitle}>Type in item details</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => {
            onClose();
            onUseCamera();
          }}
          accessibilityLabel="Use camera to add items"
          accessibilityRole="button"
          testID="action-sheet-camera"
        >
          <MaterialCommunityIcons name="camera-outline" size={24} color={colors.primary} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Use Camera</Text>
            <Text style={styles.rowSubtitle}>Take a photo or upload from gallery</Text>
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
    paddingBottom: spacing.xl,
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
