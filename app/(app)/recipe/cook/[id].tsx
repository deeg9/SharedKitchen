import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRecipeStore } from '../../../../src/stores/recipeStore';
import { CookingMode } from '../../../../src/components/cooking/CookingMode';
import { colors } from '../../../../src/theme/colors';

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { selectedRecipe: recipe, loading, fetchRecipeDetail } = useRecipeStore();

  useEffect(() => {
    if (id) fetchRecipeDetail(id);
  }, [id]);

  if (loading || !recipe) {
    return (
      <View style={s.loading}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={colors.inversePrimary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden />
      <CookingMode recipe={recipe} onClose={() => router.back()} />
    </>
  );
}

const s = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.inverseSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
