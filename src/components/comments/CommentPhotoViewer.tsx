import React from 'react';
import { Modal, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CommentPhotoViewerProps {
  visible: boolean;
  photoUrl: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function CommentPhotoViewer({ visible, photoUrl, onClose }: CommentPhotoViewerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Image
          source={{ uri: photoUrl }}
          style={s.image}
          contentFit="contain"
          transition={200}
        />
        <Pressable
          onPress={onClose}
          style={s.closeButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close photo"
        >
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
