import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  Image,
  Pressable,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CookPhotoThumbnail } from './CookPhotoThumbnail';
import { CookLogWithProfile } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CookPhotoGalleryProps {
  cookLogs: CookLogWithProfile[];
  currentUserId: string;
  onDeleteLog: (logId: string, photoUrl: string | null) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function CookPhotoGallery({
  cookLogs,
  currentUserId,
  onDeleteLog,
}: CookPhotoGalleryProps) {
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);

  const logsWithPhotos = cookLogs.filter((log) => log.photo_url != null);

  if (logsWithPhotos.length === 0) {
    return null;
  }

  const handleLongPress = (log: CookLogWithProfile) => {
    if (log.user_id !== currentUserId) return;

    Alert.alert(
      'Delete cook log',
      "This will remove the cook log and photo. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteLog(log.id, log.photo_url),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CookLogWithProfile }) => (
    <CookPhotoThumbnail
      photoUrl={item.photo_url!}
      handle={item.profiles?.handle ?? null}
      cookedAt={item.cooked_at}
      onPress={() => setFullScreenPhoto(item.photo_url)}
      onLongPress={() => handleLongPress(item)}
    />
  );

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Cook Photos</Text>
      <FlatList
        data={logsWithPhotos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={fullScreenPhoto != null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenPhoto(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalClose}
            onPress={() => setFullScreenPhoto(null)}
            accessibilityRole="button"
            accessibilityLabel="Close photo viewer"
          >
            <MaterialCommunityIcons name="close" size={28} color="#ffffff" />
          </Pressable>
          {fullScreenPhoto && (
            <Image
              source={{ uri: fullScreenPhoto }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  heading: {
    ...typography.titleMd,
    color: colors.onSurface,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  separator: {
    width: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    height: SCREEN_HEIGHT * 0.7,
  },
});
