import { useCallback } from 'react';
import { useHouseholdStore } from '../stores/householdStore';

/**
 * Convenience hook wrapping the household Zustand store.
 * Provides ergonomic access to household state and actions for components.
 */
export function useHousehold() {
  const households = useHouseholdStore((s) => s.households);
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);
  const members = useHouseholdStore((s) => s.members);
  const loading = useHouseholdStore((s) => s.loading);
  const error = useHouseholdStore((s) => s.error);
  const activeHouseholdFn = useHouseholdStore((s) => s.activeHousehold);

  const setActiveHousehold = useHouseholdStore((s) => s.setActiveHousehold);
  const createHouseholdAction = useHouseholdStore((s) => s.createHousehold);
  const joinHouseholdAction = useHouseholdStore((s) => s.joinHousehold);
  const fetchHouseholds = useHouseholdStore((s) => s.fetchHouseholds);

  const activeHousehold = activeHouseholdFn();

  const switchHousehold = useCallback(
    async (id: string) => {
      await setActiveHousehold(id);
    },
    [setActiveHousehold]
  );

  const createHousehold = useCallback(
    async (name: string) => {
      return await createHouseholdAction(name);
    },
    [createHouseholdAction]
  );

  const joinHousehold = useCallback(
    async (inviteCode: string) => {
      return await joinHouseholdAction(inviteCode);
    },
    [joinHouseholdAction]
  );

  return {
    activeHousehold,
    activeHouseholdId,
    households,
    members,
    loading,
    error,
    switchHousehold,
    createHousehold,
    joinHousehold,
    fetchHouseholds,
  };
}
