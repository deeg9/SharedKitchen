import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useGroceryStore } from '../../stores/groceryStore';

const SECTIONS = ['Proteins', 'Produce', 'Dairy & Eggs', 'Pantry', 'Other'] as const;

interface AddItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
}

export function AddItemSheet({ isOpen, onClose, listId }: AddItemSheetProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [section, setSection] = useState<string>('Other');
  const [price, setPrice] = useState('');
  const addManualItem = useGroceryStore((s) => s.addManualItem);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const parsedPrice = price ? parseFloat(price) : undefined;
    await addManualItem(
      listId,
      name.trim(),
      quantity.trim() || undefined,
      section,
      !isNaN(parsedPrice as number) ? parsedPrice : undefined
    );
    // Clear form for next item
    setName('');
    setQuantity('');
    setPrice('');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={['55%']}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Item</Text>
          <Pressable onPress={onClose} testID="close-add-sheet">
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Item name"
            placeholderTextColor={colors.outline}
            testID="add-item-name"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g. 2 lbs"
              placeholderTextColor={colors.outline}
              testID="add-item-quantity"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Est. Price</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="$0.00"
              placeholderTextColor={colors.outline}
              keyboardType="decimal-pad"
              testID="add-item-price"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Section</Text>
          <View style={styles.chips}>
            {SECTIONS.map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.chip,
                  section === s && styles.chipSelected,
                ]}
                onPress={() => setSection(s)}
                testID={`section-chip-${s}`}
              >
                <Text
                  style={[
                    styles.chipText,
                    section === s && styles.chipTextSelected,
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Button
          onPress={handleAdd}
          disabled={!name.trim()}
          style={styles.addButton}
          testID="add-item-button"
        >
          Add Item
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  closeText: {
    ...typography.labelLg,
    color: colors.primary,
  },
  field: {
    marginBottom: spacing.sm + 4,
  },
  label: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  chipSelected: {
    backgroundColor: colors.primaryContainer,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  chipTextSelected: {
    color: colors.onPrimaryContainer,
  },
  addButton: {
    marginTop: spacing.sm,
  },
});
