import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHouseholdStore } from '../../src/stores/householdStore';
import { useLeftoverStore } from '../../src/stores/leftoverStore';
import { LeftoverItem } from '../../src/components/leftovers/LeftoverItem';
import { LeftoverSummary } from '../../src/components/leftovers/LeftoverSummary';
import { AddLeftoverSheet } from '../../src/components/leftovers/AddLeftoverSheet';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';

export default function LeftoversScreen() {
  const insets = useSafeAreaInsets();
  const { activeHouseholdId } = useHouseholdStore();
  const {
    leftovers,
    loading,
    fetchLeftovers,
    updatePortions,
    deleteLeftover,
    statusBreakdown,
    totalCount,
  } = useLeftoverStore();

  const [addSheetOpen, setAddSheetOpen] = useState(false);

  useEffect(() => {
    if (activeHouseholdId) {
      fetchLeftovers(activeHouseholdId);
    }
  }, [activeHouseholdId]);

  const handleUpdatePortions = useCallback(
    (id: string, portions: number) => {
      updatePortions(id, portions);
    },
    [updatePortions]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteLeftover(id);
    },
    [deleteLeftover]
  );

  const breakdown = statusBreakdown();
  const total = totalCount();

  // Sort by use_by_date ascending (soonest expiring first)
  const sortedLeftovers = [...leftovers].sort(
    (a, b) => new Date(a.use_by_date).getTime() - new Date(b.use_by_date).getTime()
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leftovers</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary bar */}
        {total > 0 && (
          <LeftoverSummary totalCount={total} breakdown={breakdown} />
        )}

        {/* Leftover items */}
        {sortedLeftovers.length > 0 ? (
          sortedLeftovers.map((leftover) => (
            <LeftoverItem
              key={leftover.id}
              leftover={leftover}
              onUpdatePortions={handleUpdatePortions}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="food-off-outline"
              size={48}
              color={colors.onSurfaceVariant}
            />
            <Text style={styles.emptyTitle}>No leftovers tracked</Text>
            <Text style={styles.emptySubtitle}>
              Add your first leftover to start reducing food waste
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => setAddSheetOpen(true)}
        testID="leftovers-add-button"
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.onPrimary} />
      </Pressable>

      {/* Add Sheet */}
      {activeHouseholdId && (
        <AddLeftoverSheet
          isOpen={addSheetOpen}
          onClose={() => setAddSheetOpen(false)}
          householdId={activeHouseholdId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + 60,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.float,
  },
});
