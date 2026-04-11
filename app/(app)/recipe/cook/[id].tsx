import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRecipeStore } from '../../../../src/stores/recipeStore';
import { CookingMode } from '../../../../src/components/cooking/CookingMode';
import { CookLogSheet } from '../../../../src/components/cook-log/CookLogSheet';
import { colors } from '../../../../src/theme/colors';

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { selectedRecipe: recipe, loading, fetchRecipeDetail } = useRecipeStore();
  const [showCookLogSheet, setShowCookLogSheet] = useState(false);

  useEffect(() => {
    if (id) fetchRecipeDetail(id);
  }, [id]);

  const handleCookComplete = useCallback(() => {
    setShowCookLogSheet(true);
  }, []);

  const handleCookLogClose = useCallback(() => {
    setShowCookLogSheet(false);
    // Allow sheet dismiss animation to complete before navigation
    setTimeout(() => {
      router.back();
    }, 300);
  }, [router]);

  if (loading || !recipe) {
    return (
      <View style={s.loading}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden />
      <CookingMode
        recipe={recipe}
        onClose={() => router.back()}
        onCookComplete={handleCookComplete}
      />
      <CookLogSheet
        isOpen={showCookLogSheet}
        onClose={handleCookLogClose}
        recipeId={id}
        recipeName={recipe.name}
        recipeImageUrl={recipe.image_url}
        contextMessage="You just finished cooking! Add a photo and note."
      />
    </>
  );
}

const s = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
