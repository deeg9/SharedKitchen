import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ActivityEvent {
  id: string;
  avatar_url: string | null;
  display_name: string;
  message: string;
}

interface UseActivityToastConfig {
  groceryListId: string | null;
  householdId: string | null;
  currentUserId: string | null;
  memberLookup: (
    userId: string
  ) => { display_name: string; avatar_url: string | null } | null;
}

/**
 * Subscribes to postgres_changes on grocery_items and meal_plans tables.
 * Filters out the current user's own actions and manages a toast queue
 * that displays one activity notification at a time.
 */
export function useActivityToast(config: UseActivityToastConfig): {
  currentToast: ActivityEvent | null;
  dismissToast: () => void;
} {
  const { groceryListId, householdId, currentUserId, memberLookup } = config;
  const [currentToast, setCurrentToast] = useState<ActivityEvent | null>(null);
  const queueRef = useRef<ActivityEvent[]>([]);

  const processQueue = useCallback(() => {
    if (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      setCurrentToast(next);
    }
  }, []);

  const enqueue = useCallback(
    (event: ActivityEvent) => {
      queueRef.current.push(event);
      // If no toast is showing, process immediately
      setCurrentToast((current) => {
        if (current === null && queueRef.current.length > 0) {
          return queueRef.current.shift()!;
        }
        return current;
      });
    },
    []
  );

  const dismissToast = useCallback(() => {
    setCurrentToast(null);
    // Process next item in queue after a brief delay
    setTimeout(() => processQueue(), 100);
  }, [processQueue]);

  useEffect(() => {
    if (!groceryListId || !currentUserId) return;

    const channel = supabase
      .channel(`activity:grocery:${groceryListId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'grocery_items',
          filter: `grocery_list_id=eq.${groceryListId}`,
        },
        (payload: any) => {
          const newRow = payload.new;
          const oldRow = payload.old;

          // Only react to check-off/uncheck events
          if (newRow.is_checked === oldRow.is_checked) return;

          // Self-filter
          if (newRow.checked_by === currentUserId) return;

          const member = memberLookup(newRow.checked_by);
          if (!member) return;

          const action = newRow.is_checked ? 'checked off' : 'unchecked';
          enqueue({
            id: `grocery-${newRow.id}-${Date.now()}`,
            avatar_url: member.avatar_url,
            display_name: member.display_name,
            message: `${action} ${newRow.name}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groceryListId, currentUserId]);

  useEffect(() => {
    if (!householdId || !currentUserId) return;

    const channel = supabase
      .channel(`activity:mealplan:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meal_plans',
          filter: `household_id=eq.${householdId}`,
        },
        (payload: any) => {
          if (payload.new?.created_by === currentUserId) return;
          const member = memberLookup(payload.new?.created_by);
          if (!member) return;
          enqueue({
            id: `meal-insert-${payload.new.id}-${Date.now()}`,
            avatar_url: member.avatar_url,
            display_name: member.display_name,
            message: 'added a meal',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meal_plans',
          filter: `household_id=eq.${householdId}`,
        },
        (payload: any) => {
          if (payload.new?.created_by === currentUserId) return;
          const member = memberLookup(payload.new?.created_by);
          if (!member) return;
          enqueue({
            id: `meal-update-${payload.new.id}-${Date.now()}`,
            avatar_url: member.avatar_url,
            display_name: member.display_name,
            message: 'updated a meal',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'meal_plans',
          filter: `household_id=eq.${householdId}`,
        },
        (payload: any) => {
          if (payload.old?.created_by === currentUserId) return;
          const member = memberLookup(payload.old?.created_by);
          if (!member) return;
          enqueue({
            id: `meal-delete-${payload.old.id}-${Date.now()}`,
            avatar_url: member.avatar_url,
            display_name: member.display_name,
            message: 'removed a meal',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, currentUserId]);

  return { currentToast, dismissToast };
}
