import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { usePantryStore } from '../../stores/pantryStore';
import { PantryItem } from '../../types/database';

const SECTION_ORDER = ['Proteins', 'Produce', 'Dairy & Eggs', 'Pantry', 'Other'];

function getFreshnessBadge(expiresAt: string | null): { label: string; color: string; bg: string } | null {
  if (!expiresAt) return null;

  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { label: 'Expiring', color: '#B3261E', bg: '#FFDAD6' };
  }
  if (diffDays <= 3) {
    return { label: 'Use Soon', color: '#7C5800', bg: '#FFDEA1' };
  }
  return { label: 'Fresh', color: '#1B6D2D', bg: '#C4EDCB' };
}

export function OnHandList() {
  const items = usePantryStore((s) => s.items);
  const loading = usePantryStore((s) => s.loading);
  const removePantryItem = usePantryStore((s) => s.removePantryItem);

  // Group items by category
  const grouped: Record<string, PantryItem[]> = {};
  for (const item of items) {
    const cat = item.category ?? 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Skeleton width="100%" height={56} />
        <Skeleton width="100%" height={56} style={{ marginTop: spacing.sm }} />
        <Skeleton width="100%" height={56} style={{ marginTop: spacing.sm }} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="fridge-outline"
          title="Nothing on hand"
          subtitle="Add items or check off groceries to stock up"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTION_ORDER.map((sectionName) => {
          const sectionItems = grouped[sectionName];
          if (!sectionItems || sectionItems.length === 0) return null;
          return (
            <PantrySection
              key={sectionName}
              title={sectionName}
              items={sectionItems}
              onRemove={removePantryItem}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

// --- PantrySection ---

function PantrySection({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: PantryItem[];
  onRemove: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View style={sectionStyles.container}>
      <Pressable style={sectionStyles.header} onPress={() => setCollapsed(!collapsed)}>
        <View style={sectionStyles.headerLeft}>
          <Text style={sectionStyles.title}>{title}</Text>
          <View style={sectionStyles.badge}>
            <Text style={sectionStyles.badgeText}>{items.length}</Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={colors.onSurfaceVariant}
        />
      </Pressable>

      {!collapsed &&
        items.map((item) => (
          <PantryItemRow key={item.id} item={item} onRemove={onRemove} />
        ))}
    </View>
  );
}

// --- PantryItemRow ---

function PantryItemRow({
  item,
  onRemove,
}: {
  item: PantryItem;
  onRemove: (id: string) => void;
}) {
  const badge = getFreshnessBadge(item.expires_at);
  const quantityStr = [item.quantity, item.unit].filter(Boolean).join(' ');

  return (
    <View style={itemStyles.container}>
      <View style={itemStyles.info}>
        <Text style={itemStyles.name}>{item.name}</Text>
        <View style={itemStyles.meta}>
          {quantityStr ? <Text style={itemStyles.quantity}>{quantityStr}</Text> : null}
          {badge && (
            <View style={[itemStyles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[itemStyles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          )}
        </View>
      </View>
      <Pressable
        style={itemStyles.deleteBtn}
        onPress={() => onRemove(item.id)}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
      </Pressable>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});

const sectionStyles = StyleSheet.create({
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

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '500',
  },
  meta: {
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
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
