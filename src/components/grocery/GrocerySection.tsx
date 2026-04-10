import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { GroceryItem as GroceryItemType } from '../../types/database';
import { GroceryItem } from './GroceryItem';
import { Collapsible } from '../ui/Collapsible';

const SECTION_ICONS: Record<string, string> = {
  'Proteins': 'food-drumstick',
  'Produce': 'fruit-cherries',
  'Dairy & Eggs': 'egg-outline',
  'Pantry': 'cupboard-outline',
  'Other': 'package-variant',
  'Completed': 'check-circle-outline',
};

interface GrocerySectionProps {
  title: string;
  items: GroceryItemType[];
  userId: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onEditItem?: (item: GroceryItemType) => void;
}

export function GrocerySection({
  title,
  items,
  userId,
  collapsible = true,
  defaultCollapsed = false,
  onEditItem,
}: GrocerySectionProps) {
  if (items.length === 0) return null;

  const headerContent = (
    <View style={styles.headerLeft}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name={(SECTION_ICONS[title] || 'tag-outline') as any}
          size={18}
          color={colors.primary}
        />
      </View>
      {title === 'Completed' ? (
        <Text style={styles.title}>Completed ({items.length})</Text>
      ) : (
        <>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{items.length}</Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container} testID={`grocery-section-${title}`}>
      <Collapsible
        defaultCollapsed={defaultCollapsed}
        header={headerContent}
      >
        {items.map((item) => (
          <GroceryItem
            key={item.id}
            item={item}
            userId={userId}
            onEdit={onEditItem}
          />
        ))}
      </Collapsible>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
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
