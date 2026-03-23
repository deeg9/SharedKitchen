import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { useRecipeStore } from '../../stores/recipeStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { usePlanStore, MealPlanWithRecipe } from '../../stores/planStore';
import { formatDayLabel } from '../../lib/dates';
import { Recipe } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface PlanEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  dateString: string;
  existingPlan?: MealPlanWithRecipe;
}

export function PlanEditSheet({
  isOpen,
  onClose,
  date,
  dateString,
  existingPlan,
}: PlanEditSheetProps) {
  const { recipes } = useRecipeStore();
  const { members, activeHouseholdId } = useHouseholdStore();
  const { assignRecipe, clearDay } = usePlanStore();

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedCookId, setSelectedCookId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const label = formatDayLabel(date);

  // Pre-fill from existing plan
  useEffect(() => {
    if (existingPlan) {
      setSelectedRecipeId(existingPlan.recipe_id);
      setSelectedCookId(existingPlan.assigned_cook);
      setNotes(existingPlan.notes ?? '');
    } else {
      setSelectedRecipeId(null);
      setSelectedCookId(null);
      setNotes('');
    }
    setSearch('');
  }, [existingPlan, isOpen]);

  const filteredRecipes = useMemo(() => {
    if (!search) return recipes;
    const q = search.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  const handleSave = async () => {
    if (!activeHouseholdId || !selectedRecipeId) return;
    setSaving(true);
    try {
      await assignRecipe(
        activeHouseholdId,
        dateString,
        selectedRecipeId,
        selectedCookId ?? undefined,
        notes || undefined
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
      await clearDay(activeHouseholdId, dateString);
      onClose();
    } finally {
      setSaving(false);
    }
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
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['80%']}>
      <View style={styles.container}>
        {/* Date Header */}
        <Text style={styles.dateTitle}>
          {label.weekday} {label.month} {label.day}
        </Text>

        {/* Recipe Picker */}
        <Text style={styles.sectionTitle}>Choose Recipe</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={colors.outlineVariant}
          value={search}
          onChangeText={setSearch}
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
            const displayName =
              member.profiles?.display_name ?? 'Member';
            return (
              <Pressable
                key={member.id}
                onPress={() =>
                  setSelectedCookId(isSelected ? null : member.user_id)
                }
                style={[styles.cookChip, isSelected && styles.cookChipSelected]}
              >
                <Text
                  style={[
                    styles.cookChipText,
                    isSelected && styles.cookChipTextSelected,
                  ]}
                >
                  {displayName}
                </Text>
              </Pressable>
            );
          })}
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
          <Button variant="primary" onPress={handleSave} loading={saving} disabled={!selectedRecipeId}>
            Save
          </Button>
          {existingPlan && (
            <Button variant="ghost" onPress={handleClear} loading={saving}>
              Clear Day
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
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
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
    maxHeight: 160,
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
  cookRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
