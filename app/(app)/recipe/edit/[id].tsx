import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipeForm } from '../../../../src/components/recipes/RecipeForm';
import { useRecipeStore } from '../../../../src/stores/recipeStore';
import { useHouseholdStore } from '../../../../src/stores/householdStore';
import { supabase } from '../../../../src/lib/supabase';
import { RecipeInsert, RecipeUpdate } from '../../../../src/types/database';
import { colors } from '../../../../src/theme/colors';
import { typography, fontFamily } from '../../../../src/theme/typography';
import { spacing, borderRadius } from '../../../../src/theme/spacing';
import { getErrorMessage } from '../../../../src/lib/errors';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedRecipe, fetchRecipeDetail, updateRecipe } = useRecipeStore();
  const { activeHouseholdId } = useHouseholdStore();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRecipeDetail(id).then(() => setReady(true));
    }
  }, [id]);

  const initialData = selectedRecipe
    ? {
        name: selectedRecipe.name,
        category: selectedRecipe.category,
        image_url: selectedRecipe.image_url,
        prep_time_minutes: selectedRecipe.prep_time_minutes,
        cook_time_minutes: selectedRecipe.cook_time_minutes,
        servings: selectedRecipe.servings,
        estimated_cost: selectedRecipe.estimated_cost,
        ingredients: selectedRecipe.ingredients,
        instructions: selectedRecipe.instructions,
        tags: selectedRecipe.tags,
        source_url: selectedRecipe.source_url,
      }
    : undefined;

  const handleSubmit = async (
    recipeData: Omit<RecipeInsert, 'household_id' | 'created_by'>,
    imageUri?: string
  ) => {
    if (!id || !activeHouseholdId) return;
    setLoading(true);

    try {
      let imageUrl: string | null | undefined = undefined;

      // Upload new image if provided
      if (imageUri) {
        const fileName = `${activeHouseholdId}/${Date.now()}.jpg`;
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(uploadData.path);
          imageUrl = publicUrl;
        }
      }

      const updates: RecipeUpdate = {
        name: recipeData.name,
        category: recipeData.category,
        prep_time_minutes: recipeData.prep_time_minutes,
        cook_time_minutes: recipeData.cook_time_minutes,
        servings: recipeData.servings,
        estimated_cost: recipeData.estimated_cost,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        tags: recipeData.tags,
        ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
      };

      await updateRecipe(id, updates);
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/(app)/recipe/${id}`);
  };

  if (!ready || !initialData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.headerBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Recipe</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.headerBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Recipe</Text>
        <View style={styles.headerBtn} />
      </View>

      <RecipeForm
        onSubmit={handleSubmit}
        loading={loading}
        initialData={initialData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
