import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius } from '../../theme/spacing';

interface CookPhotoThumbnailProps {
  photoUrl: string;
  handle: string | null;
  cookedAt: string;
  onPress: () => void;
  onLongPress?: () => void;
}

export function CookPhotoThumbnail({
  photoUrl,
  handle,
  cookedAt,
  onPress,
  onLongPress,
}: CookPhotoThumbnailProps) {
  const relativeDate = formatDistanceToNow(new Date(cookedAt), { addSuffix: false }) + ' ago';
  const handleText = handle ? `@${handle}` : '';
  const accessLabel = `Cook photo by @${handle ?? 'unknown'}, ${relativeDate}`;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="image"
      accessibilityLabel={accessLabel}
    >
      <View style={styles.container}>
        <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.scrim}>
          <Text style={styles.scrimText} numberOfLines={1}>
            {relativeDate}
          </Text>
          {handleText ? (
            <Text style={styles.scrimText} numberOfLines={1}>
              {handleText}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  image: {
    width: 80,
    height: 80,
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'rgba(48, 49, 46, 0.5)',
    borderBottomLeftRadius: borderRadius.sm,
    borderBottomRightRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  scrimText: {
    ...typography.labelMd,
    color: colors.inverseOnSurface,
    fontSize: 9,
    lineHeight: 12,
  },
});
