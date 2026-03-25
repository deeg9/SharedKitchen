import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { Skeleton } from '../ui/Skeleton';
import { MealSuggestionCard } from './MealSuggestionCard';
import { generateMealSuggestions, MealSuggestion } from '../../lib/ai';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface MealGeneratorSheetProps {
  visible: boolean;
  onClose: () => void;
  householdId: string;
  onAddToPlan: (suggestion: MealSuggestion) => void;
}

type SheetState = 'empty' | 'loading' | 'results' | 'error';

// Trigger MealGeneratorSheet from a FAB or button on the Recipes tab.
// Example: <MealGeneratorSheet visible={showGenerator} onClose={() => setShowGenerator(false)} householdId={id} onAddToPlan={handleAdd} />

export function MealGeneratorSheet({
  visible,
  onClose,
  householdId,
  onAddToPlan,
}: MealGeneratorSheetProps) {
  const [state, setState] = useState<SheetState>('empty');
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [contextInfo, setContextInfo] = useState<{
    dietaryCount: number;
    leftoverCount: number;
    remainingBudget: number | null;
  }>({ dietaryCount: 0, leftoverCount: 0, remainingBudget: null });

  const fetchSuggestions = useCallback(async () => {
    setState('loading');
    setErrorMessage('');

    try {
      // Read dietary preferences from AsyncStorage
      const prefsJson = await AsyncStorage.getItem('dietary_preferences');
      const dietaryPreferences: string[] = prefsJson ? JSON.parse(prefsJson) : [];

      // Populate context pills with real data
      const [leftoverRes, budgetRes] = await Promise.all([
        supabase.from('leftovers').select('id', { count: 'exact', head: true }).eq('household_id', householdId),
        supabase.from('budget_settings').select('monthly_target').eq('household_id', householdId).maybeSingle(),
      ]);
      const leftoverCount = leftoverRes.count ?? 0;
      const budgetTarget = budgetRes.data?.monthly_target ?? null;

      setContextInfo({
        dietaryCount: dietaryPreferences.length,
        leftoverCount,
        remainingBudget: budgetTarget,
      });

      const results = await generateMealSuggestions(householdId, dietaryPreferences);
      setSuggestions(results);
      setState('results');
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Couldn't generate suggestions right now. Check your connection and try again."
      );
      setState('error');
    }
  }, [householdId]);

  // Fetch suggestions when sheet opens
  useEffect(() => {
    if (visible && state === 'empty') {
      fetchSuggestions();
    }
  }, [visible, state, fetchSuggestions]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!visible) {
      // Small delay so the sheet closes before resetting
      const timer = setTimeout(() => {
        setState('empty');
        setSuggestions([]);
        setErrorMessage('');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleRetry = () => {
    fetchSuggestions();
  };

  const handleTryNew = () => {
    setSuggestions([]);
    fetchSuggestions();
  };

  return (
    <BottomSheet isOpen={visible} onClose={onClose} snapPoints={['85%']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What should we cook?</Text>

        {/* Context pills */}
        {(state === 'loading' || state === 'results') && (
          <View style={styles.contextPills}>
            {contextInfo.dietaryCount > 0 && (
              <View style={styles.pill}>
                <MaterialCommunityIcons name="leaf" size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.pillText}>{contextInfo.dietaryCount} dietary prefs</Text>
              </View>
            )}
            {contextInfo.leftoverCount > 0 && (
              <View style={styles.pill}>
                <MaterialCommunityIcons name="food-variant" size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.pillText}>{contextInfo.leftoverCount} leftovers to use</Text>
              </View>
            )}
            {contextInfo.remainingBudget !== null && (
              <View style={styles.pill}>
                <MaterialCommunityIcons name="wallet-outline" size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.pillText}>${contextInfo.remainingBudget} remaining budget</Text>
              </View>
            )}
          </View>
        )}

        {/* Loading state */}
        {state === 'loading' && (
          <View style={styles.skeletonContainer}>
            <Text style={styles.loadingText}>Finding the perfect dinner...</Text>
            <Skeleton.Card style={styles.skeletonCard} />
            <Skeleton.Card style={styles.skeletonCard} />
            <Skeleton.Card style={styles.skeletonCard} />
          </View>
        )}

        {/* Results state */}
        {state === 'results' && (
          <View style={styles.resultsContainer}>
            {suggestions.map((suggestion, index) => (
              <Animated.View
                key={`${suggestion.name}-${index}`}
                entering={FadeInDown.delay(index * 100).duration(300)}
              >
                <MealSuggestionCard
                  suggestion={suggestion}
                  onAdd={onAddToPlan}
                />
              </Animated.View>
            ))}

            <Pressable
              style={({ pressed }) => [styles.tryNewButton, pressed && styles.tryNewButtonPressed]}
              onPress={handleTryNew}
            >
              <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
              <Text style={styles.tryNewText}>Try New Suggestions</Text>
            </Pressable>
          </View>
        )}

        {/* Error state */}
        {state === 'error' && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>
              {errorMessage || "Couldn't generate suggestions right now. Check your connection and try again."}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Empty state (shouldn't normally be visible since we auto-fetch, but included for completeness) */}
        {state === 'empty' && !visible && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyHeading}>What should we cook?</Text>
            <Text style={styles.emptyBody}>
              Get personalized dinner ideas based on your preferences, leftovers, and budget. Tap below to generate suggestions.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
              onPress={fetchSuggestions}
            >
              <Text style={styles.ctaButtonText}>Get Suggestions</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },

  // Context pills
  contextPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
  },
  pillText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },

  // Loading
  skeletonContainer: {
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  skeletonCard: {
    marginBottom: 0,
  },

  // Results
  resultsContainer: {
    gap: spacing.md,
  },
  tryNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  tryNewButtonPressed: {
    opacity: 0.6,
  },
  tryNewText: {
    ...typography.labelLg,
    color: colors.primary,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyHeading: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  emptyBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  ctaButtonPressed: {
    opacity: 0.8,
  },
  ctaButtonText: {
    ...typography.labelLg,
    color: colors.onSecondaryContainer,
  },
});
