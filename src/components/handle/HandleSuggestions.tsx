import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface HandleSuggestionsProps {
  suggestions: string[];
  onSelect: (handle: string) => void;
}

export function HandleSuggestions({ suggestions, onSelect }: HandleSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      {suggestions.map((suggestion, index) => (
        <Animated.View
          key={suggestion}
          entering={FadeIn.delay(index * 50).duration(200)}
        >
          <Pressable
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => onSelect(suggestion)}
            accessibilityRole="button"
            accessibilityLabel={`Use handle ${suggestion}`}
          >
            <Text style={styles.chipText}>@{suggestion}</Text>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    height: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    ...typography.bodyMd,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.onSurface,
  },
});
