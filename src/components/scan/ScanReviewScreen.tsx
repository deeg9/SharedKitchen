import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { ScannedItem } from '../../types/scan';
import { findDuplicates } from '../../lib/dedup';
import { analyzePhoto, VisionRateLimitError } from '../../lib/vision';
import { usePantryStore } from '../../stores/pantryStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { useCameraPermission } from '../../hooks/useCameraPermission';
import { CameraSheet } from '../camera/CameraSheet';
import { CameraPermissionPrompt } from '../camera/CameraPermissionPrompt';
import { VisionLoadingOverlay } from '../camera/VisionLoadingOverlay';

const CATEGORY_OPTIONS = ['Proteins', 'Produce', 'Dairy & Eggs', 'Pantry', 'Other'] as const;

interface ScanReviewScreenProps {
  /** Initial items from the first scan */
  initialItems: Array<{ name: string; category?: string; quantity?: string; brand?: string }>;
  /** Called when user dismisses the review screen */
  onClose: () => void;
  /** Called after successful save -- parent should switch to On Hand segment */
  onSaved: (count: number) => void;
}

export function ScanReviewScreen({ initialItems, onClose, onSaved }: ScanReviewScreenProps) {
  const insets = useSafeAreaInsets();
  const pantryItems = usePantryStore((s) => s.items);
  const bulkAddPantryItems = usePantryStore((s) => s.bulkAddPantryItems);
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);

  const [items, setItems] = useState<ScannedItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoCount, setPhotoCount] = useState(1);

  // "Add missed item" state
  const [addingItem, setAddingItem] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newCategory, setNewCategory] = useState('Other');

  // Camera for "Scan Another"
  const [cameraOpen, setCameraOpen] = useState(false);
  const { showPrePrompt, checkAndPrompt, requestAfterPrePrompt, dismissPrePrompt } = useCameraPermission();

  // Initialize items from props on mount
  useEffect(() => {
    const converted: ScannedItem[] = initialItems.map((item, index) => ({
      id: `scan-${Date.now()}-${index}`,
      name: item.name,
      quantity: item.quantity ?? '1',
      category: item.category ?? 'Other',
      brand: item.brand ?? null,
      duplicateOfId: null,
      duplicateOfName: null,
    }));
    const withDuplicates = findDuplicates(converted, pantryItems);
    setItems(withDuplicates);
  }, []); // Only on mount

  // --- Inline editing handlers ---
  const handleEditField = useCallback((id: string, field: keyof ScannedItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
  }, [editingId]);

  // --- Add missed item ---
  const handleAddItem = useCallback(() => {
    if (!newName.trim()) return;
    const newItem: ScannedItem = {
      id: `scan-add-${Date.now()}`,
      name: newName.trim(),
      quantity: newQuantity.trim() || '1',
      category: newCategory,
      brand: null,
      duplicateOfId: null,
      duplicateOfName: null,
    };
    // Check for duplicates against pantry
    const [checked] = findDuplicates([newItem], pantryItems);
    setItems((prev) => [...prev, checked]);
    setNewName('');
    setNewQuantity('');
    setNewCategory('Other');
    setAddingItem(false);
  }, [newName, newQuantity, newCategory, pantryItems]);

  // --- Scan Another ---
  const handleScanAnother = useCallback(async () => {
    const granted = await checkAndPrompt();
    if (granted) {
      setCameraOpen(true);
    }
  }, [checkAndPrompt]);

  const handleScanImageCaptured = useCallback(async (uri: string) => {
    setCameraOpen(false);
    setScanning(true);
    try {
      const result = await analyzePhoto(uri, 'scan');
      if (result.items && result.items.length > 0) {
        const newScanned: ScannedItem[] = result.items.map((item, index) => ({
          id: `scan-${Date.now()}-${index}`,
          name: item.name,
          quantity: item.quantity ?? '1',
          category: item.category ?? 'Other',
          brand: item.brand ?? null,
          duplicateOfId: null,
          duplicateOfName: null,
        }));
        const withDuplicates = findDuplicates(newScanned, pantryItems);
        setItems((prev) => [...prev, ...withDuplicates]);
        setPhotoCount((c) => c + 1);
      } else {
        Alert.alert('No items found', 'We couldn\'t identify any food items in that photo. Try a clearer photo.');
      }
    } catch (err: unknown) {
      if (err instanceof VisionRateLimitError) {
        Alert.alert('Monthly scan limit reached', `You've used all ${err.limit} free scans this month. Upgrade to Premium for unlimited scans.`);
      } else {
        Alert.alert('Couldn\'t analyze that photo', 'Please try again with a clearer image.');
      }
    } finally {
      setScanning(false);
    }
  }, [pantryItems]);

  // --- Save ---
  const handleSave = useCallback(async () => {
    if (!activeHouseholdId || items.length === 0) return;
    setSaving(true);
    try {
      const { addedCount } = await bulkAddPantryItems(
        activeHouseholdId,
        items.map((i) => ({ name: i.name, quantity: i.quantity, category: i.category }))
      );
      onSaved(addedCount);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  }, [activeHouseholdId, items, bulkAddPantryItems, onSaved]);

  // --- Category dropdown for inline editing ---
  const [categoryDropdownId, setCategoryDropdownId] = useState<string | null>(null);

  const renderItem = useCallback(({ item }: { item: ScannedItem }) => {
    const isEditing = editingId === item.id;
    const isDuplicate = item.duplicateOfId !== null;
    const showCategoryDropdown = categoryDropdownId === item.id;

    return (
      <View style={[rowStyles.container, isDuplicate && rowStyles.duplicateContainer]}>
        <Pressable
          style={rowStyles.content}
          onPress={() => setEditingId(isEditing ? null : item.id)}
        >
          {isEditing ? (
            <View style={rowStyles.editForm}>
              <TextInput
                style={rowStyles.editInput}
                value={item.name}
                onChangeText={(v) => handleEditField(item.id, 'name', v)}
                placeholder="Item name"
                placeholderTextColor={colors.outlineVariant}
                autoFocus
              />
              <View style={rowStyles.editRow}>
                <TextInput
                  style={[rowStyles.editInput, rowStyles.editInputSmall]}
                  value={item.quantity}
                  onChangeText={(v) => handleEditField(item.id, 'quantity', v)}
                  placeholder="Qty"
                  placeholderTextColor={colors.outlineVariant}
                />
                <Pressable
                  style={rowStyles.categorySelect}
                  onPress={() => setCategoryDropdownId(showCategoryDropdown ? null : item.id)}
                >
                  <Text style={rowStyles.categorySelectText}>{item.category}</Text>
                  <MaterialCommunityIcons
                    name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.onSurfaceVariant}
                  />
                </Pressable>
              </View>
              {showCategoryDropdown && (
                <View style={rowStyles.categoryDropdown}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[
                        rowStyles.categoryOption,
                        item.category === cat && rowStyles.categoryOptionActive,
                      ]}
                      onPress={() => {
                        handleEditField(item.id, 'category', cat);
                        setCategoryDropdownId(null);
                      }}
                    >
                      <Text
                        style={[
                          rowStyles.categoryOptionText,
                          item.category === cat && rowStyles.categoryOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={rowStyles.displayContent}>
              <View style={rowStyles.nameRow}>
                <Text style={rowStyles.name} numberOfLines={1}>{item.name}</Text>
                {item.brand && (
                  <Text style={rowStyles.brand} numberOfLines={1}>{item.brand}</Text>
                )}
              </View>
              <View style={rowStyles.metaRow}>
                <Text style={rowStyles.quantity}>{item.quantity}</Text>
                <View style={rowStyles.categoryPill}>
                  <Text style={rowStyles.categoryPillText}>{item.category}</Text>
                </View>
              </View>
              {isDuplicate && (
                <View style={rowStyles.duplicateBadge}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#7C5800" />
                  <Text style={rowStyles.duplicateText}>Already in pantry: {item.duplicateOfName}</Text>
                </View>
              )}
            </View>
          )}
        </Pressable>

        <Pressable
          style={rowStyles.deleteBtn}
          onPress={() => handleDelete(item.id)}
          hitSlop={8}
          accessibilityLabel={`Delete ${item.name}`}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
        </Pressable>
      </View>
    );
  }, [editingId, categoryDropdownId, handleEditField, handleDelete]);

  // --- Add missed item row ---
  const renderFooter = useCallback(() => {
    if (addingItem) {
      return (
        <View style={addStyles.container}>
          <TextInput
            style={addStyles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Item name"
            placeholderTextColor={colors.outlineVariant}
            autoFocus
          />
          <View style={addStyles.row}>
            <TextInput
              style={[addStyles.input, addStyles.inputSmall]}
              value={newQuantity}
              onChangeText={setNewQuantity}
              placeholder="Qty"
              placeholderTextColor={colors.outlineVariant}
            />
            <Pressable
              style={[addStyles.addBtn, !newName.trim() && addStyles.addBtnDisabled]}
              onPress={handleAddItem}
              disabled={!newName.trim()}
            >
              <Text style={addStyles.addBtnText}>Add</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setAddingItem(false)} style={addStyles.cancelBtn}>
            <Text style={addStyles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <Pressable style={addStyles.trigger} onPress={() => setAddingItem(true)} testID="scan-add-missed-btn">
        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
        <Text style={addStyles.triggerText}>Add missed item</Text>
      </Pressable>
    );
  }, [addingItem, newName, newQuantity, handleAddItem]);

  // --- Empty state ---
  if (items.length === 0 && !scanning) {
    return (
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Review Items</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={48} color={colors.outlineVariant} />
          <Text style={styles.emptyTitle}>No items to add</Text>
          <Pressable style={styles.scanAgainBtn} onPress={handleScanAnother}>
            <MaterialCommunityIcons name="camera" size={20} color={colors.onPrimary} />
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </Pressable>
        </View>
        <CameraSheet
          isOpen={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onImageCaptured={handleScanImageCaptured}
        />
        <CameraPermissionPrompt
          isOpen={showPrePrompt}
          onAllow={requestAfterPrePrompt}
          onDismiss={dismissPrePrompt}
        />
        <VisionLoadingOverlay visible={scanning} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Review Items</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length} items</Text>
          </View>
        </View>
        <Pressable onPress={handleScanAnother} style={styles.scanAnotherBtn} disabled={scanning} testID="scan-another-btn">
          <MaterialCommunityIcons name="camera-plus" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {photoCount > 1 && (
        <View style={styles.photoCountRow}>
          <MaterialCommunityIcons name="image-multiple" size={14} color={colors.onSurfaceVariant} />
          <Text style={styles.photoCountText}>{photoCount} photos scanned</Text>
        </View>
      )}

      {/* Item list */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* Footer: Save button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || items.length === 0}
          testID="scan-save-btn"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
              <Text style={styles.saveBtnText}>Save {items.length} items</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Camera components for "Scan Another" */}
      <CameraSheet
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onImageCaptured={handleScanImageCaptured}
      />
      <CameraPermissionPrompt
        isOpen={showPrePrompt}
        onAllow={requestAfterPrePrompt}
        onDismiss={dismissPrePrompt}
      />
      <VisionLoadingOverlay visible={scanning} />
    </KeyboardAvoidingView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
  },
  headerSpacer: {
    width: 40,
  },
  countBadge: {
    backgroundColor: colors.primaryFixed,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  countBadgeText: {
    ...typography.labelSm,
    color: colors.primary,
    textTransform: 'none',
  },
  scanAnotherBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  photoCountText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.float,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.titleMd,
    color: colors.onSurfaceVariant,
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  scanAgainText: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.onPrimary,
  },
});

// --- Row Styles ---

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  duplicateContainer: {
    backgroundColor: '#FFF8E1',
  },
  content: {
    flex: 1,
  },
  displayContent: {
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
    flexShrink: 1,
  },
  brand: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  quantity: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'none',
  },
  categoryPill: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  categoryPillText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'none',
    fontSize: 11,
  },
  duplicateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  duplicateText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7C5800',
  },
  editForm: {
    gap: spacing.sm,
  },
  editInput: {
    fontSize: 15,
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  editRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editInputSmall: {
    flex: 1,
  },
  categorySelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  categorySelectText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontSize: 13,
  },
  categoryDropdown: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    ...shadows.float,
  },
  categoryOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryOptionActive: {
    backgroundColor: colors.primaryFixed,
  },
  categoryOptionText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontSize: 13,
  },
  categoryOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});

// --- Add Item Styles ---

const addStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  triggerText: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '500',
  },
  container: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: {
    fontSize: 15,
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  inputSmall: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    ...typography.labelLg,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  cancelText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
