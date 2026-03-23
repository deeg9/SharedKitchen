import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecipeForm } from '../../../src/components/recipes/RecipeForm';
import { useRecipeStore } from '../../../src/stores/recipeStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { supabase } from '../../../src/lib/supabase';
import { RecipeInsert } from '../../../src/types/database';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';

export default function AddRecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createRecipe } = useRecipeStore();
  const { activeHouseholdId } = useHouseholdStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    recipeData: Omit<RecipeInsert, 'household_id' | 'created_by'>,
    imageUri?: string
  ) => {
    if (!activeHouseholdId) {
      Alert.alert('Error', 'No active household selected.');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be signed in to add a recipe.');
        setLoading(false);
        return;
      }

      let imageUrl: string | null = null;

      // Upload image if provided
      if (imageUri) {
        const fileName = `${activeHouseholdId}/${Date.now()}.jpg`;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue without image rather than blocking recipe creation
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from('recipe-images').getPublicUrl(uploadData.path);
          imageUrl = publicUrl;
        }
      }

      const recipe: RecipeInsert = {
        ...recipeData,
        household_id: activeHouseholdId,
        created_by: user.id,
        image_url: imageUrl,
      };

      const created = await createRecipe(recipe);

      if (created) {
        router.back();
      } else {
        Alert.alert('Error', 'Failed to create recipe. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Recipe</Text>
      </View>
      <RecipeForm onSubmit={handleSubmit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
});
