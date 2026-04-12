import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { UnitSystem } from '../../lib/unit-conversion';

interface UnitToggleProps {
  value: UnitSystem;
  onChange: (system: UnitSystem) => void;
}

export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <View style={s.container} accessibilityRole="radiogroup">
      <Pressable
        onPress={() => onChange('metric')}
        accessibilityRole="radio"
        accessibilityState={{ checked: value === 'metric' }}
      >
        <Text style={[s.label, value === 'metric' && s.labelActive]}>Metric</Text>
      </Pressable>
      <Text style={s.separator}>/</Text>
      <Pressable
        onPress={() => onChange('imperial')}
        accessibilityRole="radio"
        accessibilityState={{ checked: value === 'imperial' }}
      >
        <Text style={[s.label, value === 'imperial' && s.labelActive]}>Imperial</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  labelActive: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  separator: {
    fontSize: 13,
    color: colors.outlineVariant,
  },
});
