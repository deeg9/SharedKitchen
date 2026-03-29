import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { usePantryStore } from '../stores/pantryStore';
import { PantryItem } from '../types/database';

type SubscriptionStatus = 'idle' | 'subscribing' | 'subscribed' | 'error';

/**
 * Manages Supabase Realtime subscription for pantry_items.
 * Handles INSERT, UPDATE, DELETE events and syncs to pantryStore.
 * Cleans up channel on unmount or when householdId changes.
 */
export function usePantrySync(
  householdId: string | null
): { status: SubscriptionStatus } {
  const [status, setStatus] = useState<SubscriptionStatus>('idle');

  useEffect(() => {
    if (!householdId) {
      setStatus('idle');
      return;
    }

    setStatus('subscribing');

    const channel = supabase
      .channel(`pantry-items-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pantry_items',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          usePantryStore.getState()._addItem(payload.new as PantryItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pantry_items',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          usePantryStore.getState()._updateItem(payload.new as PantryItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'pantry_items',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          usePantryStore.getState()._removeItem((payload.old as { id: string }).id);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('subscribed');
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  return { status };
}
