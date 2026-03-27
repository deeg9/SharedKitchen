import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { useRecipeStore } from '../../stores/recipeStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { usePlanStore, MealPlanWithRecipe } from '../../stores/planStore';
import { formatDayLabel } from '../../lib/dates';
import { Recipe, MealType, MEAL_TYPES, MEAL_TYPE_CONFIG, MealSource, MEAL_SOURCES, MEAL_SOURCE_CONFIG } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface PlanEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  dateString: string;
  mealType: MealType;
  existingPlan?: MealPlanWithRecipe;
}

export function PlanEditSheet({
  isOpen,
  onClose,
  date,
  dateString,
  mealType,
  existingPlan,
}: PlanEditSheetProps) {
  const router = useRouter();
  const { recipes } = useRecipeStore();
  const { members, activeHouseholdId } = useHouseholdStore();
  const { assignRecipe, clearMeal } = usePlanStore();

  const [selectedMealType, setSelectedMealType] = useState<MealType>(mealType);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedCookId, setSelectedCookId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [mealSource, setMealSource] = useState<MealSource>('home-cooked');
  const [mealCost, setMealCost] = useState('');

  const label = formatDayLabel(date);

  const isNonHomeMade = mealSource === 'takeout' || mealSource === 'eating-out';

  // Pre-fill from existing plan or reset
  useEffect(() => {
    setSelectedMealType(mealType);
    if (existingPlan) {
      setSelectedRecipeId(existingPlan.recipe_id);
      setSelectedCookId(existingPlan.assigned_cook);
      setNotes(existingPlan.notes ?? '');
      setMealSource((existingPlan.meal_source as MealSource) ?? 'home-cooked');
      setMealCost(existingPlan.meal_cost != null ? String(existingPlan.meal_cost) : '');
    } else {
      setSelectedRecipeId(null);
      setSelectedCookId(null);
      setNotes('');
      setMealSource('home-cooked');
      setMealCost('');
    }
    setSearch('');
  }, [existingPlan, mealType, isOpen]);

  const filteredRecipes = useMemo(() => {
    if (!search) return recipes;
    const q = search.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  const canSave = isNonHomeMade
    ? mealCost !== '' && parseFloat(mealCost) > 0
    : !!selectedRecipeId;

  const handleSave = async () => {
    if (!activeHouseholdId || !canSave) return;
    setSaving(true);
    try {
      await assignRecipe(
        activeHouseholdId,
        dateString,
        selectedMealType,
        isNonHomeMade ? selectedRecipeId : selectedRecipeId,
        selectedCookId ?? undefined,
        notes || undefined,
        mealSource,
        mealCost ? parseFloat(mealCost) : undefined
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!activeHouseholdId) return;
    setSaving(true);
    try {
      await clearMeal(activeHouseholdId, dateString, selectedMealType);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewRecipe = () => {
    onClose();
    router.push('/(app)/recipe/add');
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const isSelected = item.id === selectedRecipeId;
    return (
      <Pressable
        onPress={() => setSelectedRecipeId(item.id)}
        style={[styles.recipeItem, isSelected && styles.recipeItemSelected]}
      >
        <Text
          style={[styles.recipeItemText, isSelected && styles.recipeItemTextSelected]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.prep_time_minutes != null && (
          <Text style={styles.recipeItemMeta}>
            {item.prep_time_minutes + (item.cook_time_minutes ?? 0)}m
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['90%']}>
      <View style={styles.container}>
        {/* Date Header */}
        <Text style={styles.dateTitle}>
          {label.weekday} {label.month} {label.day}
        </Text>

        {/* Meal Type Selector */}
        <Text style={styles.sectionTitle}>Meal Type</Text>
        <View style={styles.mealTypeRow}>
          {MEAL_TYPES.map((mt) => {
            const config = MEAL_TYPE_CONFIG[mt];
            const isActive = mt === selectedMealType;
            return (
              <Pressable
                key={mt}
                onPress={() => setSelectedMealType(mt)}
                style={[styles.mealTypePill, isActive && styles.mealTypePillActive]}
              >
                <MaterialCommunityIcons
                  name={config.icon}
                  size={18}
                  color={isActive ? colors.onPrimary : colors.onSurface}
                />
                <Text style={[styles.mealTypePillText, isActive && styles.mealTypePillTextActive]}>
                  {config.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Meal Source Selector */}
        <Text style={styles.sectionTitle}>Meal Source</Text>
        <View style={styles.mealTypeRow}>
          {MEAL_SOURCES.map((ms) => {
            const config = MEAL_SOURCE_CONFIG[ms];
            const isActive = ms === mealSource;
            return (
              <Pressable
                key={ms}
                onPress={() => setMealSource(ms)}
                style={[styles.mealTypePill, isActive && styles.mealTypePillActive]}
              >
                <MaterialCommunityIcons
                  name={config.icon}
                  size={18}
                  color={isActive ? colors.onPrimary : colors.onSurface}
                />
                <Text style={[styles.mealTypePillText, isActive && styles.mealTypePillTextActive]}>
                  {config.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Cost Input (for takeout/eating-out) */}
        {isNonHomeMade && (
          <>
            <Text style={styles.sectionTitle}>Cost</Text>
            <View style={styles.costRow}>
              <Text style={styles.costPrefix}>$</Text>
              <TextInput
                style={styles.costInput}
                placeholder="0.00"
                placeholderTextColor={colors.outlineVariant}
                value={mealCost}
                onChangeText={setMealCost}
                keyboardType="decimal-pad"
                testID="plan-edit-cost-input"
              />
            </View>
          </>
        )}

        {/* Recipe Picker (optional for non-home-cooked) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isNonHomeMade ? 'Recipe (optional)' : 'Choose Recipe'}
          </Text>
          <Pressable onPress={handleAddNewRecipe} style={styles.addRecipeLink}>
            <MaterialCommunityIcons name="plus" size={14} color={colors.primary} />
            <Text style={styles.addRecipeLinkText}>Add New</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={colors.outlineVariant}
          value={search}
          onChangeText={setSearch}
          testID="plan-edit-search-input"
        />
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipeItem}
          style={styles.recipeList}
          showsVerticalScrollIndicator={false}
        />

        {/* Cook Assignment */}
        <Text style={styles.sectionTitle}>Assign Cook</Text>
        <View style={styles.cookRow}>
          {members.map((member) => {
            const isSelected = member.user_id === selectedCookId;
            const displayName = member.profiles?.display_name ?? 'Member';
            return (
              <Pressable
                key={member.id}
                onPress={() => setSelectedCookId(isSelected ? null : member.user_id)}
                style={[styles.cookChip, isSelected && styles.cookChipSelected]}
              >
                <Text style={[styles.cookChipText, isSelected && styles.cookChipTextSelected]}>
                  {displayName}
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.addCookButton}>
            <MaterialCommunityIcons name="plus" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add notes..."
          placeholderTextColor={colors.outlineVariant}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Button variant="primary" onPress={handleSave} loading={saving} disabled={!canSave} testID="plan-edit-save">
            Save
          </Button>
          {existingPlan && (
            <Button variant="ghost" onPress={handleClear} loading={saving}>
              Clear Meal
            </Button>
          )}
          <Button variant="tertiary" onPress={onClose}>
            Cancel
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  dateTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  // Meal Type Selector
  mealTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mealTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  mealTypePillActive: {
    backgroundColor: colors.primary,
  },
  mealTypePillText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  mealTypePillTextActive: {
    color: colors.onPrimary,
  },
  // Cost input
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  costPrefix: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  costInput: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  // Add Recipe link
  addRecipeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  addRecipeLinkText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  // Search & Recipe list
  searchInput: {
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  recipeList: {
    maxHeight: 140,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  recipeItemSelected: {
    backgroundColor: colors.primaryContainer,
  },
  recipeItemText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  recipeItemTextSelected: {
    color: colors.onPrimaryContainer,
    fontWeight: '600',
  },
  recipeItemMeta: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginLeft: spacing.sm,
    textTransform: 'none',
  },
  // Cook assignment
  cookRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  cookChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
  },
  cookChipSelected: {
    backgroundColor: colors.primaryContainer,
  },
  cookChipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  cookChipTextSelected: {
    color: colors.onPrimaryContainer,
  },
  addCookButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Notes
  notesInput: {
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
