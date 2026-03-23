import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { Input } from '../ui/Input';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useHouseholdStore } from '../../stores/householdStore';

export function CreateHouseholdStep() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const setHouseholdId = useOnboardingStore((s) => s.setHouseholdId);
  const createHousehold = useHouseholdStore((s) => s.createHousehold);

  const isValid = name.trim().length >= 2;

  const handleNext = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const household = await createHousehold(name.trim());
      if (household) {
        setHouseholdId(household.id);
        nextStep();
      } else {
        setError('Failed to create household. Please try again.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <View style={styles.illustrationBg}>
          <MaterialCommunityIcons name="pot-steam" size={48} color={colors.onPrimary} />
          <MaterialCommunityIcons name="silverware-variant" size={32} color={colors.onPrimaryContainer} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.headline}>
          Name your <Text style={styles.italic}>Kitchen</Text>
        </Text>
        <Text style={styles.body}>
          Whether it's just you or a bustling family of foodies, give your household a name to get started.
        </Text>

        <Input
          label="HOUSEHOLD NAME"
          placeholder="e.g., Diego & Mel's Kitchen"
          value={name}
          onChangeText={setName}
          error={error ?? undefined}
          autoFocus
        />

        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            You can invite your roommates or family members to join this kitchen in the next step.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            !isValid && styles.disabled,
            pressed && isValid && styles.pressed,
          ]}
          onPress={handleNext}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.nextText}>Next</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  illustration: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  illustrationBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.float,
  },
  content: {
    flex: 1,
  },
  headline: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  italic: {
    fontStyle: 'italic',
  },
  body: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primaryFixed,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodyMd,
    color: colors.primary,
    flex: 1,
  },
  footer: {
    paddingTop: spacing.md,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.editorial,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  nextText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
