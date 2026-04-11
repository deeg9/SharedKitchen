import React, { useEffect, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface SavedFromAttributionProps {
  savedFromKitchenId: string;
}

export function SavedFromAttribution({ savedFromKitchenId }: SavedFromAttributionProps) {
  const router = useRouter();
  const [sourceHandle, setSourceHandle] = useState<string | null>(null);
  const [sourceDisplayName, setSourceDisplayName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!savedFromKitchenId) return;

    const fetchSourceKitchen = async () => {
      try {
        const { data } = await supabase
          .from('kitchen_profiles')
          .select('display_name, household_id')
          .eq('id', savedFromKitchenId)
          .single();

        if (!data) {
          setLoaded(true);
          return;
        }

        setSourceDisplayName(data.display_name ?? null);

        if (data.household_id) {
          const { data: memberData } = await supabase
            .from('household_members')
            .select('profiles(handle)')
            .eq('household_id', data.household_id)
            .eq('role', 'admin')
            .limit(1)
            .single();

          const profiles = memberData?.profiles as unknown as { handle?: string } | null;
          if (profiles?.handle) {
            setSourceHandle(profiles.handle);
          }
        }
      } catch {
        // Silently fail - component just won't render
      } finally {
        setLoaded(true);
      }
    };

    fetchSourceKitchen();
  }, [savedFromKitchenId]);

  // Don't render while loading or if lookup failed entirely
  if (!loaded || (!sourceHandle && !sourceDisplayName)) return null;

  const displayText = sourceHandle
    ? `@${sourceHandle}'s kitchen`
    : `${sourceDisplayName}'s kitchen`;

  return (
    <Pressable
      onPress={() => router.push(`/kitchen/${savedFromKitchenId}`)}
      accessibilityRole="button"
      accessibilityLabel={`Saved from ${displayText}, view kitchen`}
    >
      <View style={styles.container}>
        <MaterialCommunityIcons name="bookmark-check" size={16} color={colors.primary} />
        <Text style={styles.text}>
          Saved from{' '}
          <Text style={styles.handleText}>{displayText}</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  text: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  handleText: {
    color: colors.primary,
  },
});
