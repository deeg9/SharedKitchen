import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGroceryStore } from '../stores/groceryStore';
import { GroceryItem } from '../types/database';

type SubscriptionStatus = 'idle' | 'subscribing' | 'subscribed' | 'error';

/**
 * Manages Supabase Realtime subscription for grocery_items.
 * Handles INSERT, UPDATE, DELETE events and syncs to groceryStore.
 * Cleans up channel on unmount or when householdId/listId changes.
 */
export function useGrocerySync(
  householdId: string | null,
  listId: string | null
): { status: SubscriptionStatus } {
  const [status, setStatus] = useState<SubscriptionStatus>('idle');

  useEffect(() => {
    if (!householdId || !listId) {
      setStatus('idle');
      return;
    }

    setStatus('subscribing');

    const channel = supabase
      .channel(`grocery-items-${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grocery_items',
          filter: `grocery_list_id=eq.${listId}`,
        },
        (payload) => {
          useGroceryStore.getState()._addItem(payload.new as GroceryItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'grocery_items',
          filter: `grocery_list_id=eq.${listId}`,
        },
        (payload) => {
          useGroceryStore.getState()._updateItem(payload.new as GroceryItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'grocery_items',
          filter: `grocery_list_id=eq.${listId}`,
        },
        (payload) => {
          useGroceryStore.getState()._removeItem((payload.old as any).id);
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
  }, [householdId, listId]);

  return { status };
}
