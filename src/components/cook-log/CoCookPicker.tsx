import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CoCookUser {
  id: string;
  handle: string | null;
  avatar_url: string | null;
}

interface CoCookPickerProps {
  selectedUsers: CoCookUser[];
  onSelectionChange: (users: CoCookUser[]) => void;
  currentUserId: string;
  disabled?: boolean;
}

const MAX_CO_COOKS = 5;
const DEBOUNCE_MS = 300;

export function CoCookPicker({
  selectedUsers,
  onSelectionChange,
  currentUserId,
  disabled,
}: CoCookPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoCookUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length === 0) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id, handle, display_name, avatar_url')
          .ilike('handle', `%${text.trim()}%`)
          .neq('id', currentUserId)
          .limit(5);

        if (error || !data) {
          setResults([]);
          setShowDropdown(false);
          return;
        }

        const selectedIds = new Set(selectedUsers.map((u) => u.id));
        const filtered = data
          .filter((row) => !selectedIds.has(row.id))
          .map((row) => ({
            id: row.id,
            handle: row.handle,
            avatar_url: row.avatar_url,
          }));

        setResults(filtered);
        setShowDropdown(filtered.length > 0);
      }, DEBOUNCE_MS);
    },
    [currentUserId, selectedUsers]
  );

  const handleTextChange = (text: string) => {
    setQuery(text);
    search(text);
  };

  const handleSelect = (user: CoCookUser) => {
    onSelectionChange([...selectedUsers, user]);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleRemove = (userId: string) => {
    onSelectionChange(selectedUsers.filter((u) => u.id !== userId));
  };

  const getInitials = (handle: string | null): string => {
    if (!handle) return '?';
    return handle.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Selected chips */}
      {selectedUsers.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContainer}
        >
          {selectedUsers.map((user) => (
            <View key={user.id} style={styles.chip}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.chipAvatar} />
              ) : (
                <View style={[styles.chipAvatar, styles.chipAvatarFallback]}>
                  <Text style={styles.chipAvatarText}>{getInitials(user.handle)}</Text>
                </View>
              )}
              <Text style={styles.chipHandle} numberOfLines={1}>
                @{user.handle ?? 'user'}
              </Text>
              <Pressable
                onPress={() => handleRemove(user.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${user.handle ?? 'user'}`}
              >
                <MaterialCommunityIcons name="close" size={14} color={colors.onSurface} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Search input or max message */}
      {selectedUsers.length >= MAX_CO_COOKS ? (
        <Text style={styles.maxHint}>Maximum {MAX_CO_COOKS} co-cooks</Text>
      ) : (
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search @handle..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={query}
            onChangeText={handleTextChange}
            editable={!disabled}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search co-cooks"
          />

          {/* Dropdown results */}
          {showDropdown && (
            <View style={styles.dropdown}>
              {results.map((user) => (
                <Pressable
                  key={user.id}
                  style={styles.dropdownRow}
                  onPress={() => handleSelect(user)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${user.handle ?? 'user'}`}
                >
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.dropdownAvatar} />
                  ) : (
                    <View style={[styles.dropdownAvatar, styles.dropdownAvatarFallback]}>
                      <Text style={styles.dropdownAvatarText}>
                        {getInitials(user.handle)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.dropdownTextCol}>
                    <Text style={styles.dropdownHandle} numberOfLines={1}>
                      @{user.handle ?? 'user'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  chipScroll: {
    marginBottom: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  chipAvatarFallback: {
    backgroundColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    ...typography.labelSm,
    color: colors.onSurface,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  chipHandle: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
    maxWidth: 100,
  },
  maxHint: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  searchInput: {
    ...typography.bodyMd,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.onSurface,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginTop: 2,
    zIndex: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dropdownAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dropdownAvatarFallback: {
    backgroundColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownAvatarText: {
    ...typography.labelSm,
    color: colors.onSurface,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  dropdownTextCol: {
    flex: 1,
  },
  dropdownHandle: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
});
