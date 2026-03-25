import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface PresenceMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

/**
 * Subscribes to a Supabase Presence channel and returns the list of
 * other users currently present. The current user is filtered out.
 *
 * @param channelKey  Unique key for the presence channel (e.g. "grocery:list-1"), or null to skip.
 * @param currentUser The local user's presence payload, or null to skip.
 * @param debounceMs  How long to debounce sync events (default 300ms).
 * @returns Array of PresenceMember objects for other present users.
 */
export function usePresence(
  channelKey: string | null,
  currentUser: PresenceMember | null,
  debounceMs: number = 300,
): PresenceMember[] {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!channelKey || !currentUser) {
      setMembers([]);
      return;
    }

    const channel = supabase.channel(`presence:${channelKey}`, {
      config: { presence: { key: currentUser.user_id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          const state = channel.presenceState();
          const result: PresenceMember[] = [];

          for (const [key, presences] of Object.entries(state)) {
            if (key === currentUser.user_id) continue;
            const latest = (presences as any[])?.[0];
            if (latest) {
              result.push({
                user_id: latest.user_id,
                display_name: latest.display_name,
                avatar_url: latest.avatar_url ?? null,
              });
            }
          }

          setMembers(result);
        }, debounceMs);
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.track({
            user_id: currentUser.user_id,
            display_name: currentUser.display_name,
            avatar_url: currentUser.avatar_url,
          });
        }
      });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [channelKey, currentUser?.user_id]);

  return members;
}
