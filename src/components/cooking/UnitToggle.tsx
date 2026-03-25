import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { UnitSystem } from '../../lib/unit-conversion';

interface UnitToggleProps {
  value: UnitSystem;
  onChange: (system: UnitSystem) => void;
}

export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <View style={s.container} accessibilityRole="radiogroup">
      {(['metric', 'imperial'] as const).map((system) => {
        const active = value === system;
        return (
          <Pressable
            key={system}
            onPress={() => onChange(system)}
            style={[s.segment, active && s.segmentActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <Text style={[s.label, active && s.labelActive]}>
              {system.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.sm,
    padding: 2,
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.inversePrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.outlineVariant,
  },
  labelActive: {
    color: colors.inverseSurface,
  },
});
