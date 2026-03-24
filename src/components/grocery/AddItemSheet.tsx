import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useGroceryStore } from '../../stores/groceryStore';

const UNIT_OPTIONS = ['Unit', 'lb', 'oz', 'Gallon', 'cups', 'bunch', 'bag', 'pk'] as const;

const SECTION_OPTIONS: { label: string; dbValue: string }[] = [
  { label: 'Produce', dbValue: 'Produce' },
  { label: 'Dairy', dbValue: 'Dairy & Eggs' },
  { label: 'Meat', dbValue: 'Proteins' },
  { label: 'Pantry', dbValue: 'Pantry' },
  { label: 'Frozen', dbValue: 'Other' },
  { label: 'Household', dbValue: 'Other' },
];

interface AddItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
}

export function AddItemSheet({ isOpen, onClose, listId }: AddItemSheetProps) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [unitIdx, setUnitIdx] = useState(0);
  const [sectionLabel, setSectionLabel] = useState('Produce');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const addManualItem = useGroceryStore((s) => s.addManualItem);

  const selectedSection = SECTION_OPTIONS.find((s) => s.label === sectionLabel);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const unit = UNIT_OPTIONS[unitIdx];
    const quantityStr = unit === 'Unit' ? String(qty) : `${qty} ${unit}`;
    const parsedPrice = price ? parseFloat(price) : undefined;

    await addManualItem(
      listId,
      name.trim(),
      quantityStr,
      selectedSection?.dbValue ?? 'Other',
      !isNaN(parsedPrice as number) ? parsedPrice : undefined
    );

    // Clear form for next item
    setName('');
    setQty(1);
    setNotes('');
    setPrice('');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['92%']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Add to List</Text>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Item Name */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Item Name</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Organic Milk"
              placeholderTextColor={colors.surfaceContainerHighest}
              testID="add-item-name"
            />
          </View>

          {/* Quantity + Unit */}
          <View style={styles.qtyUnitRow}>
            <View style={styles.qtyBox}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => setQty(Math.max(1, qty - 1))}
                  style={styles.stepperBtn}
                >
                  <MaterialCommunityIcons name="minus" size={16} color={colors.primary} />
                </Pressable>
                <Text style={styles.stepperValue}>{qty}</Text>
                <Pressable
                  onPress={() => setQty(qty + 1)}
                  style={styles.stepperBtn}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.unitBox}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unitChips}
              >
                {UNIT_OPTIONS.map((u, i) => (
                  <Pressable
                    key={u}
                    onPress={() => setUnitIdx(i)}
                    style={[styles.unitChip, unitIdx === i && styles.unitChipActive]}
                  >
                    <Text style={[styles.unitChipText, unitIdx === i && styles.unitChipTextActive]}>
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Est. Price */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Est. Price</Text>
            <View style={styles.priceWrap}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={colors.outlineVariant}
                keyboardType="decimal-pad"
                testID="add-item-price"
              />
            </View>
          </View>

          {/* Store Section */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Store Section</Text>
            <View style={styles.sectionChips}>
              {SECTION_OPTIONS.map((s) => (
                <Pressable
                  key={s.label}
                  onPress={() => setSectionLabel(s.label)}
                  style={[
                    styles.sectionChip,
                    sectionLabel === s.label && styles.sectionChipActive,
                  ]}
                  testID={`section-chip-${s.label}`}
                >
                  <Text
                    style={[
                      styles.sectionChipText,
                      sectionLabel === s.label && styles.sectionChipTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Get the fat-free one if available..."
              placeholderTextColor={colors.outlineVariant}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* Add Button — fixed at bottom */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleAdd}
            disabled={!name.trim()}
            style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
            testID="add-item-button"
          >
            <MaterialCommunityIcons name="cart-plus" size={22} color={colors.onPrimary} />
            <Text style={styles.addBtnText}>Add to List</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  // Shared
  section: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  // Item Name
  nameInput: {
    fontSize: 28,
    fontFamily: fontFamily.headlineBold,
    fontWeight: '700',
    color: colors.onSurface,
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  // Quantity + Unit
  qtyUnitRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  qtyBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.editorial,
  },
  stepperValue: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
  },
  unitBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  unitChips: {
    gap: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  unitChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  unitChipActive: {
    backgroundColor: colors.primary,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  unitChipTextActive: {
    color: colors.onPrimary,
  },
  // Price
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  priceDollar: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.outline,
  },
  priceInput: {
    flex: 1,
    fontFamily: fontFamily.headlineBold,
    fontWeight: '700',
    fontSize: 16,
    color: colors.onSurface,
    padding: 0,
  },
  // Section chips
  sectionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  sectionChipActive: {
    backgroundColor: colors.primary,
    ...shadows.editorial,
  },
  sectionChipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  sectionChipTextActive: {
    color: colors.onPrimary,
  },
  // Notes
  notesInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 14,
    color: colors.onSurface,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Footer
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.full,
    ...shadows.float,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
