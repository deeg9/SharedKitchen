import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { getDefaultRecipeImage } from '../../lib/images';
import type { MealPlanWithRecipe } from '../../stores/planStore';
import type { PresenceMember } from '../../hooks/usePresence';

interface HeroDinnerCardProps {
  plan?: MealPlanWithRecipe;
  presenceMembers?: PresenceMember[];
  onPress: () => void;
  onStartCooking?: () => void;
}

export function HeroDinnerCard({
  plan,
  presenceMembers,
  onPress,
  onStartCooking,
}: HeroDinnerCardProps) {
  const hasRecipe = plan?.recipes != null;
  const hasNotes = plan != null && !hasRecipe && plan.notes;

  // Notes-only state (photo-logged meal, no recipe)
  if (hasNotes && !hasRecipe) {
    return (
      <Pressable onPress={onPress} testID="hero-dinner-notes">
        <Card
          variant="filled"
          style={styles.emptyCard}
        >
          <MaterialCommunityIcons
            name="food"
            size={48}
            color={colors.outlineVariant}
          />
          <Text style={styles.notesTitle} numberOfLines={2}>
            {plan!.notes}
          </Text>
          <Text style={styles.notesSubtitle}>Logged meal</Text>
        </Card>
      </Pressable>
    );
  }

  // Empty state (no dinner planned)
  if (!plan || !hasRecipe) {
    return (
      <Pressable onPress={onPress} testID="hero-dinner-empty">
        <Card
          variant="filled"
          style={styles.emptyCard}
        >
          <MaterialCommunityIcons
            name="food-variant"
            size={48}
            color={colors.outlineVariant}
          />
          <Text style={styles.emptyTitle}>What's for dinner tonight?</Text>
          <Text style={styles.emptySubtitle}>Tap to add a recipe</Text>
        </Card>
      </Pressable>
    );
  }

  // Filled state (dinner planned with recipe)
  const recipe = plan.recipes!;
  const imageUri =
    recipe.image_url ||
    getDefaultRecipeImage(plan.recipe_id ?? plan.id, recipe.category ?? undefined);

  // Use first instruction step as description text
  const description =
    recipe.instructions?.[0]?.text ?? recipe.name;

  const firstMember = presenceMembers?.[0];

  return (
    <Pressable onPress={onPress} testID="hero-dinner-card">
      <Card
        variant="elevated"
        style={styles.filledCard}
      >
        {/* Recipe photo */}
        <Image
          source={{ uri: imageUri }}
          style={styles.heroImage}
          contentFit="cover"
        />

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        />

        {/* Content overlay */}
        <View style={styles.contentOverlay}>
          <Text style={styles.featuredLabel}>FEATURED DINNER</Text>
          <Text style={styles.recipeName} numberOfLines={2}>
            {recipe.name}
          </Text>
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {description}
          </Text>

          {/* Bottom row: presence + CTA */}
          <View style={styles.bottomRow}>
            {/* Presence */}
            <View style={styles.presenceRow}>
              {firstMember != null && (
                <>
                  {firstMember.avatar_url ? (
                    <Image
                      source={{ uri: firstMember.avatar_url }}
                      style={styles.presenceAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.presenceAvatar, styles.presenceAvatarPlaceholder]}>
                      <MaterialCommunityIcons
                        name="account"
                        size={14}
                        color={colors.onPrimary}
                      />
                    </View>
                  )}
                  <Text style={styles.presenceText}>
                    {firstMember.display_name} is cooking
                  </Text>
                </>
              )}
            </View>

            {/* Start Cooking button */}
            {onStartCooking && (
              <Pressable onPress={onStartCooking}>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>Start Cooking</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Empty / Notes state
  emptyCard: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  emptyTitle: {
    ...typography.titleMd,
    color: colors.outline,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.outlineVariant,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  notesTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  notesSubtitle: {
    ...typography.bodySm,
    color: colors.outlineVariant,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Filled state
  filledCard: {
    height: 260,
    padding: 0,
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
    ...shadows.editorial,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  featuredLabel: {
    ...typography.labelSm,
    color: colors.onPrimary,
    opacity: 0.8,
  },
  recipeName: {
    ...typography.headlineMd,
    color: '#ffffff',
    marginTop: spacing.xs,
  },
  recipeDescription: {
    ...typography.bodySm,
    color: '#ffffff',
    opacity: 0.85,
    marginTop: spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  presenceAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.xs,
  },
  presenceAvatarPlaceholder: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceText: {
    ...typography.labelMd,
    color: '#ffffff',
  },
  ctaButton: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ctaText: {
    ...typography.labelLg,
    color: colors.primary,
  },
});
