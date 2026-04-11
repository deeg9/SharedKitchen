import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Recipe, InstructionStep, Ingredient } from '../../types/database';
import { UnitSystem } from '../../lib/unit-conversion';
import { CookingProgress } from './CookingProgress';
import { StepCard } from './StepCard';
import { UnitToggle } from './UnitToggle';
import { IngredientSidebar } from './IngredientSidebar';

const UNIT_PREF_KEY = 'unit_preference';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
  onCookComplete?: () => void;
}

export function CookingMode({ recipe, onClose, onCookComplete }: CookingModeProps) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [scale] = useState(1);

  const instructions = recipe.instructions as InstructionStep[];
  const ingredients = recipe.ingredients as Ingredient[];
  const totalSteps = instructions.length;

  // Load saved unit preference
  useEffect(() => {
    AsyncStorage.getItem(UNIT_PREF_KEY).then((val) => {
      if (val === 'metric' || val === 'imperial') {
        setUnitSystem(val);
      }
    });
  }, []);

  // Persist unit preference
  const handleUnitChange = useCallback((system: UnitSystem) => {
    setUnitSystem(system);
    AsyncStorage.setItem(UNIT_PREF_KEY, system);
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      setCurrentStep(index);
      Haptics.selectionAsync();
    }
  }, [totalSteps]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    } else {
      // Last step -> Done Cooking
      if (onCookComplete) {
        onCookComplete();
      } else {
        onClose();
      }
    }
  }, [currentStep, totalSteps, goToStep, onClose, onCookComplete]);

  // Ingredient matching: scan instruction text for ingredient names
  const getStepIngredients = useCallback((stepIndex: number): Ingredient[] => {
    if (!ingredients || ingredients.length === 0) return [];
    const text = instructions[stepIndex]?.text?.toLowerCase() || '';
    return ingredients.filter((ing) => {
      const name = ing.name?.toLowerCase() || '';
      // Match if the ingredient name (or a significant word in it) appears in the instruction
      if (name.length < 3) return false;
      return text.includes(name);
    });
  }, [ingredients, instructions]);

  const stepIngredients = useMemo(
    () => getStepIngredients(currentStep),
    [currentStep, getStepIngredients]
  );

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={onClose}
          style={s.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close cooking mode"
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
        <UnitToggle value={unitSystem} onChange={handleUnitChange} />
      </View>

      {/* Progress */}
      <CookingProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        recipeName={recipe.name}
      />

      {/* Step content */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        key={`step-${currentStep}`}
      >
        <StepCard
          step={instructions[currentStep]}
          stepIndex={currentStep}
          totalSteps={totalSteps}
          unitSystem={unitSystem}
          recipeImageUrl={recipe.image_url}
          recipeCategory={recipe.category}
          recipeId={recipe.id}
          ingredients={stepIngredients}
        />
      </ScrollView>

      {/* Bottom navigation */}
      <View style={[s.bottomNav, { paddingBottom: insets.bottom + spacing.md }]}>
        {/* Previous button */}
        <Pressable
          onPress={handlePrev}
          style={[s.prevBtn, currentStep === 0 && s.btnDisabled]}
          disabled={currentStep === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous step"
          testID="cooking-prev-step"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={colors.onSurfaceVariant}
          />
          <Text style={s.prevBtnText}>Previous</Text>
        </Pressable>

        {/* Ingredients pill */}
        <Pressable
          onPress={() => setSidebarVisible(true)}
          style={s.ingredientPill}
          accessibilityRole="button"
          accessibilityLabel="Show ingredients"
        >
          <MaterialCommunityIcons name="food-variant" size={18} color={colors.onSurfaceVariant} />
          <Text style={s.ingredientPillText}>Ingredients</Text>
        </Pressable>

        {/* Next / Done button */}
        {isLastStep ? (
          <Pressable
            onPress={onCookComplete ?? onClose}
            style={s.nextBtn}
            accessibilityRole="button"
            accessibilityLabel="Done cooking"
            testID="cooking-done-button"
          >
            <Text style={s.nextBtnText}>Done Cooking</Text>
            <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            style={s.nextBtn}
            accessibilityRole="button"
            accessibilityLabel="Next step"
            testID="cooking-next-step"
          >
            <Text style={s.nextBtnText}>Next Step</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
          </Pressable>
        )}
      </View>

      {/* Ingredient sidebar */}
      <IngredientSidebar
        ingredients={ingredients}
        scale={scale}
        unitSystem={unitSystem}
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  prevBtnText: {
    ...typography.titleMd,
    color: colors.onSurfaceVariant,
  },
  btnDisabled: {
    opacity: 0.3,
  },
  ingredientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  ingredientPillText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  nextBtnText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
