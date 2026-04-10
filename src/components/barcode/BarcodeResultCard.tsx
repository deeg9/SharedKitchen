import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePantryStore } from '../../stores/pantryStore';
import { useGroceryStore } from '../../stores/groceryStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import type { FoodItem } from '../../types/food';

interface BarcodeResultCardProps {
  food: FoodItem;
  visible: boolean;
  onClose: () => void;
  onAddedToPantry: () => void;
  onAddedToGrocery: () => void;
}

export function BarcodeResultCard({
  food,
  visible,
  onClose,
  onAddedToPantry,
  onAddedToGrocery,
}: BarcodeResultCardProps) {
  const [addingPantry, setAddingPantry] = useState(false);
  const [addingGrocery, setAddingGrocery] = useState(false);

  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);
  const pantryItems = usePantryStore((s) => s.items);
  const activeListId = useGroceryStore((s) => s.activeListId);

  // Duplicate detection: check if product is already in pantry
  const alreadyInPantry = useMemo(() => {
    const normalized = food.name_normalized?.toLowerCase() ?? food.name.toLowerCase();
    return pantryItems.some((item) => {
      const itemName = item.name.toLowerCase();
      return itemName.includes(normalized) || normalized.includes(itemName);
    });
  }, [food, pantryItems]);

  const handleAddToPantry = async () => {
    if (!activeHouseholdId) {
      Alert.alert('No household', 'Please join or create a household first.');
      return;
    }
    setAddingPantry(true);
    try {
      await usePantryStore.getState().addPantryItem(activeHouseholdId, {
        name: food.name,
        category: food.category ?? 'Other',
      });
      Alert.alert('Added to Pantry', `${food.name} has been added to your pantry.`);
      onAddedToPantry();
    } catch {
      Alert.alert('Error', 'Failed to add item to pantry. Please try again.');
    } finally {
      setAddingPantry(false);
    }
  };

  const handleAddToGrocery = async () => {
    if (!activeListId) {
      Alert.alert(
        'No active grocery list',
        'Generate one from the Shopping List tab first.'
      );
      return;
    }
    setAddingGrocery(true);
    try {
      await useGroceryStore.getState().addManualItem(
        activeListId,
        food.name,
        '1',
        food.category ?? 'Other'
      );
      Alert.alert('Added to Grocery List', `${food.name} has been added to your grocery list.`);
      onAddedToGrocery();
    } catch {
      Alert.alert('Error', 'Failed to add item to grocery list. Please try again.');
    } finally {
      setAddingGrocery(false);
    }
  };

  const nutrition = food.nutrition;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Close button */}
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close product card"
            accessibilityRole="button"
            testID="barcode-result-close"
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.onSurfaceVariant} />
          </Pressable>

          {/* Product header */}
          <View style={styles.headerRow}>
            {food.image_url ? (
              <Image
                source={{ uri: food.image_url }}
                style={styles.thumbnail}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                <MaterialCommunityIcons name="food-variant" size={24} color={colors.onSurfaceVariant} />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.productName} numberOfLines={2}>
                {food.name}
              </Text>
              {food.brand && (
                <Text style={styles.brandText} numberOfLines={1}>
                  {food.brand}
                </Text>
              )}
            </View>
          </View>

          {/* Nutrition row */}
          {nutrition && (
            <View style={styles.nutritionRow}>
              <View style={styles.macroPill}>
                <Text style={styles.macroValue}>{Math.round(nutrition.calories)}</Text>
                <Text style={styles.macroLabel}>kcal</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroValue}>{Math.round(nutrition.protein_g)}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroValue}>{Math.round(nutrition.total_carbs_g)}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroValue}>{Math.round(nutrition.total_fat_g)}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          )}

          {/* Per 100g label */}
          <Text style={styles.per100g}>per 100g</Text>

          {/* Duplicate detection badge */}
          {alreadyInPantry && (
            <View style={styles.duplicateBadge}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#92400e" />
              <Text style={styles.duplicateText}>Already in pantry</Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleAddToPantry}
              disabled={addingPantry}
              accessibilityLabel="Add to Pantry"
              accessibilityRole="button"
              testID="barcode-add-pantry"
            >
              {addingPantry ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="fridge-outline" size={18} color={colors.onPrimary} />
                  <Text style={styles.primaryButtonText}>Add to Pantry</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.outlinedButton]}
              onPress={handleAddToGrocery}
              disabled={addingGrocery}
              accessibilityLabel="Add to Grocery"
              accessibilityRole="button"
              testID="barcode-add-grocery"
            >
              {addingGrocery ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="cart-plus" size={18} color={colors.primary} />
                  <Text style={styles.outlinedButtonText}>Add to Grocery</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingRight: spacing.lg,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  thumbnailPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  productName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  brandText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  macroPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: 3,
  },
  macroValue: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  macroLabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  per100g: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  duplicateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  duplicateText: {
    ...typography.labelMd,
    color: '#92400e',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md - 2,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  outlinedButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  outlinedButtonText: {
    ...typography.labelLg,
    color: colors.primary,
  },
});
