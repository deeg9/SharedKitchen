import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { DishIdentification, RecipeSearchResult } from '../../types/recipeSearch';
import { searchRecipes } from '../../lib/recipeSearch';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface DishIdentifiedSheetProps {
  isOpen: boolean;
  dish: DishIdentification | null;
  onClose: () => void;
  onSearchResults: (results: RecipeSearchResult[]) => void;
}

function getConfidenceLevel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.8) return { label: 'High confidence', color: colors.primary };
  if (confidence >= 0.5) return { label: 'Medium confidence', color: '#F59E0B' };
  return { label: 'Low confidence', color: colors.error };
}

export function DishIdentifiedSheet({ isOpen, dish, onClose, onSearchResults }: DishIdentifiedSheetProps) {
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dish changes
  useEffect(() => {
    if (dish) {
      setEditedName(dish.name);
      setError(null);
      setLoading(false);
    }
  }, [dish]);

  const handleSearch = useCallback(async () => {
    if (!editedName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchRecipes(editedName.trim());
      if (results.length === 0) {
        setError('No recipes found');
        setLoading(false);
      } else {
        setLoading(false);
        onSearchResults(results);
      }
    } catch {
      setError('No recipes found');
      setLoading(false);
    }
  }, [editedName, onSearchResults]);

  // Auto-trigger search for high confidence
  useEffect(() => {
    if (isOpen && dish && dish.confidence >= 0.8) {
      handleSearch();
    }
  }, [isOpen, dish]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!dish) return null;

  const { label: confidenceLabel, color: confidenceColor } = getConfidenceLevel(dish.confidence);
  const isHighConfidence = dish.confidence >= 0.8;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['45%']}>
      <View style={styles.container}>
        <Text style={styles.title}>Dish Identified</Text>

        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
          <Text style={styles.confidenceText}>{confidenceLabel}</Text>
        </View>

        {!isHighConfidence && (
          <Text style={styles.subtitle}>Is this right?</Text>
        )}

        <TextInput
          style={styles.nameInput}
          value={editedName}
          onChangeText={setEditedName}
          placeholder="Dish name"
          placeholderTextColor={colors.outlineVariant}
          editable={!loading}
        />

        {dish.description && (
          <Text style={styles.description}>{dish.description}</Text>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Searching for recipes...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.hintText}>Try a different name</Text>
            <Pressable style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search Recipes</Text>
            </Pressable>
          </View>
        ) : !isHighConfidence ? (
          <Pressable style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search Recipes</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={onClose} style={styles.notFoodLink}>
          <Text style={styles.notFoodText}>Not a food photo?</Text>
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  confidenceText: {
    ...typography.labelMd,
    color: '#ffffff',
  },
  nameInput: {
    ...typography.bodyLg,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  hintText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  searchButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  notFoodLink: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  notFoodText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textDecorationLine: 'underline',
  },
});
