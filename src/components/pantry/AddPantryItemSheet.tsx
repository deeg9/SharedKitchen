import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { TAB_BAR_HEIGHT } from '../../lib/constants';
import { usePantryStore } from '../../stores/pantryStore';
import { useHouseholdStore } from '../../stores/householdStore';

const UNIT_OPTIONS = ['Unit', 'lb', 'oz', 'Gallon', 'cups', 'bunch', 'bag', 'pk'] as const;
const CATEGORY_OPTIONS = ['Proteins', 'Produce', 'Dairy & Eggs', 'Pantry', 'Other'] as const;

interface AddPantryItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPantryItemSheet({ isOpen, onClose }: AddPantryItemSheetProps) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [unitIdx, setUnitIdx] = useState(0);
  const [category, setCategory] = useState<string>('Other');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const addPantryItem = usePantryStore((s) => s.addPantryItem);
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setQty(1);
      setUnitIdx(0);
      setCategory('Other');
      setCategoryOpen(false);
      setExpiresAt('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim() || !activeHouseholdId) return;

    const unit = UNIT_OPTIONS[unitIdx];
    const quantityStr = unit === 'Unit' ? String(qty) : `${qty} ${unit}`;

    await addPantryItem(activeHouseholdId, {
      name: name.trim(),
      quantity: quantityStr,
      unit: unit === 'Unit' ? undefined : unit,
      category,
      expires_at: expiresAt.trim() || undefined,
    });

    // Clear form for next item
    setName('');
    setQty(1);
    setExpiresAt('');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['85%']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Add to Pantry</Text>
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
              placeholder="Chicken Breast"
              placeholderTextColor={colors.surfaceContainerHighest}
              testID="pantry-item-name"
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

          {/* Category */}
          <View style={[styles.section, { zIndex: 20 }]}>
            <Text style={styles.fieldLabel}>Category</Text>
            <Pressable
              style={[styles.dropdownTrigger, categoryOpen && styles.dropdownTriggerOpen]}
              onPress={() => setCategoryOpen(!categoryOpen)}
            >
              <Text style={styles.dropdownTriggerText}>{category}</Text>
              <MaterialCommunityIcons
                name={categoryOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
            {categoryOpen && (
              <View style={styles.dropdownList}>
                {CATEGORY_OPTIONS.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.dropdownItem, category === cat && styles.dropdownItemActive]}
                    onPress={() => {
                      setCategory(cat);
                      setCategoryOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        category === cat && styles.dropdownItemTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                    {category === cat && (
                      <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Expires At */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Expires (optional)</Text>
            <TextInput
              style={styles.expiresInput}
              value={expiresAt}
              onChangeText={setExpiresAt}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.outlineVariant}
              keyboardType="numbers-and-punctuation"
              testID="pantry-item-expires"
            />
          </View>

          {/* Add Button */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={!name.trim()}
              style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
              testID="add-pantry-button"
            >
              <MaterialCommunityIcons name="fridge-outline" size={22} color={colors.onPrimary} />
              <Text style={styles.addBtnText}>Add to Pantry</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: TAB_BAR_HEIGHT + spacing.xl,
  },
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTriggerText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    ...shadows.float,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryFixed,
  },
  dropdownItemText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  expiresInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
