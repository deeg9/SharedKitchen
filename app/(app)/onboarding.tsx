import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { useOnboardingStore, OnboardingStep } from '../../src/stores/onboardingStore';
import { OnboardingProgress } from '../../src/components/onboarding/OnboardingProgress';
import { WelcomeStep } from '../../src/components/onboarding/WelcomeStep';
import { HandleSetupStep } from '../../src/components/onboarding/HandleSetupStep';
import { CreateHouseholdStep } from '../../src/components/onboarding/CreateHouseholdStep';
import { InviteMembersStep } from '../../src/components/onboarding/InviteMembersStep';
import { AddRecipesStep } from '../../src/components/onboarding/AddRecipesStep';
import { PlanWeekStep } from '../../src/components/onboarding/PlanWeekStep';
import { AllSetStep } from '../../src/components/onboarding/AllSetStep';

const STEP_COMPONENTS: Record<OnboardingStep, React.ComponentType> = {
  0: WelcomeStep,
  1: HandleSetupStep,
  2: CreateHouseholdStep,
  3: InviteMembersStep,
  4: AddRecipesStep,
  5: PlanWeekStep,
  6: AllSetStep,
};

const TOTAL_STEPS = 7;

/** Steps where progress indicator is hidden (welcome and all-set) */
const HIDE_PROGRESS_STEPS: OnboardingStep[] = [0, 6];

export default function OnboardingScreen() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const StepComponent = STEP_COMPONENTS[currentStep];
  const showProgress = !HIDE_PROGRESS_STEPS.includes(currentStep);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {showProgress && (
        <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      )}
      <View style={styles.stepContainer}>
        <StepComponent />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  stepContainer: {
    flex: 1,
  },
});
