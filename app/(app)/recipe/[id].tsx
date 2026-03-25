import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from '../../../src/components/ui/BottomSheet';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { useRecipeStore, scaleIngredients } from '../../../src/stores/recipeStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { usePlanStore } from '../../../src/stores/planStore';
import { colors } from '../../../src/theme/colors';
import { typography, fontFamily } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { getDefaultRecipeImage } from '../../../src/lib/images';
import { Ingredient, InstructionStep as InstructionStepType } from '../../../src/types/database';
import { format, addDays } from 'date-fns';
import { usePresence, PresenceMember } from '../../../src/hooks/usePresence';
import { PresenceAvatarStack } from '../../../src/components/presence/PresenceAvatarStack';
import { useAuthStore } from '../../../src/stores/authStore';

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
  const householdMembers = useHouseholdStore((s) => s.members);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;

  const [scale, setScale] = useState<1 | 2 | 3>(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [noteText, setNoteText] = useState('');
  const [showPlanSheet, setShowPlanSheet] = useState(false);

  useEffect(() => {
    if (id) fetchRecipeDetail(id);
  }, [id]);

  // AppState tracking for presence accuracy (RT-04)
  const [appActive, setAppActive] = useState(true);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Build currentUser for presence
  const memberProfile = householdMembers.find((m) => m.user_id === user?.id)?.profiles;
  const currentPresenceUser: PresenceMember | null = user ? {
    user_id: user.id,
    display_name: memberProfile?.display_name ?? 'Me',
    avatar_url: memberProfile?.avatar_url ?? null,
  } : null;

  // Presence hook -- channelKey is null when app is backgrounded
  const presenceMembers = usePresence(
    appActive && id ? `recipe:${id}` : null,
    currentPresenceUser
  );

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

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const assignRecipe = usePlanStore((s) => s.assignRecipe);
  const handleAddToPlan = async (dayOffset: number) => {
    if (!recipe || !activeHouseholdId) return;
    const planDate = format(addDays(new Date(), dayOffset), 'yyyy-MM-dd');
    await assignRecipe(activeHouseholdId, planDate, 'dinner', recipe.id);
    setShowPlanSheet(false);
  };

  if (loading || !recipe) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <Skeleton height={300} borderRadius={0} />
        <View style={{ padding: spacing.md }}>
          <Skeleton.Text width="70%" />
          <Skeleton.Text width="40%" style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    );
  }

  const heroUri = recipe.image_url || getDefaultRecipeImage(recipe.id, recipe.category);
  const ratingCount = ratings.filter((r) => r.rating != null).length;

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ── Hero Image ── */}
        <View style={s.hero}>
          <Image source={{ uri: heroUri }} style={s.heroImage} />
          <View style={s.heroGradient} />
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/recipes')}
            style={[s.headerBtn, { left: spacing.md, top: insets.top + spacing.xs }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/recipe/edit/${id}`)}
            style={[s.headerBtn, { right: spacing.md, top: insets.top + spacing.xs }]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
          </Pressable>
          {presenceMembers.length > 0 && (
            <View style={{ position: 'absolute', right: 60, top: insets.top + spacing.xs + 6, zIndex: 10 }}>
              <PresenceAvatarStack members={presenceMembers} />
            </View>
          )}
          {/* Tags on image */}
          <View style={s.heroTags}>
            {recipe.category && (
              <View style={s.heroTag}>
                <Text style={s.heroTagText}>{recipe.category}</Text>
              </View>
            )}
            {recipe.tags?.slice(0, 2).map((tag: string) => (
              <View key={tag} style={[s.heroTag, s.heroTagSecondary]}>
                <Text style={s.heroTagSecondaryText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Title & Rating ── */}
        <View style={s.titleSection}>
          <Text style={s.title}>{recipe.name}</Text>

          {/* Rating pill */}
          <View style={s.ratingPill}>
            <MaterialCommunityIcons name="star" size={18} color={colors.secondary} />
            <Text style={s.ratingValue}>{avgRating > 0 ? avgRating.toFixed(1) : '--'}</Text>
            <View style={s.ratingDivider} />
            <Text style={s.ratingCount}>{ratingCount} reviews</Text>
          </View>

          {/* Star rating */}
          <View style={s.starsRow}>
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

          {/* Metadata pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.metaRow}>
            {recipe.prep_time_minutes != null && (
              <View style={s.metaPill}>
                <View style={s.metaIcon}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={s.metaLabel}>PREP</Text>
                  <Text style={s.metaValue}>{recipe.prep_time_minutes} min</Text>
                </View>
              </View>
            )}
            {recipe.cook_time_minutes != null && (
              <View style={s.metaPill}>
                <View style={s.metaIcon}>
                  <MaterialCommunityIcons name="fire" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={s.metaLabel}>COOK</Text>
                  <Text style={s.metaValue}>{recipe.cook_time_minutes} min</Text>
                </View>
              </View>
            )}
            <View style={s.metaPill}>
              <View style={s.metaIcon}>
                <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={s.metaLabel}>SERVES</Text>
                <Text style={s.metaValue}>{recipe.servings}</Text>
              </View>
            </View>
            {recipe.estimated_cost != null && (
              <View style={s.metaPill}>
                <View style={s.metaIcon}>
                  <MaterialCommunityIcons name="cash" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={s.metaLabel}>COST</Text>
                  <Text style={s.metaValue}>${Number(recipe.estimated_cost).toFixed(0)}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* ── Ingredients ── */}
        <View style={s.ingredientSection}>
          <View style={s.ingredientHeader}>
            <Text style={s.sectionTitle}>Ingredients</Text>
          </View>

          {/* Scale pills */}
          <View style={s.scaleRow}>
            {SCALE_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setScale(opt)}
                style={[s.scaleBtn, scale === opt && s.scaleBtnActive]}
              >
                <Text style={[s.scaleBtnText, scale === opt && s.scaleBtnTextActive]}>
                  x{opt}{opt === 1 ? ' Scale' : ''}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Ingredient list */}
          {scaledIngredients.map((ing, i) => {
            const checked = checkedIngredients.has(i);
            const amountStr = ing.amount > 0 ? `${ing.amount}` : '';
            const label = [amountStr, ing.unit, ing.name].filter(Boolean).join(' ');
            return (
              <Pressable key={i} onPress={() => toggleIngredient(i)} style={s.ingredientRow}>
                <View style={[s.ingredientCheck, checked && s.ingredientCheckActive]}>
                  {checked && <MaterialCommunityIcons name="check" size={14} color={colors.onPrimary} />}
                </View>
                <Text style={[s.ingredientText, checked && s.ingredientTextChecked]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Method (Instructions) ── */}
        <View style={s.methodSection}>
          <Text style={s.sectionTitleLarge}>Method</Text>
          {(recipe.instructions as InstructionStepType[]).map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={[s.stepBadge, i === 0 ? s.stepBadgePrimary : s.stepBadgeLight]}>
                <Text style={[s.stepBadgeText, i === 0 && s.stepBadgeTextPrimary]}>
                  {String(step.step_number).padStart(2, '0')}
                </Text>
              </View>
              <View style={s.stepContent}>
                <Text style={s.stepText}>{step.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Household Tips (Notes) ── */}
        <View style={s.notesSection}>
          <Text style={s.sectionTitle}>Household Tips</Text>
          {notes.map((note) => (
            <View key={note.id} style={s.noteCard}>
              <View style={s.noteAvatar}>
                <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
              </View>
              <View style={s.noteBody}>
                <Text style={s.noteDate}>{format(new Date(note.created_at), 'MMM d, yyyy')}</Text>
                <Text style={s.noteContent}>{note.content}</Text>
              </View>
            </View>
          ))}
          <View style={s.noteInputRow}>
            <View style={s.noteInputAvatar}>
              <MaterialCommunityIcons name="account" size={18} color={colors.outlineVariant} />
            </View>
            <TextInput
              style={s.noteInput}
              placeholder="Add your family's twist..."
              placeholderTextColor={colors.outlineVariant}
              value={noteText}
              onChangeText={setNoteText}
              onSubmitEditing={handleAddNote}
            />
          </View>
        </View>

        {/* ── Tags ── */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={s.tagsSection}>
            {recipe.tags.map((tag: string) => (
              <View key={tag} style={s.tagChip}>
                <Text style={s.tagChipText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {recipe.instructions && (recipe.instructions as InstructionStepType[]).length > 0 && (
          <Pressable
            onPress={() => router.push(`/recipe/cook/${id}`)}
            style={s.startCookingBtn}
          >
            <MaterialCommunityIcons name="pot-steam" size={22} color={colors.onSecondary} />
            <Text style={s.startCookingText}>Start Cooking</Text>
          </Pressable>
        )}
        <Pressable onPress={() => setShowPlanSheet(true)} style={s.addToPlanBtn}>
          <MaterialCommunityIcons name="calendar-plus" size={22} color={colors.onPrimary} />
          <Text style={s.addToPlanText}>Add to Plan</Text>
        </Pressable>
        <Pressable onPress={handleFavorite} style={s.favButton}>
          <MaterialCommunityIcons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={isFavorite ? colors.error : colors.secondary}
          />
        </Pressable>
      </View>

      {/* Day picker sheet */}
      <BottomSheet isOpen={showPlanSheet} onClose={() => setShowPlanSheet(false)} snapPoints={['45%']}>
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
          <Text style={s.sectionTitle}>Pick a Day</Text>
          {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
            const date = addDays(new Date(), offset);
            const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : format(date, 'EEEE');
            return (
              <Pressable key={offset} onPress={() => handleAddToPlan(offset)} style={s.dayRow}>
                <Text style={s.dayLabel}>{label}</Text>
                <Text style={s.dayDate}>{format(date, 'MMM d')}</Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  // Hero
  hero: { position: 'relative', height: 360 },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
    backgroundColor: colors.surface, opacity: 0.85,
  },
  headerBtn: {
    position: 'absolute', width: 40, height: 40, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center',
  },
  heroTags: {
    position: 'absolute', bottom: spacing.lg, left: spacing.md,
    flexDirection: 'row', gap: spacing.xs,
  },
  heroTag: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full, backgroundColor: 'rgba(51,69,55,0.1)',
    borderWidth: 1, borderColor: 'rgba(51,69,55,0.2)',
  },
  heroTagText: { fontSize: 9, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.5 },
  heroTagSecondary: { backgroundColor: 'rgba(254,147,44,0.8)', borderColor: 'transparent' },
  heroTagSecondaryText: { fontSize: 9, fontWeight: '800', color: '#663500', textTransform: 'uppercase', letterSpacing: 1.5 },

  // Title
  titleSection: { paddingHorizontal: spacing.md, marginTop: -spacing.md },
  title: {
    fontFamily: fontFamily.headlineBold, fontSize: 32, fontWeight: '800',
    color: colors.primary, letterSpacing: -0.5, lineHeight: 38, marginBottom: spacing.md,
  },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerLow, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.outlineVariant,
    gap: spacing.xs, marginBottom: spacing.sm,
  },
  ratingValue: { fontFamily: fontFamily.headlineBold, fontWeight: '700', color: colors.primary, fontSize: 15 },
  ratingDivider: { width: 1, height: 16, backgroundColor: colors.outlineVariant, marginHorizontal: spacing.xs },
  ratingCount: { ...typography.bodySm, color: colors.onSurfaceVariant },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: spacing.md },

  // Metadata
  metaRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outlineVariant,
    ...shadows.editorial,
  },
  metaIcon: {
    width: 32, height: 32, borderRadius: borderRadius.full, backgroundColor: colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  metaLabel: { fontSize: 8, fontWeight: '800', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 },
  metaValue: { fontSize: 14, fontFamily: fontFamily.headlineBold, fontWeight: '700', color: colors.primary },

  // Ingredients
  ingredientSection: {
    marginHorizontal: spacing.md, marginTop: spacing.xl,
    backgroundColor: colors.surfaceContainerLow, padding: spacing.lg,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant,
  },
  ingredientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontFamily: fontFamily.headlineBold, fontSize: 20, fontWeight: '800', color: colors.primary },
  scaleRow: {
    flexDirection: 'row', backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.full, padding: 3, borderWidth: 1, borderColor: colors.outlineVariant,
    marginBottom: spacing.lg,
  },
  scaleBtn: { flex: 1, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, alignItems: 'center' },
  scaleBtnActive: { backgroundColor: colors.primary },
  scaleBtnText: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  scaleBtnTextActive: { color: colors.onPrimary },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm + 2 },
  ingredientCheck: {
    width: 24, height: 24, borderRadius: borderRadius.full, borderWidth: 2,
    borderColor: colors.outlineVariant, marginRight: spacing.md,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  ingredientCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ingredientText: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '500', flex: 1, lineHeight: 24 },
  ingredientTextChecked: { textDecorationLine: 'line-through', color: colors.onSurfaceVariant, opacity: 0.5, fontStyle: 'italic' },

  // Method
  methodSection: { paddingHorizontal: spacing.md, marginTop: spacing.xl },
  sectionTitleLarge: { fontFamily: fontFamily.headlineBold, fontSize: 26, fontWeight: '800', color: colors.primary, marginBottom: spacing.xl },
  stepRow: { flexDirection: 'row', marginBottom: spacing.xl },
  stepBadge: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  stepBadgePrimary: { backgroundColor: colors.primary, ...shadows.editorial },
  stepBadgeLight: { backgroundColor: colors.primaryFixed },
  stepBadgeText: { fontFamily: fontFamily.headlineBold, fontWeight: '800', fontSize: 16, color: colors.primary },
  stepBadgeTextPrimary: { color: colors.onPrimary },
  stepContent: { flex: 1, paddingTop: spacing.xs },
  stepText: { ...typography.bodyLg, color: colors.onSurfaceVariant, lineHeight: 26 },

  // Notes
  notesSection: { paddingHorizontal: spacing.md, marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  noteCard: {
    flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.surfaceContainer,
    padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm,
  },
  noteAvatar: {
    width: 36, height: 36, borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryFixed, alignItems: 'center', justifyContent: 'center',
  },
  noteBody: { flex: 1 },
  noteDate: { ...typography.labelSm, color: colors.primary, fontWeight: '700', marginBottom: 2, textTransform: 'none' },
  noteContent: { ...typography.bodySm, color: colors.onSurfaceVariant },
  noteInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  noteInputAvatar: {
    width: 36, height: 36, borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center',
  },
  noteInput: {
    flex: 1, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
    paddingVertical: spacing.sm, fontSize: 14, color: colors.onSurface,
  },

  // Tags
  tagsSection: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.lg },
  tagChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, backgroundColor: colors.surfaceContainer,
  },
  tagChipText: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingTop: spacing.md,
    backgroundColor: 'rgba(251,249,245,0.9)',
    borderTopWidth: 1, borderTopColor: colors.outlineVariant,
  },
  startCookingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.secondaryContainer, height: 56,
    borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, ...shadows.float,
  },
  startCookingText: {
    fontFamily: fontFamily.headlineBold, fontWeight: '800', fontSize: 14,
    color: colors.onSecondary, textTransform: 'uppercase', letterSpacing: 1.5,
  },
  addToPlanBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary, height: 56,
    borderRadius: borderRadius.xl, ...shadows.float,
  },
  addToPlanText: {
    fontFamily: fontFamily.headlineBold, fontWeight: '800', fontSize: 14,
    color: colors.onPrimary, textTransform: 'uppercase', letterSpacing: 1.5,
  },
  favButton: {
    width: 56, height: 56, borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant,
    alignItems: 'center', justifyContent: 'center', ...shadows.editorial,
  },

  // Day picker
  dayRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  dayLabel: { ...typography.bodyLg, color: colors.onSurface },
  dayDate: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
