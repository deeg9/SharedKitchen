import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingStore.setState({
    currentStep: 0,
    completed: false,
    initialized: false,
    householdId: null,
    addedRecipeIds: [],
  });
});

describe('onboardingStore', () => {
  describe('initial state', () => {
    it('should have correct defaults', () => {
      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(0);
      expect(state.completed).toBe(false);
      expect(state.initialized).toBe(false);
      expect(state.householdId).toBeNull();
      expect(state.addedRecipeIds).toEqual([]);
    });
  });

  describe('nextStep', () => {
    it('should increment currentStep from 0 to 1 to 2', () => {
      useOnboardingStore.getState().nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(1);

      useOnboardingStore.getState().nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);
    });

    it('should not exceed step 6', () => {
      useOnboardingStore.setState({ currentStep: 6 });
      useOnboardingStore.getState().nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(6);
    });
  });

  describe('prevStep', () => {
    it('should decrement currentStep', () => {
      useOnboardingStore.setState({ currentStep: 3 });
      useOnboardingStore.getState().prevStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);
    });

    it('should not go below step 0', () => {
      useOnboardingStore.setState({ currentStep: 0 });
      useOnboardingStore.getState().prevStep();
      expect(useOnboardingStore.getState().currentStep).toBe(0);
    });
  });

  describe('completeOnboarding', () => {
    it('should set completed to true and persist to AsyncStorage', async () => {
      await useOnboardingStore.getState().completeOnboarding();

      expect(useOnboardingStore.getState().completed).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mise_onboarding_completed',
        'true'
      );
    });
  });

  describe('checkOnboardingStatus', () => {
    it('should set completed true and initialized true when AsyncStorage returns "true"', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

      await useOnboardingStore.getState().checkOnboardingStatus();

      const state = useOnboardingStore.getState();
      expect(state.completed).toBe(true);
      expect(state.initialized).toBe(true);
    });

    it('should set completed false and initialized true when AsyncStorage returns null', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await useOnboardingStore.getState().checkOnboardingStatus();

      const state = useOnboardingStore.getState();
      expect(state.completed).toBe(false);
      expect(state.initialized).toBe(true);
    });
  });

  describe('setHouseholdId', () => {
    it('should set householdId', () => {
      useOnboardingStore.getState().setHouseholdId('h1');
      expect(useOnboardingStore.getState().householdId).toBe('h1');
    });
  });

  describe('addRecipeId', () => {
    it('should append recipe IDs', () => {
      useOnboardingStore.getState().addRecipeId('r1');
      useOnboardingStore.getState().addRecipeId('r2');
      expect(useOnboardingStore.getState().addedRecipeIds).toEqual(['r1', 'r2']);
    });
  });

  describe('reset', () => {
    it('should restore all fields to initial values', () => {
      // Set non-default state
      useOnboardingStore.setState({
        currentStep: 4,
        completed: true,
        initialized: true,
        householdId: 'h1',
        addedRecipeIds: ['r1', 'r2'],
      });

      useOnboardingStore.getState().reset();

      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(0);
      expect(state.completed).toBe(false);
      expect(state.initialized).toBe(false);
      expect(state.householdId).toBeNull();
      expect(state.addedRecipeIds).toEqual([]);
    });
  });
});
