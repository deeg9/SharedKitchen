import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { Recipe, InstructionStep, Ingredient } from '../../types/database';
import { UnitSystem } from '../../lib/unit-conversion';
import { getDefaultRecipeImage } from '../../lib/images';
import { CookingProgress } from './CookingProgress';
import { StepCard } from './StepCard';
import { UnitToggle } from './UnitToggle';
import { IngredientSidebar } from './IngredientSidebar';

const UNIT_PREF_KEY = 'unit_preference';
const HERO_HEIGHT = Dimensions.get('window').height * 0.42;

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
  const imageUrl = recipe.image_url || getDefaultRecipeImage(recipe.id, recipe.category || '');

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
      {/* Top bar: close, unit toggle, ingredients */}
      <View style={s.topBar}>
        <Pressable
          onPress={onClose}
          style={s.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close cooking mode"
        >
          <MaterialCommunityIcons name="close" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
        <View style={s.topBarRight}>
          <UnitToggle value={unitSystem} onChange={handleUnitChange} />
          <Pressable
            onPress={() => setSidebarVisible(true)}
            style={s.ingredientPill}
            accessibilityRole="button"
            accessibilityLabel="Show ingredients"
          >
            <MaterialCommunityIcons name="food-variant" size={16} color={colors.onSurfaceVariant} />
            <Text style={s.ingredientPillText}>Ingredients</Text>
          </Pressable>
        </View>
      </View>

      {/* Main content: two-column layout — image left, steps right */}
      <View style={s.splitContainer}>
        {/* Left column: hero image */}
        <View style={s.imageColumn}>
          <Image
            source={{ uri: imageUrl }}
            style={s.heroImage}
            contentFit="cover"
            transition={200}
          />
        </View>

        {/* Right column: step content */}
        <ScrollView
          style={s.contentColumn}
          contentContainerStyle={s.contentColumnInner}
          showsVerticalScrollIndicator={false}
          key={`step-${currentStep}`}
        >
          {/* Step counter + recipe name */}
          <Text style={s.stepCounter}>
            Step {currentStep + 1} of {totalSteps}:
          </Text>
          <Text style={s.recipeName} numberOfLines={1}>
            {recipe.name.toUpperCase()}
          </Text>

          {/* Step card (instruction + badge + ingredients) */}
          <StepCard
            step={instructions[currentStep]}
            stepIndex={currentStep}
            totalSteps={totalSteps}
            unitSystem={unitSystem}
            ingredients={stepIngredients}
          />
        </ScrollView>
      </View>

      {/* Progress bar */}
      <CookingProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
      />

      {/* Bottom navigation — pill buttons */}
      <View style={[s.bottomNav, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          onPress={handlePrev}
          style={[s.navPill, s.navPillSecondary, currentStep === 0 && s.btnDisabled]}
          disabled={currentStep === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous step"
          testID="cooking-prev-step"
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.onSurface} />
          <Text style={s.navPillSecondaryText}>Previous</Text>
        </Pressable>

        {isLastStep ? (
          <Pressable
            onPress={onCookComplete ?? onClose}
            style={[s.navPill, s.navPillPrimary]}
            accessibilityRole="button"
            accessibilityLabel="Done cooking"
            testID="cooking-done-button"
          >
            <Text style={s.navPillPrimaryText}>Done Cooking</Text>
            <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            style={[s.navPill, s.navPillPrimary]}
            accessibilityRole="button"
            accessibilityLabel="Next step"
            testID="cooking-next-step"
          >
            <Text style={s.navPillPrimaryText}>Next Step</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onPrimary} />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  ingredientPillText: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.onSurfaceVariant,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  imageColumn: {
    width: '42%',
    padding: spacing.sm,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  contentColumn: {
    flex: 1,
  },
  contentColumnInner: {
    paddingRight: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  stepCounter: {
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.onSurfaceVariant,
  },
  recipeName: {
    fontSize: 11,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.primary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  navPillPrimary: {
    backgroundColor: colors.primary,
  },
  navPillPrimaryText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
  navPillSecondary: {
    backgroundColor: colors.surfaceContainerLow,
  },
  navPillSecondaryText: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  btnDisabled: {
    opacity: 0.3,
  },
});
