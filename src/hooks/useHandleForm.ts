import { useState, useRef, useEffect, useCallback } from 'react';
import { validateHandle, suggestHandle, suggestAlternatives } from '../lib/handle-utils';
import { supabase } from '../lib/supabase';
import type { HandleInputStatus } from '../components/handle/HandleInput';

const DEFAULT_MESSAGE = '3-20 characters, letters, numbers, and underscores';

export function useHandleForm(displayName: string | undefined) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<HandleInputStatus>({ state: 'idle', message: DEFAULT_MESSAGE });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate suggestions on mount
  useEffect(() => {
    if (displayName) {
      const base = suggestHandle(displayName);
      const alts = suggestAlternatives(base);
      setSuggestions([base, ...alts].slice(0, 3));
    }
  }, [displayName]);

  const checkAvailability = useCallback(async (handle: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', handle)
        .maybeSingle();

      if (error) {
        setStatus({ state: 'error', message: "Couldn't check availability. Tap to retry." });
        return;
      }

      if (data) {
        setStatus({ state: 'taken', message: 'This handle is taken' });
      } else {
        setStatus({ state: 'available', message: 'This handle is available' });
      }
    } catch {
      setStatus({ state: 'error', message: "Couldn't check availability. Tap to retry." });
    }
  }, []);

  const onChangeText = useCallback((text: string) => {
    setValue(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!text) {
      setStatus({ state: 'idle', message: DEFAULT_MESSAGE });
      return;
    }

    const validation = validateHandle(text);
    if (!validation.valid) {
      setStatus({ state: 'error', message: validation.error! });
      return;
    }

    setStatus({ state: 'checking', message: 'Checking availability...' });
    debounceRef.current = setTimeout(() => {
      checkAvailability(text);
    }, 400);
  }, [checkAvailability]);

  const onSelectSuggestion = useCallback((handle: string) => {
    setValue(handle);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const validation = validateHandle(handle);
    if (!validation.valid) {
      setStatus({ state: 'error', message: validation.error! });
      return;
    }

    setStatus({ state: 'checking', message: 'Checking availability...' });
    debounceRef.current = setTimeout(() => {
      checkAvailability(handle);
    }, 400);
  }, [checkAvailability]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const canSubmit = status.state === 'available' && !submitting;

  return {
    value,
    status,
    suggestions,
    submitting,
    setSubmitting,
    setStatus,
    onChangeText,
    onSelectSuggestion,
    canSubmit,
  };
}
