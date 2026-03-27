import React from 'react';
import { View, Text, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { GroceryItem as GroceryItemType } from '../../types/database';
import { useGroceryStore } from '../../stores/groceryStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { useBudgetStore } from '../../stores/budgetStore';

interface GroceryItemProps {
  item: GroceryItemType;
  userId: string;
  onEdit?: (item: GroceryItemType) => void;
}

export function GroceryItem({ item, userId, onEdit }: GroceryItemProps) {
  const toggleItem = useGroceryStore((s) => s.toggleItem);
  const updateItem = useGroceryStore((s) => s.updateItem);
  const removeItem = useGroceryStore((s) => s.removeItem);
  const members = useHouseholdStore((s) => s.members);
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);

  const checkerProfile = item.checked_by
    ? members.find((m) => m.user_id === item.checked_by)?.profiles
    : null;

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // When unchecking, just toggle directly
    if (item.is_checked) {
      toggleItem(item.id, false, userId);
      return;
    }

    // When checking on, prompt for cost
    Alert.prompt(
      'Item Cost',
      `How much was ${item.name}?`,
      [
        {
          text: 'Skip',
          style: 'cancel',
          onPress: () => {
            toggleItem(item.id, true, userId);
          },
        },
        {
          text: 'Save',
          onPress: (value?: string) => {
            const parsedCost = parseFloat(value || '0');
            toggleItem(item.id, true, userId);
            if (parsedCost > 0) {
              updateItem(item.id, { estimated_price: parsedCost });
              if (activeHouseholdId) {
                useBudgetStore.getState().addExpense(activeHouseholdId, {
                  amount: parsedCost,
                  category: 'Groceries',
                  description: item.name,
                  expense_date: new Date().toISOString().split('T')[0],
                });
              }
            }
          },
        },
      ],
      'plain-text',
      item.estimated_price ? item.estimated_price.toFixed(2) : '',
      'decimal-pad'
    );
  };

  const handleDelete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeItem(item.id);
  };

  return (
    <Pressable
      style={styles.container}
      onPress={handleToggle}
      testID={`grocery-item-${item.id}`}
    >
      {/* Circular checkbox */}
      <View
        style={[
          styles.checkbox,
          item.is_checked && styles.checkboxChecked,
        ]}
      >
        {item.is_checked && (
          <MaterialCommunityIcons name="check" size={16} color={colors.onPrimary} />
        )}
      </View>

      {/* Item details */}
      <View style={styles.details}>
        <Text
          style={[
            styles.name,
            item.is_checked && styles.nameChecked,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.quantity ? (
          <Text style={[styles.quantity, item.is_checked && styles.textMuted]}>
            {item.quantity}
          </Text>
        ) : null}
      </View>

      {/* Price + checker avatar */}
      <View style={styles.trailing}>
        {item.estimated_price != null && (
          <Text style={[styles.price, item.is_checked && styles.textMuted]}>
            ${item.estimated_price.toFixed(2)}
          </Text>
        )}
        {item.is_checked && checkerProfile?.avatar_url ? (
          <Image
            source={{ uri: checkerProfile.avatar_url }}
            style={styles.avatar}
          />
        ) : item.is_checked && checkerProfile ? (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(checkerProfile.display_name || '?')[0].toUpperCase()}
            </Text>
          </View>
        ) : null}
        {onEdit && (
          <Pressable
            onPress={() => onEdit(item)}
            style={styles.editBtn}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
        <Pressable
          onPress={handleDelete}
          style={styles.deleteBtn}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="close" size={16} color={colors.outlineVariant} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 4,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  details: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  nameChecked: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant,
  },
  quantity: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  textMuted: {
    color: colors.outline,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
  },
  avatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.labelSm,
    color: colors.onPrimaryContainer,
    fontSize: 10,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
