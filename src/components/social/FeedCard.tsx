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
  kitchenProfile?: { display_name: string; avatar_url: string | null; handle?: string | null };
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
  participants?: Array<{ handle: string | null; user_id: string }>;
  onProfilePress?: (userId: string) => void;
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
  participants,
  onProfilePress,
}: FeedCardProps) {
  const displayName = kitchenProfile?.display_name ?? 'Kitchen';
  const handleText = kitchenProfile?.handle ? `@${kitchenProfile.handle}` : null;
  const avatarUrl = kitchenProfile?.avatar_url ?? null;
  const photoUrl = post.photo_url ?? post.recipe_image_url;
  const isCookLog = post.post_type === 'cook_log';
  const mealType = post.meal_type ? capitalizeFirst(post.meal_type) : '';

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
      <View style={s.card} testID="feed-card">
        {/* Header: avatar + name + subtitle */}
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
            <View style={s.headerText}>
              <Text style={s.kitchenName} numberOfLines={1}>
                {handleText ?? displayName}
              </Text>
              <Text style={s.headerSubtitle} numberOfLines={1}>
                {handleText ? displayName : getRelativeTime(post.created_at)}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Hero photo with overlay recipe name */}
        <Pressable onPress={onRecipePress}>
          {photoUrl ? (
            <View style={s.heroContainer}>
              <Image
                source={{ uri: photoUrl }}
                style={s.heroPhoto}
                contentFit="cover"
                transition={300}
              />
              <View style={s.heroOverlay} />
              <Text style={s.heroRecipeName} numberOfLines={2}>
                {post.recipe_name}
              </Text>
            </View>
          ) : (
            <View style={[s.heroContainer, s.heroPlaceholder]}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={48}
                color={colors.outlineVariant}
              />
              <Text style={s.placeholderRecipeName} numberOfLines={2}>
                {post.recipe_name}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Content section */}
        <View style={s.content}>
          {/* Meal context */}
          <Text style={s.mealContext}>
            <Text style={s.mealContextBold}>{handleText ?? displayName}</Text>
            {isCookLog ? ' cooked ' : ' made '}
            <Text style={s.mealContextBold}>{post.recipe_name}</Text>
          </Text>

          {/* Co-cook attribution */}
          {participants && participants.length > 0 && (
            <Text style={s.coCookLine}>
              cooked with{' '}
              {participants.map((p, i) => (
                <React.Fragment key={p.user_id}>
                  {i > 0 && i < participants.length - 1 ? ', ' : ''}
                  {i > 0 && i === participants.length - 1 ? (participants.length === 2 ? ' and ' : ', and ') : ''}
                  <Text
                    style={s.coCookHandle}
                    onPress={() => onProfilePress?.(p.user_id)}
                  >
                    @{p.handle ?? 'user'}
                  </Text>
                </React.Fragment>
              ))}
            </Text>
          )}

          {/* Quoted description */}
          {isCookLog && post.caption ? (
            <View style={s.quoteContainer}>
              <Text style={s.quoteText}>{post.caption}</Text>
            </View>
          ) : !isCookLog ? (
            <View style={s.quoteContainer}>
              <Text style={s.quoteText}>
                A delicious {mealType.toLowerCase()} dish
              </Text>
            </View>
          ) : null}

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
              {!isOwnPost && (
                <Pressable onPress={onSavePress} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="bookmark-outline"
                    size={22}
                    color={colors.onSurfaceVariant}
                  />
                </Pressable>
              )}
            </View>

            {/* Try this recipe button for non-own posts */}
            {!isOwnPost && onCookThisToo && (
              <Pressable onPress={onCookThisToo} style={s.tryRecipeBtn} hitSlop={8}>
                <Text style={s.tryRecipeText}>Try this recipe</Text>
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

          {/* VIEW FULL RECIPE link */}
          <Pressable onPress={onRecipePress} style={s.viewRecipeBtn}>
            <Text style={s.viewRecipeText}>VIEW FULL RECIPE</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    ...shadows.editorial,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  headerText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  kitchenName: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  headerSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  heroContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroRecipeName: {
    ...typography.headlineMd,
    color: '#ffffff',
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  heroPlaceholder: {
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderRecipeName: {
    ...typography.headlineMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  content: {
    padding: spacing.md,
  },
  mealContext: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  mealContextBold: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  coCookLine: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  coCookHandle: {
    ...typography.labelMd,
    color: colors.primary,
  },
  quoteContainer: {
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.outlineVariant,
    marginBottom: spacing.md,
  },
  quoteText: {
    ...typography.bodyMd,
    fontStyle: 'italic',
    color: colors.onSurfaceVariant,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
  tryRecipeBtn: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  tryRecipeText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  viewRecipeBtn: {
    paddingVertical: spacing.sm,
  },
  viewRecipeText: {
    ...typography.labelMd,
    color: colors.primary,
    textTransform: 'uppercase',
  },
});
