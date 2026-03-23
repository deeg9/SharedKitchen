import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { IngredientRow } from '../../../src/components/recipes/IngredientRow';
import { InstructionStep } from '../../../src/components/recipes/InstructionStep';
import { BottomSheet } from '../../../src/components/ui/BottomSheet';
import { Button } from '../../../src/components/ui/Button';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { useRecipeStore, scaleIngredients } from '../../../src/stores/recipeStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { usePlanStore } from '../../../src/stores/planStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { Ingredient, InstructionStep as InstructionStepType } from '../../../src/types/database';
import { format, addDays } from 'date-fns';

const SCALE_OPTIONS = [1, 2, 3] as const;

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    selectedRecipe: recipe,
    ratings,
    notes,
    loading,
    fetchRecipeDetail,
    toggleFavorite,
    rateRecipe,
    addNote,
  } = useRecipeStore();
  const { activeHouseholdId } = useHouseholdStore();

  const [scale, setScale] = useState<1 | 2 | 3>(1);
  const [noteText, setNoteText] = useState('');
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRecipeDetail(id);
    }
    // Get current user id
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [id]);

  const userRating = useMemo(() => {
    if (!userId) return null;
    return ratings.find((r) => r.user_id === userId);
  }, [ratings, userId]);

  const isFavorite = userRating?.is_favorite ?? false;
  const currentRating = userRating?.rating ?? 0;

  const avgRating = useMemo(() => {
    const rated = ratings.filter((r) => r.rating != null);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length;
  }, [ratings]);

  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    return scaleIngredients(recipe.ingredients as Ingredient[], scale);
  }, [recipe, scale]);

  const handleFavorite = async () => {
    if (!userId || !id) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(id, userId, !isFavorite);
  };

  const handleRate = async (rating: number) => {
    if (!userId || !id) return;
    await Haptics.selectionAsync();
    await rateRecipe(id, userId, rating);
  };

  const handleAddNote = async () => {
    if (!userId || !id || !noteText.trim()) return;
    await addNote(id, userId, noteText.trim());
    setNoteText('');
  };

  const assignRecipe = usePlanStore((s) => s.assignRecipe);

  const handleAddToPlan = async (dayOffset: number) => {
    if (!recipe || !activeHouseholdId) return;
    const planDate = format(addDays(new Date(), dayOffset), 'yyyy-MM-dd');
    await assignRecipe(planDate, recipe.id);
    setShowPlanSheet(false);
  };

  if (loading || !recipe) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Skeleton height={220} borderRadius={0} />
        <View style={styles.section}>
          <Skeleton.Text width="70%" />
          <Skeleton.Text width="40%" style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    );
  }

  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.heroContainer}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>🍽</Text>
            </View>
          )}

          {/* Back + Favorite buttons */}
          <Pressable
            onPress={() => router.back()}
            style={[styles.headerBtn, styles.backBtn, { top: insets.top + spacing.sm }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable
            onPress={handleFavorite}
            style={[styles.headerBtn, styles.favBtn, { top: insets.top + spacing.sm }]}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.error : colors.onSurface}
            />
          </Pressable>
        </View>

        {/* Title and metadata */}
        <View style={styles.section}>
          <Text style={styles.title}>{recipe.name}</Text>
          {recipe.category && (
            <Text style={styles.category}>{recipe.category}</Text>
          )}

          {/* Metadata pills */}
          <View style={styles.metaRow}>
            {recipe.prep_time_minutes != null && (
              <View style={styles.metaPill}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
                <Text style={styles.metaLabel}>Prep</Text>
                <Text style={styles.metaValue}>{recipe.prep_time_minutes}m</Text>
              </View>
            )}
            {recipe.cook_time_minutes != null && (
              <View style={styles.metaPill}>
                <MaterialCommunityIcons name="fire" size={16} color={colors.secondary} />
                <Text style={styles.metaLabel}>Cook</Text>
                <Text style={styles.metaValue}>{recipe.cook_time_minutes}m</Text>
              </View>
            )}
            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="account-group-outline" size={16} color={colors.primary} />
              <Text style={styles.metaLabel}>Serves</Text>
              <Text style={styles.metaValue}>{recipe.servings}</Text>
            </View>
            {recipe.estimated_cost != null && (
              <View style={styles.metaPill}>
                <Text style={styles.metaLabel}>Cost</Text>
                <Text style={styles.metaValue}>${Number(recipe.estimated_cost).toFixed(0)}</Text>
              </View>
            )}
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingAvg}>
              {avgRating > 0 ? avgRating.toFixed(1) : '--'}
            </Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => handleRate(star)}>
                  <MaterialCommunityIcons
                    name={star <= currentRating ? 'star' : 'star-outline'}
                    size={28}
                    color={star <= currentRating ? colors.secondary : colors.outlineVariant}
                  />
                </Pressable>
              ))}
            </View>
            <Text style={styles.ratingCount}>
              ({ratings.filter((r) => r.rating != null).length})
            </Text>
          </View>
        </View>

        {/* Portion scaler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portions</Text>
          <View style={styles.scalerRow}>
            {SCALE_OPTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setScale(s)}
                style={[styles.scaleBtn, scale === s && styles.scaleBtnActive]}
              >
                <Text style={[styles.scaleBtnText, scale === s && styles.scaleBtnTextActive]}>
                  x{s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ingredients ({scaledIngredients.length})
          </Text>
          {scaledIngredients.map((ing, i) => (
            <IngredientRow key={i} ingredient={ing} />
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {(recipe.instructions as InstructionStepType[]).map((step, i) => (
            <InstructionStep key={i} step={step} />
          ))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes ({notes.length})</Text>
          {notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <Text style={styles.noteContent}>{note.content}</Text>
              <Text style={styles.noteDate}>
                {format(new Date(note.created_at), 'MMM d, yyyy')}
              </Text>
            </View>
          ))}
          <View style={styles.noteInputRow}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={noteText}
              onChangeText={setNoteText}
              multiline
            />
            <Pressable
              onPress={handleAddNote}
              disabled={!noteText.trim()}
              style={[styles.noteSubmit, !noteText.trim() && styles.noteSubmitDisabled]}
            >
              <MaterialCommunityIcons name="send" size={20} color={colors.onPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Add to Plan button */}
        <View style={styles.section}>
          <Button onPress={() => setShowPlanSheet(true)}>
            Add to Meal Plan
          </Button>
        </View>
      </ScrollView>

      {/* Meal plan day picker bottom sheet */}
      <BottomSheet
        isOpen={showPlanSheet}
        onClose={() => setShowPlanSheet(false)}
        snapPoints={['45%']}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Pick a Day</Text>
          {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
            const date = addDays(new Date(), offset);
            const label =
              offset === 0
                ? 'Today'
                : offset === 1
                ? 'Tomorrow'
                : format(date, 'EEEE');
            return (
              <Pressable
                key={offset}
                onPress={() => handleAddToPlan(offset)}
                style={styles.dayRow}
              >
                <Text style={styles.dayLabel}>{label}</Text>
                <Text style={styles.dayDate}>{format(date, 'MMM d')}</Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  heroContainer: {
    position: 'relative',
    height: 240,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 64,
  },
  headerBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    left: spacing.md,
  },
  favBtn: {
    right: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  category: {
    ...typography.labelLg,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  metaLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'none',
  },
  metaValue: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingAvg: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingCount: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  sectionTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  scalerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scaleBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  scaleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scaleBtnText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  scaleBtnTextActive: {
    color: colors.onPrimary,
  },
  noteCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  noteContent: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  noteDate: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  noteInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  noteInput: {
    flex: 1,
    ...typography.bodyMd,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.onSurface,
    maxHeight: 80,
  },
  noteSubmit: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteSubmitDisabled: {
    opacity: 0.4,
  },
  sheetContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sheetTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  dayLabel: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  dayDate: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
