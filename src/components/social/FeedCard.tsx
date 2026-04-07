import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeedPost } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface FeedCardProps {
  post: FeedPost;
  kitchenProfile?: { display_name: string; avatar_url: string | null };
  isOwnPost: boolean;
  isLiked: boolean;
  onKitchenPress: () => void;
  onRecipePress: () => void;
  onLikePress: () => void;
  onCommentPress: () => void;
  onSavePress: () => void;
  onLongPress?: () => void;
  onPhotoAttach?: () => void;
  onCookThisToo?: () => void;
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

function getDayName(dateString: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(dateString + 'T00:00:00');
  return days[date.getDay()];
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function FeedCard({
  post,
  kitchenProfile,
  isOwnPost,
  isLiked,
  onKitchenPress,
  onRecipePress,
  onLikePress,
  onCommentPress,
  onSavePress,
  onLongPress,
  onPhotoAttach,
  onCookThisToo,
}: FeedCardProps) {
  const displayName = kitchenProfile?.display_name ?? 'Kitchen';
  const avatarUrl = kitchenProfile?.avatar_url ?? null;
  const photoUrl = post.photo_url ?? post.recipe_image_url;
  const daySlot = `${getDayName(post.meal_date)} ${capitalizeFirst(post.meal_type)}`;

  // Like animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLikePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onLikePress();
  }, [scaleAnim, onLikePress]);

  return (
    <Pressable onLongPress={onLongPress} disabled={!onLongPress}>
      <View style={s.card}>
        {/* Header: avatar + name + timestamp */}
        <View style={s.header}>
          <Pressable onPress={onKitchenPress} style={s.headerLeft}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={s.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]}>
                <Text style={s.avatarInitials}>{getInitials(displayName)}</Text>
              </View>
            )}
            <Text style={s.kitchenName} numberOfLines={1}>
              {displayName}
            </Text>
          </Pressable>
          <Text style={s.timestamp}>{getRelativeTime(post.created_at)}</Text>
        </View>

        {/* Content: meal context + recipe name */}
        <Pressable onPress={onRecipePress}>
          <Text style={s.mealContext}>{daySlot}</Text>
          <Text style={s.recipeName} numberOfLines={2}>
            {post.recipe_name}
          </Text>
        </Pressable>

        {/* Photo or placeholder */}
        <Pressable onPress={onRecipePress}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={s.photo}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={[s.photo, s.photoPlaceholder]}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={40}
                color={colors.outlineVariant}
              />
            </View>
          )}
        </Pressable>

        {/* Comment preview link */}
        {post.comment_count > 0 && (
          <Pressable onPress={onCommentPress}>
            <Text style={s.commentPreview}>
              View all {post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}
            </Text>
          </Pressable>
        )}

        {/* Action bar */}
        <View style={s.actionBar}>
          <View style={s.actionGroup}>
            <Pressable onPress={handleLikePress} hitSlop={8}>
              <View style={s.actionItem}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <MaterialCommunityIcons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isLiked ? colors.error : colors.onSurfaceVariant}
                  />
                </Animated.View>
                {post.like_count > 0 && (
                  <Text style={s.actionCount}>{post.like_count}</Text>
                )}
              </View>
            </Pressable>
            <Pressable onPress={onCommentPress} hitSlop={8}>
              <View style={s.actionItem}>
                <MaterialCommunityIcons
                  name="comment-outline"
                  size={22}
                  color={colors.onSurfaceVariant}
                />
                {post.comment_count > 0 && (
                  <Text style={s.actionCount}>{post.comment_count}</Text>
                )}
              </View>
            </Pressable>
            <Pressable onPress={onSavePress} hitSlop={8}>
              <MaterialCommunityIcons
                name="bookmark-outline"
                size={22}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          </View>

          {/* Cook This Too button for non-own posts */}
          {!isOwnPost && onCookThisToo && (
            <Pressable onPress={onCookThisToo} style={s.cookThisTooBtn} hitSlop={8}>
              <MaterialCommunityIcons name="pot-steam-outline" size={18} color={colors.primary} />
              <Text style={s.cookThisTooText}>Cook This Too</Text>
            </Pressable>
          )}

          {/* Camera button for own posts without photo */}
          {isOwnPost && !post.photo_url && onPhotoAttach && (
            <Pressable onPress={onPhotoAttach} hitSlop={8}>
              <MaterialCommunityIcons
                name="camera-plus-outline"
                size={22}
                color={colors.primary}
              />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    ...shadows.editorial,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  kitchenName: {
    ...typography.labelLg,
    color: colors.onSurface,
    marginLeft: spacing.sm,
    flex: 1,
  },
  timestamp: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  mealContext: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  recipeName: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  photoPlaceholder: {
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentPreview: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  cookThisTooBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cookThisTooText: {
    ...typography.labelSm,
    color: colors.primary,
  },
});
