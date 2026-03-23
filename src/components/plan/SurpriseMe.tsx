import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { usePlanStore } from '../../stores/planStore';
import { useRecipeStore } from '../../stores/recipeStore';
import { Recipe } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface SurpriseMeProps {
  visible: boolean;
  onClose: () => void;
  householdId: string;
  dateString: string;
}

export function SurpriseMe({
  visible,
  onClose,
  householdId,
  dateString,
}: SurpriseMeProps) {
  const { getRandomSuggestion, assignRecipe } = usePlanStore();
  const { recipes } = useRecipeStore();
  const [mainSuggestion, setMainSuggestion] = useState<Recipe | null>(null);
  const [alternatives, setAlternatives] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const generateSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const suggestion = await getRandomSuggestion(householdId);
      setMainSuggestion(suggestion);

      // Pick 3 random alternatives (different from main)
      const others = recipes.filter((r) => r.id !== suggestion?.id);
      const shuffled = others.sort(() => Math.random() - 0.5);
      setAlternatives(shuffled.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }, [householdId, getRandomSuggestion, recipes]);

  useEffect(() => {
    if (visible) {
      generateSuggestions();
    }
  }, [visible, generateSuggestions]);

  const handleAddToPlan = async (recipe: Recipe) => {
    setAdding(true);
    try {
      await assignRecipe(householdId, dateString, recipe.id);
      onClose();
    } finally {
      setAdding(false);
    }
  };

  const handleSelectAlternative = (recipe: Recipe) => {
    setMainSuggestion(recipe);
    // Move previous main to alternatives
    setAlternatives((prev) => {
      const newAlts = prev.filter((r) => r.id !== recipe.id);
      if (mainSuggestion) {
        newAlts.push(mainSuggestion);
      }
      return newAlts.slice(0, 3);
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Surprise Me!</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.onSurface}
              />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Finding something tasty...</Text>
            </View>
          ) : mainSuggestion ? (
            <>
              {/* Main Suggestion Card */}
              <Card variant="elevated" style={styles.mainCard}>
                {mainSuggestion.image_url ? (
                  <Image
                    source={{ uri: mainSuggestion.image_url }}
                    style={styles.mainImage}
                  />
                ) : (
                  <View style={[styles.mainImage, styles.placeholderImage]}>
                    <MaterialCommunityIcons
                      name="food-variant"
                      size={40}
                      color={colors.outlineVariant}
                    />
                  </View>
                )}

                <Text style={styles.mainName}>{mainSuggestion.name}</Text>

                <View style={styles.metaRow}>
                  {mainSuggestion.prep_time_minutes != null && (
                    <View style={styles.metaPill}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color={colors.onSurfaceVariant}
                      />
                      <Text style={styles.metaText}>
                        {mainSuggestion.prep_time_minutes +
                          (mainSuggestion.cook_time_minutes ?? 0)}
                        m
                      </Text>
                    </View>
                  )}
                  {mainSuggestion.estimated_cost != null && (
                    <View style={styles.metaPill}>
                      <Text style={styles.metaText}>
                        ${mainSuggestion.estimated_cost.toFixed(0)}
                      </Text>
                    </View>
                  )}
                  {mainSuggestion.servings && (
                    <View style={styles.metaPill}>
                      <Text style={styles.metaText}>
                        {mainSuggestion.servings} servings
                      </Text>
                    </View>
                  )}
                </View>
              </Card>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <Button
                  variant="primary"
                  onPress={() => handleAddToPlan(mainSuggestion)}
                  loading={adding}
                  style={styles.addButton}
                >
                  Add to Plan
                </Button>
                <Pressable
                  onPress={generateSuggestions}
                  style={styles.shuffleButton}
                >
                  <MaterialCommunityIcons
                    name="shuffle-variant"
                    size={24}
                    color={colors.primary}
                  />
                </Pressable>
              </View>

              {/* Alternatives */}
              {alternatives.length > 0 && (
                <>
                  <Text style={styles.altTitle}>Or try these</Text>
                  <View style={styles.altRow}>
                    {alternatives.map((recipe) => (
                      <Pressable
                        key={recipe.id}
                        onPress={() => handleSelectAlternative(recipe)}
                        style={styles.altCard}
                      >
                        {recipe.image_url ? (
                          <Image
                            source={{ uri: recipe.image_url }}
                            style={styles.altImage}
                          />
                        ) : (
                          <View style={[styles.altImage, styles.placeholderImage]}>
                            <MaterialCommunityIcons
                              name="food-variant"
                              size={16}
                              color={colors.outlineVariant}
                            />
                          </View>
                        )}
                        <Text style={styles.altName} numberOfLines={2}>
                          {recipe.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <MaterialCommunityIcons
                name="food-off"
                size={48}
                color={colors.outlineVariant}
              />
              <Text style={styles.loadingText}>
                No recipes yet. Add some recipes first!
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  mainCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  placeholderImage: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainName: {
    ...typography.titleLg,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  metaText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addButton: {
    flex: 1,
  },
  shuffleButton: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.full,
  },
  altTitle: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  altRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  altCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  altImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  altName: {
    ...typography.labelMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
});
