import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { RecipeInsert, Ingredient, InstructionStep } from '../../types/database';
import { CATEGORIES } from '../../lib/categories';

const TAG_OPTIONS = [
  'Spicy',
  'Quick',
  'Dairy-Free',
  'Healthy',
  'Gluten-Free',
  'High Protein',
  'Budget',
  'Comfort Food',
];

const UNIT_OPTIONS = ['cups', 'tbsp', 'tsp', 'oz', 'lbs', 'grams', 'ml', 'medium', 'cloves', 'pinch', ''];

interface RecipeFormProps {
  onSubmit: (recipe: Omit<RecipeInsert, 'household_id' | 'created_by'>, imageUri?: string) => void;
  loading?: boolean;
  initialData?: Omit<RecipeInsert, 'household_id' | 'created_by'>;
}

export function RecipeForm({ onSubmit, loading = false, initialData }: RecipeFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prepTime, setPrepTime] = useState(
    initialData?.prep_time_minutes != null ? String(initialData.prep_time_minutes) : ''
  );
  const [cookTime, setCookTime] = useState(
    initialData?.cook_time_minutes != null ? String(initialData.cook_time_minutes) : ''
  );
  const [servings, setServings] = useState(
    initialData?.servings != null ? initialData.servings : 4
  );
  const [estimatedCost, setEstimatedCost] = useState(
    initialData?.estimated_cost != null ? String(initialData.estimated_cost) : ''
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients?.length ? initialData.ingredients : [{ amount: 0, unit: '', name: '' }]
  );
  const [instructions, setInstructions] = useState<InstructionStep[]>(
    initialData?.instructions?.length ? initialData.instructions : [{ step_number: 1, text: '' }]
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? '');
      setCategory(initialData.category ?? '');
      setPrepTime(initialData.prep_time_minutes != null ? String(initialData.prep_time_minutes) : '');
      setCookTime(initialData.cook_time_minutes != null ? String(initialData.cook_time_minutes) : '');
      setServings(initialData.servings ?? 4);
      setEstimatedCost(initialData.estimated_cost != null ? String(initialData.estimated_cost) : '');
      setIngredients(initialData.ingredients?.length ? initialData.ingredients : [{ amount: 0, unit: '', name: '' }]);
      setInstructions(initialData.instructions?.length ? initialData.instructions : [{ step_number: 1, text: '' }]);
      setSelectedTags(initialData.tags ?? []);
    }
  }, [initialData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { amount: 0, unit: '', name: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([
      ...instructions,
      { step_number: instructions.length + 1, text: '' },
    ]);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length <= 1) return;
    const updated = instructions.filter((_, i) => i !== index);
    setInstructions(updated.map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const updateInstruction = (index: number, text: string) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], text };
    setInstructions(updated);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Recipe name is required';
    if (ingredients.filter((i) => i.name.trim()).length === 0)
      newErrors.ingredients = 'At least one ingredient is required';
    if (instructions.filter((i) => i.text.trim()).length === 0)
      newErrors.instructions = 'At least one instruction is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const recipe: Omit<RecipeInsert, 'household_id' | 'created_by'> = {
      name: name.trim(),
      category: category || null,
      prep_time_minutes: prepTime ? parseInt(prepTime, 10) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime, 10) : null,
      servings,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      ingredients: ingredients.filter((i) => i.name.trim()),
      instructions: instructions
        .filter((i) => i.text.trim())
        .map((s, idx) => ({ ...s, step_number: idx + 1 })),
      tags: selectedTags,
      source_url: initialData?.source_url ?? null,
    };
    onSubmit(recipe, imageUri ?? undefined);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Section: Basic Info + Photo ── */}
      <View style={styles.basicInfoSection}>
        {/* Name */}
        <View style={styles.nameGroup}>
          <Text style={styles.fieldLabel}>RECIPE NAME</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="The Best Sourdough Ever..."
            placeholderTextColor={colors.outlineVariant}
            value={name}
            onChangeText={setName}
            testID="recipe-form-name-input"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Category */}
        <View style={styles.categoryGroup}>
          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(category === cat ? '' : cat)}
                style={[styles.chip, category === cat && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Cover Photo */}
        <View>
          <Text style={styles.fieldLabel}>COVER PHOTO</Text>
          <Pressable onPress={pickImage} style={styles.photoContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.photoActions}>
                  <View style={styles.photoActionBtn}>
                    <MaterialCommunityIcons name="camera" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.photoActionBtn}>
                    <MaterialCommunityIcons name="image-multiple" size={24} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.photoText}>Add a photo</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Section: Metadata Grid ── */}
      <View style={styles.metaSection}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.fieldLabel}>PREP TIME</Text>
            <View style={styles.metaInputWrap}>
              <TextInput
                style={styles.metaInput}
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor={colors.outlineVariant}
              />
              <Text style={styles.metaUnit}>min</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.fieldLabel}>COOK TIME</Text>
            <View style={styles.metaInputWrap}>
              <TextInput
                style={styles.metaInput}
                value={cookTime}
                onChangeText={setCookTime}
                keyboardType="numeric"
                placeholder="45"
                placeholderTextColor={colors.outlineVariant}
              />
              <Text style={styles.metaUnit}>min</Text>
            </View>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.fieldLabel}>SERVINGS</Text>
            <View style={styles.servingStepper}>
              <Pressable
                onPress={() => setServings(Math.max(1, servings - 1))}
                style={styles.stepperBtn}
              >
                <MaterialCommunityIcons name="minus" size={18} color={colors.primary} />
              </Pressable>
              <Text style={styles.servingValue}>{servings}</Text>
              <Pressable
                onPress={() => setServings(servings + 1)}
                style={styles.stepperBtn}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.fieldLabel}>ESTIMATED COST</Text>
            <View style={styles.metaInputWrap}>
              <Text style={styles.metaUnit}>$</Text>
              <TextInput
                style={styles.metaInput}
                value={estimatedCost}
                onChangeText={setEstimatedCost}
                keyboardType="decimal-pad"
                placeholder="15.00"
                placeholderTextColor={colors.outlineVariant}
              />
            </View>
          </View>
        </View>
      </View>

      {/* ── Section: Ingredients ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.sectionSubtitle}>List items needed</Text>
        </View>
        {errors.ingredients && <Text style={styles.errorText}>{errors.ingredients}</Text>}

        {ingredients.map((ing, index) => (
          <View key={index} style={styles.ingredientRow}>
            <TextInput
              style={[styles.ingInput, styles.ingAmount]}
              value={ing.amount > 0 ? String(ing.amount) : ''}
              onChangeText={(val) => updateIngredient(index, 'amount', parseFloat(val) || 0)}
              keyboardType="decimal-pad"
              placeholder="Qty"
              placeholderTextColor={colors.outlineVariant}
              textAlign="center"
            />
            <TextInput
              style={[styles.ingInput, styles.ingUnit]}
              value={ing.unit}
              onChangeText={(val) => updateIngredient(index, 'unit', val)}
              placeholder="unit"
              placeholderTextColor={colors.outlineVariant}
            />
            <TextInput
              style={[styles.ingInput, styles.ingName]}
              value={ing.name}
              onChangeText={(val) => updateIngredient(index, 'name', val)}
              placeholder="Ingredient name"
              placeholderTextColor={colors.outlineVariant}
            />
            {ingredients.length > 1 && (
              <Pressable onPress={() => removeIngredient(index)} style={styles.removeBtn}>
                <MaterialCommunityIcons name="close" size={18} color={colors.outlineVariant} />
              </Pressable>
            )}
          </View>
        ))}

        <Pressable onPress={addIngredient} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Ingredient</Text>
        </Pressable>
      </View>

      {/* ── Section: Instructions ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.sectionSubtitle}>Step by step</Text>
        </View>
        {errors.instructions && <Text style={styles.errorText}>{errors.instructions}</Text>}

        {instructions.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{step.step_number}</Text>
            </View>
            <TextInput
              style={styles.stepInput}
              value={step.text}
              onChangeText={(val) => updateInstruction(index, val)}
              placeholder={`Describe step ${step.step_number}...`}
              placeholderTextColor={colors.outlineVariant}
              multiline
            />
            {instructions.length > 1 && (
              <Pressable onPress={() => removeInstruction(index)} style={styles.removeBtn}>
                <MaterialCommunityIcons name="close" size={18} color={colors.outlineVariant} />
              </Pressable>
            )}
          </View>
        ))}

        <Pressable onPress={addInstruction} style={styles.addStepButton}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Step</Text>
        </Pressable>
      </View>

      {/* ── Section: Tags ── */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>TAGS & PREFERENCES</Text>
        <View style={styles.tagWrap}>
          {TAG_OPTIONS.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.tagChip, isActive && styles.tagChipActive]}
              >
                <Text style={[styles.tagChipText, isActive && styles.tagChipTextActive]}>
                  {tag}
                </Text>
                <MaterialCommunityIcons
                  name={isActive ? 'close' : 'plus'}
                  size={14}
                  color={isActive ? colors.onPrimary : colors.onSurface}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Section: Save ── */}
      <View style={styles.saveSection}>
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          testID="recipe-form-save-button"
        >
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.onPrimary} />
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Recipe'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl * 3,
  },
  // Field labels
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
    marginTop: 2,
  },
  // Basic Info
  basicInfoSection: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  nameGroup: {},
  nameInput: {
    fontSize: 24,
    fontFamily: fontFamily.headlineBold,
    fontWeight: '700',
    color: colors.onSurface,
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: 2,
    minHeight: 48,
  },
  categoryGroup: {},
  chipRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  // Photo
  photoContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  photoPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoActionBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.editorial,
  },
  photoText: {
    ...typography.labelMd,
    color: colors.outline,
  },
  // Metadata
  metaSection: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flex: 1,
  },
  metaInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.xs,
  },
  metaInput: {
    flex: 1,
    fontFamily: fontFamily.headlineBold,
    fontWeight: '700',
    fontSize: 16,
    color: colors.onSurface,
    padding: 0,
  },
  metaUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.outline,
  },
  servingStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingValue: {
    fontFamily: fontFamily.headlineBold,
    fontWeight: '700',
    fontSize: 16,
    color: colors.onSurface,
  },
  // Sections
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionSubtitle: {
    ...typography.labelMd,
    color: colors.outline,
  },
  // Ingredients
  ingredientRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ingInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  ingAmount: {
    width: 60,
  },
  ingUnit: {
    width: 65,
  },
  ingName: {
    flex: 1,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  addButtonText: {
    fontFamily: fontFamily.headlineBold,
    fontWeight: '600',
    fontSize: 14,
    color: colors.primary,
  },
  // Instructions
  stepRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    fontFamily: fontFamily.headlineBold,
    fontWeight: '700',
    fontSize: 14,
    color: colors.onPrimary,
  },
  stepInput: {
    flex: 1,
    fontSize: 16,
    color: colors.onSurface,
    lineHeight: 24,
    paddingVertical: 0,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  // Tags
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    ...shadows.editorial,
  },
  tagChipText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '500',
  },
  tagChipTextActive: {
    color: colors.onPrimary,
  },
  // Save
  saveSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.float,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
