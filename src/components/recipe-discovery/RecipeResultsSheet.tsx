import React, { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { RecipeSearchResult } from '../../types/recipeSearch';
import { parseRecipeUrl } from '../../lib/ai';
import { useRecipeStore } from '../../stores/recipeStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface RecipeResultsSheetProps {
  isOpen: boolean;
  results: RecipeSearchResult[];
  dishName: string;
  onClose: () => void;
  onImportComplete: () => void;
}

export function RecipeResultsSheet({ isOpen, results, dishName, onClose, onImportComplete }: RecipeResultsSheetProps) {
  const [importingIndex, setImportingIndex] = useState<number | null>(null);
  const createRecipe = useRecipeStore((s) => s.createRecipe);
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);
  const user = useAuthStore((s) => s.user);

  const handleImport = async (result: RecipeSearchResult, index: number) => {
    if (!activeHouseholdId || !user?.id) return;
    setImportingIndex(index);
    try {
      const parsed = await parseRecipeUrl(result.url);
      await createRecipe({
        ...parsed,
        household_id: activeHouseholdId,
        created_by: user.id,
      });
      setImportingIndex(null);
      Alert.alert('Recipe Imported', 'Added to your recipe book');
      onImportComplete();
    } catch (err: unknown) {
      setImportingIndex(null);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Import Failed', message, [
        { text: 'Retry', onPress: () => handleImport(result, index) },
        { text: 'Dismiss', style: 'cancel' },
      ]);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['60%']}>
      <View style={styles.container}>
        <Text style={styles.title}>Recipes for "{dishName}"</Text>

        {results.map((result, index) => (
          <Pressable
            key={result.url}
            style={styles.card}
            onPress={() => handleImport(result, index)}
            disabled={importingIndex !== null}
          >
            {importingIndex === index && (
              <View style={styles.importingOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            <View style={styles.cardContent}>
              {result.thumbnail ? (
                <Image source={{ uri: result.thumbnail }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.placeholderIcon]}>
                  <MaterialCommunityIcons name="food" size={24} color={colors.onSurfaceVariant} />
                </View>
              )}
              <View style={styles.cardText}>
                <Text style={styles.recipeTitle} numberOfLines={2}>{result.title}</Text>
                <Text style={styles.sourceText}>{result.source}</Text>
                {result.cookTime && (
                  <Text style={styles.cookTimeText}>{result.cookTime}</Text>
                )}
              </View>
            </View>
          </Pressable>
        ))}

        <Pressable onPress={onClose} style={styles.searchAgainLink}>
          <Text style={styles.searchAgainText}>Search again</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  title: {
    ...typography.titleLg,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  importingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderRadius: borderRadius.lg,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  placeholderIcon: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  recipeTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  sourceText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  cookTimeText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  searchAgainLink: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  searchAgainText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textDecorationLine: 'underline',
  },
});
