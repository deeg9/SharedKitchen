import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { Recipe, InstructionStep, Ingredient } from '../../types/database';
import { UnitSystem } from '../../lib/unit-conversion';
import { CookingProgress } from './CookingProgress';
import { StepCard } from './StepCard';
import { UnitToggle } from './UnitToggle';
import { IngredientSidebar } from './IngredientSidebar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const UNIT_PREF_KEY = 'unit_preference';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

export function CookingMode({ recipe, onClose }: CookingModeProps) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [scale] = useState(1);
  const flatListRef = useRef<FlatList>(null);

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

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentStep(viewableItems[0].index);
        Haptics.selectionAsync();
      }
    }
  ).current;

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
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
      onClose();
    }
  }, [currentStep, totalSteps, goToStep, onClose]);

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
          <MaterialCommunityIcons name="close" size={24} color="rgba(242,240,237,0.6)" />
        </Pressable>
        <UnitToggle value={unitSystem} onChange={handleUnitChange} />
      </View>

      {/* Progress */}
      <CookingProgress currentStep={currentStep} totalSteps={totalSteps} />

      {/* Step content */}
      <FlatList
        ref={flatListRef}
        data={instructions}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, i) => `step-${i}`}
        renderItem={({ item, index }) => (
          <StepCard
            step={item}
            stepIndex={index}
            totalSteps={totalSteps}
            unitSystem={unitSystem}
            width={SCREEN_WIDTH}
          />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        style={s.flatList}
      />

      {/* Bottom navigation */}
      <View style={[s.bottomNav, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={() => setSidebarVisible(true)}
          style={s.ingredientPill}
          accessibilityRole="button"
          accessibilityLabel="Show ingredients"
        >
          <MaterialCommunityIcons name="food-variant" size={18} color={colors.inverseOnSurface} />
          <Text style={s.ingredientPillText}>Ingredients</Text>
        </Pressable>

        <View style={s.navArrows}>
          <Pressable
            onPress={handlePrev}
            style={[s.navBtn, currentStep === 0 && s.navBtnDisabled]}
            disabled={currentStep === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={32}
              color={colors.inverseOnSurface}
            />
          </Pressable>

          {isLastStep ? (
            <Pressable
              onPress={onClose}
              style={s.doneBtn}
              accessibilityRole="button"
              accessibilityLabel="Done cooking"
            >
              <Text style={s.doneBtnText}>Done Cooking</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleNext}
              style={s.navBtn}
              accessibilityRole="button"
              accessibilityLabel="Next step"
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={32}
                color={colors.inverseOnSurface}
              />
            </Pressable>
          )}
        </View>
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
    backgroundColor: colors.inverseSurface,
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
  flatList: {
    flex: 1,
  },
  bottomNav: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  ingredientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  ingredientPillText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.inverseOnSurface,
  },
  navArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navBtn: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  navBtnDisabled: {
    opacity: 0.2,
  },
  doneBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.inversePrimary,
  },
  doneBtnText: {
    fontFamily: fontFamily.headlineBold,
    fontWeight: '700',
    fontSize: 14,
    color: colors.inverseSurface,
  },
});
