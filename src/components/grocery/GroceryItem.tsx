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
import { usePantryStore } from '../../stores/pantryStore';

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
  const pantryItems = usePantryStore((s) => s.items);

  const checkerProfile = item.checked_by
    ? members.find((m) => m.user_id === item.checked_by)?.profiles
    : null;

  const inPantry = pantryItems.some(
    (p) => p.name.toLowerCase() === item.name.toLowerCase()
  );

  // Build subtitle line: "quantity . ~$price"
  const subtitleParts: string[] = [];
  if (item.quantity) subtitleParts.push(item.quantity);
  if (item.estimated_price != null) subtitleParts.push(`~$${item.estimated_price.toFixed(2)}`);
  const subtitle = subtitleParts.join(' \u00B7 ');

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
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              item.is_checked && styles.subtitleChecked,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Pantry tag */}
      {inPantry && (
        <View style={styles.pantryTag}>
          <Text style={styles.pantryTagText}>Pantry</Text>
        </View>
      )}

      {/* Trailing: checker avatar + 3-dot menu */}
      <View style={styles.trailing}>
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
            style={styles.menuBtn}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
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
  subtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  subtitleChecked: {
    textDecorationLine: 'line-through',
    color: colors.outline,
  },
  pantryTag: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  pantryTagText: {
    ...typography.labelSm,
    color: colors.onPrimaryContainer,
    textTransform: 'none',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
