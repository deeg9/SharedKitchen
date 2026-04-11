import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface UserSearchResultProps {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  onPress: (userId: string) => void;
}

export function UserSearchResult({ id, handle, displayName, avatarUrl, onPress }: UserSearchResultProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={() => onPress(id)}
      accessibilityRole="button"
      accessibilityLabel={`@${handle}, ${displayName ?? handle}`}
      testID={`user-search-result-${handle}`}
    >
      <Avatar uri={avatarUrl} name={handle} size="sm" />
      <View style={styles.textColumn}>
        <Text style={styles.handle} numberOfLines={1}>@{handle}</Text>
        {displayName && (
          <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  textColumn: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  handle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  displayName: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
