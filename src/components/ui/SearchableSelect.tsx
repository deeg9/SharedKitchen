import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';

export const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Flexitarian',
  'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Soy-Free',
  'Egg-Free', 'Shellfish-Free', 'Sesame-Free', 'Fish-Free',
  'Keto', 'Paleo', 'Whole30', 'Low-Carb', 'Low-FODMAP',
  'Mediterranean', 'DASH',
  'Halal', 'Kosher',
  'Sugar-Free', 'Low-Sodium', 'High-Protein',
  'AIP (Autoimmune Protocol)', 'Nightshade-Free',
  'Corn-Free', 'Sulfite-Free', 'Histamine-Free',
];

interface SearchableSelectProps {
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  testID?: string;
}

export function SearchableSelect({
  options,
  selected,
  onSelectionChange,
  placeholder = 'Search...',
  testID,
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');

  const filtered = query.length > 0
    ? options.filter(
        (opt) =>
          !selected.includes(opt) &&
          opt.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const handleSelect = (item: string) => {
    onSelectionChange([...selected, item]);
    setQuery('');
  };

  const handleRemove = (item: string) => {
    onSelectionChange(selected.filter((s) => s !== item));
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.onSurfaceVariant}
          value={query}
          onChangeText={setQuery}
          testID={testID}
        />
        {filtered.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.dropdownText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>

      {selected.length > 0 && (
        <View style={styles.chipRow}>
          {selected.map((item) => (
            <View key={item} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
              <Pressable onPress={() => handleRemove(item)} hitSlop={8}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={16}
                  color={colors.onPrimary}
                />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  input: {
    ...typography.bodyMd,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.onSurface,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    zIndex: 10,
    elevation: 4,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    gap: spacing.xs,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.onPrimary,
  },
});
