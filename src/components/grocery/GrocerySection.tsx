import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { GroceryItem as GroceryItemType } from '../../types/database';
import { GroceryItem } from './GroceryItem';

interface GrocerySectionProps {
  title: string;
  items: GroceryItemType[];
  userId: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function GrocerySection({
  title,
  items,
  userId,
  collapsible = false,
  defaultCollapsed = false,
}: GrocerySectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (items.length === 0) return null;

  return (
    <View style={styles.container} testID={`grocery-section-${title}`}>
      <Pressable
        style={styles.header}
        onPress={collapsible ? () => setCollapsed(!collapsed) : undefined}
        disabled={!collapsible}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{items.length}</Text>
          </View>
        </View>
        {collapsible && (
          <MaterialCommunityIcons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={colors.onSurfaceVariant}
          />
        )}
      </Pressable>

      {!collapsed &&
        items.map((item) => (
          <GroceryItem key={item.id} item={item} userId={userId} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  badge: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'none',
  },
});
