import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { RecipeInsert, Ingredient, InstructionStep } from '../../types/database';

const CATEGORY_OPTIONS = [
  'Mexican',
  'Seafood',
  'Chicken',
  'Vegetarian',
  'Pasta',
  'Asian',
  'Salads',
  'Soups',
  'Desserts',
  'Other',
];

interface RecipeFormProps {
  onSubmit: (recipe: Omit<RecipeInsert, 'household_id' | 'created_by'>, imageUri?: string) => void;
  loading?: boolean;
}

export function RecipeForm({ onSubmit, loading = false }: RecipeFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('4');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { amount: 0, unit: '', name: '' },
  ]);
  const [instructions, setInstructions] = useState<InstructionStep[]>([
    { step_number: 1, text: '' },
  ]);
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
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
    // Renumber steps
    setInstructions(updated.map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const updateInstruction = (index: number, text: string) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], text };
    setInstructions(updated);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Recipe name is required';
    }

    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    const validInstructions = instructions.filter((i) => i.text.trim());
    if (validInstructions.length === 0) {
      newErrors.instructions = 'At least one instruction is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const validIngredients = ingredients.filter((i) => i.name.trim());
    const validInstructions = instructions
      .filter((i) => i.text.trim())
      .map((s, idx) => ({ ...s, step_number: idx + 1 }));

    const recipe: Omit<RecipeInsert, 'household_id' | 'created_by'> = {
      name: name.trim(),
      category: category || null,
      prep_time_minutes: prepTime ? parseInt(prepTime, 10) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime, 10) : null,
      servings: parseInt(servings, 10) || 4,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      ingredients: validIngredients,
      instructions: validInstructions,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
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
      {/* Photo */}
      <Pressable onPress={pickImage} style={styles.imagePickerContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.selectedImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="camera-plus" size={32} color={colors.onSurfaceVariant} />
            <Text style={styles.imageText}>Add Photo</Text>
          </View>
        )}
      </Pressable>

      {/* Name */}
      <Input
        label="Recipe Name"
        placeholder="e.g., Street Tacos al Pastor"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />

      {/* Category picker */}
      <Text style={styles.sectionLabel}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORY_OPTIONS.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategory(category === cat ? '' : cat)}
            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
          >
            <Text
              style={[
                styles.categoryChipText,
                category === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Time and servings */}
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="Prep (min)"
            placeholder="15"
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Cook (min)"
            placeholder="30"
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="Servings"
            placeholder="4"
            value={servings}
            onChangeText={setServings}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Est. Cost ($)"
            placeholder="12.50"
            value={estimatedCost}
            onChangeText={setEstimatedCost}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Ingredients */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Ingredients</Text>
        {errors.ingredients && (
          <Text style={styles.sectionError}>{errors.ingredients}</Text>
        )}
      </View>
      {ingredients.map((ing, index) => (
        <View key={index} style={styles.ingredientRow}>
          <View style={styles.ingredientAmount}>
            <Input
              placeholder="Amt"
              value={ing.amount > 0 ? String(ing.amount) : ''}
              onChangeText={(val) =>
                updateIngredient(index, 'amount', parseFloat(val) || 0)
              }
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.ingredientUnit}>
            <Input
              placeholder="Unit"
              value={ing.unit}
              onChangeText={(val) => updateIngredient(index, 'unit', val)}
            />
          </View>
          <View style={styles.ingredientName}>
            <Input
              placeholder="Ingredient"
              value={ing.name}
              onChangeText={(val) => updateIngredient(index, 'name', val)}
            />
          </View>
          {ingredients.length > 1 && (
            <Pressable
              onPress={() => removeIngredient(index)}
              style={styles.removeBtn}
            >
              <MaterialCommunityIcons name="close-circle" size={22} color={colors.error} />
            </Pressable>
          )}
        </View>
      ))}
      <Pressable onPress={addIngredient} style={styles.addRow}>
        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addText}>Add Ingredient</Text>
      </Pressable>

      {/* Instructions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Instructions</Text>
        {errors.instructions && (
          <Text style={styles.sectionError}>{errors.instructions}</Text>
        )}
      </View>
      {instructions.map((step, index) => (
        <View key={index} style={styles.instructionRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{step.step_number}</Text>
          </View>
          <View style={styles.instructionInput}>
            <Input
              placeholder={`Step ${step.step_number}`}
              value={step.text}
              onChangeText={(val) => updateInstruction(index, val)}
              multiline
            />
          </View>
          {instructions.length > 1 && (
            <Pressable
              onPress={() => removeInstruction(index)}
              style={styles.removeBtn}
            >
              <MaterialCommunityIcons name="close-circle" size={22} color={colors.error} />
            </Pressable>
          )}
        </View>
      ))}
      <Pressable onPress={addInstruction} style={styles.addRow}>
        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addText}>Add Step</Text>
      </Pressable>

      {/* Tags */}
      <Input
        label="Tags (comma separated)"
        placeholder="quick, weeknight, spicy"
        value={tags}
        onChangeText={setTags}
      />

      {/* Submit */}
      <Button onPress={handleSubmit} loading={loading} style={styles.submitBtn}>
        Save Recipe
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  imagePickerContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  imageText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  sectionLabel: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  sectionError: {
    ...typography.bodySm,
    color: colors.error,
  },
  categoryScroll: {
    maxHeight: 40,
    marginBottom: spacing.md,
  },
  categoryContainer: {
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  categoryChipTextActive: {
    color: colors.onPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  ingredientAmount: {
    width: 60,
  },
  ingredientUnit: {
    width: 70,
  },
  ingredientName: {
    flex: 1,
  },
  removeBtn: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  addText: {
    ...typography.labelLg,
    color: colors.primary,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  stepBadgeText: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
  },
  instructionInput: {
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.lg,
  },
});
