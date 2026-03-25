import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { MealSuggestion } from '../../lib/ai';

interface MealSuggestionCardProps {
  suggestion: MealSuggestion;
  onAdd: (suggestion: MealSuggestion) => void;
}

export function MealSuggestionCard({ suggestion, onAdd }: MealSuggestionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{suggestion.name}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {suggestion.description}
      </Text>

      <View style={styles.badges}>
        {suggestion.estimated_cost !== null && (
          <View style={styles.badge}>
            <MaterialCommunityIcons name="currency-usd" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.badgeText}>~${suggestion.estimated_cost}</Text>
          </View>
        )}
        {suggestion.prep_time_minutes !== null && (
          <View style={styles.badge}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.badgeText}>{suggestion.prep_time_minutes} min</Text>
          </View>
        )}
        {suggestion.uses_leftovers && (
          <View style={[styles.badge, styles.leftoverBadge]}>
            <MaterialCommunityIcons name="recycle" size={14} color={colors.onSecondaryContainer} />
            <Text style={[styles.badgeText, styles.leftoverBadgeText]}>Uses leftovers</Text>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        onPress={() => onAdd(suggestion)}
        accessibilityRole="button"
        accessibilityLabel={`Add ${suggestion.name} to plan`}
      >
        <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
        <Text style={styles.addButtonText}>Add to Plan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  name: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  leftoverBadge: {
    backgroundColor: colors.secondaryContainer,
  },
  leftoverBadgeText: {
    color: colors.onSecondaryContainer,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryFixed,
  },
  addButtonText: {
    ...typography.labelLg,
    color: colors.primary,
  },
});
