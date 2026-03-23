import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Suggestion } from '../../lib/suggestions';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAddToPlan: (recipeId: string) => void;
}

export function SuggestionCard({ suggestion, onAddToPlan }: SuggestionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconRow}>
        <MaterialCommunityIcons
          name="lightbulb-outline"
          size={20}
          color={colors.secondary}
        />
        <Text style={styles.recipeName} numberOfLines={1}>
          {suggestion.recipeName}
        </Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {suggestion.message}
      </Text>
      <Pressable
        style={styles.addButton}
        onPress={() => onAddToPlan(suggestion.recipeId)}
      >
        <Text style={styles.addButtonText}>Add to Plan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: colors.secondaryFixed,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    ...shadows.editorial,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recipeName: {
    ...typography.titleMd,
    color: colors.secondary,
    flex: 1,
  },
  message: {
    ...typography.bodySm,
    color: colors.onSecondaryContainer,
    marginBottom: spacing.md,
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
  },
  addButtonText: {
    ...typography.labelMd,
    color: colors.onSecondary,
  },
});
