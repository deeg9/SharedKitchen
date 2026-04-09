import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface GroceryShortcutCardProps {
  itemCount: number;
  onPress: () => void;
}

export function GroceryShortcutCard({ itemCount, onPress }: GroceryShortcutCardProps) {
  return (
    <Pressable onPress={onPress} testID="grocery-shortcut-card">
      <Card
        variant="elevated"
        style={styles.card}
      >
        <View style={styles.row}>
          {/* Grocery icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="basket-outline"
              size={22}
              color={colors.primary}
            />
          </View>

          {/* Label + count */}
          <View style={styles.content}>
            <Text style={styles.title}>Grocery List</Text>
            <Text style={styles.subtitle}>
              {itemCount} items needed this week
            </Text>
          </View>

          {/* Chevron */}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.outlineVariant}
          />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: colors.primaryFixed,
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
