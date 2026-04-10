import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  testID?: string;
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  testID,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper} testID={testID}>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(!open)}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedOption && styles.triggerPlaceholder,
          ]}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.onSurfaceVariant}
        />
      </Pressable>

      {open && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.dropdown}>
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.option,
                    isActive && styles.optionActive,
                  ]}
                  onPress={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  triggerText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  triggerPlaceholder: {
    color: colors.onSurfaceVariant,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 9,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    ...shadows.float,
    zIndex: 10,
    maxHeight: 200,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionActive: {
    backgroundColor: colors.primaryFixed,
  },
  optionText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  optionTextActive: {
    color: colors.primary,
  },
});
