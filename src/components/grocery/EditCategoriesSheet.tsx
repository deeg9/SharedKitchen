import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useGroceryCategoryStore } from '../../stores/groceryCategoryStore';

interface EditCategoriesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditCategoriesSheet({ isOpen, onClose }: EditCategoriesSheetProps) {
  const { categories, addCategory, removeCategory, renameCategory, resetToDefaults } =
    useGroceryCategoryStore();

  const [newLabel, setNewLabel] = useState('');
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addCategory(newLabel.trim(), 'Other');
    setNewLabel('');
  };

  const handleStartRename = (label: string) => {
    setEditingLabel(label);
    setEditText(label);
  };

  const handleFinishRename = () => {
    if (editingLabel && editText.trim()) {
      renameCategory(editingLabel, editText.trim());
    }
    setEditingLabel(null);
    setEditText('');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['85%']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Categories</Text>
          <Pressable onPress={resetToDefaults} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Current categories */}
          <Text style={styles.sectionLabel}>YOUR CATEGORIES</Text>
          {categories.map((cat) => (
            <View key={cat.label} style={styles.catRow}>
              {editingLabel === cat.label ? (
                <TextInput
                  style={styles.renameInput}
                  value={editText}
                  onChangeText={setEditText}
                  onBlur={handleFinishRename}
                  onSubmitEditing={handleFinishRename}
                  autoFocus
                />
              ) : (
                <Pressable onPress={() => handleStartRename(cat.label)} style={styles.catLabelWrap}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                </Pressable>
              )}
              <View style={styles.catActions}>
                <Pressable onPress={() => handleStartRename(cat.label)} hitSlop={8}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.onSurfaceVariant} />
                </Pressable>
                {categories.length > 1 && (
                  <Pressable onPress={() => removeCategory(cat.label)} hitSlop={8}>
                    <MaterialCommunityIcons name="close" size={18} color={colors.outlineVariant} />
                  </Pressable>
                )}
              </View>
            </View>
          ))}

          {/* Add new category */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>ADD NEW CATEGORY</Text>

          <TextInput
            style={styles.newInput}
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder="Category name (e.g. Bakery)"
            placeholderTextColor={colors.outlineVariant}
          />

          <Pressable
            onPress={handleAdd}
            disabled={!newLabel.trim()}
            style={[styles.addBtn, !newLabel.trim() && styles.addBtnDisabled]}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
            <Text style={styles.addBtnText}>Add Category</Text>
          </Pressable>
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
  resetBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  resetText: {
    ...typography.labelMd,
    color: colors.secondary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  catLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catLabel: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  catActions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  renameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
    marginRight: spacing.md,
  },
  newInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
