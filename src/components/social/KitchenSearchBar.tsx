import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSocialStore } from '../../stores/socialStore';
import { KitchenSearchResult } from './KitchenSearchResult';
import { PeopleSearchTab } from './PeopleSearchTab';
import { KitchenProfile } from '../../types/database';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface KitchenSearchBarProps {
  onClose: () => void;
}

export function KitchenSearchBar({ onClose }: KitchenSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'kitchens' | 'people'>('kitchens');
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { searchResults, searchLoading, searchKitchens, clearSearch, searchPeople, peopleResults, peopleLoading, clearPeopleSearch } =
    useSocialStore();

  // Auto-focus on mount
  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timeout);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      clearSearch();
      clearPeopleSearch();
    };
  }, [clearSearch, clearPeopleSearch]);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length < 2) {
        clearSearch();
        clearPeopleSearch();
        return;
      }

      debounceRef.current = setTimeout(() => {
        if (activeTab === 'kitchens') {
          searchKitchens(text.trim());
        } else {
          searchPeople(text.trim());
        }
      }, 300);
    },
    [activeTab, searchKitchens, searchPeople, clearSearch, clearPeopleSearch]
  );

  const handleTabChange = useCallback((tab: 'kitchens' | 'people') => {
    setActiveTab(tab);
    clearSearch();
    clearPeopleSearch();
    if (query.trim().length >= 2) {
      if (tab === 'kitchens') {
        searchKitchens(query.trim());
      } else {
        searchPeople(query.trim());
      }
    }
  }, [query, searchKitchens, searchPeople, clearSearch, clearPeopleSearch]);

  const handleResultPress = useCallback(
    (kitchenId: string) => {
      Keyboard.dismiss();
      clearSearch();
      setQuery('');
      onClose();
      router.push(`/kitchen/${kitchenId}` as any);
    },
    [router, clearSearch, onClose]
  );

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    clearSearch();
    clearPeopleSearch();
    setQuery('');
    onClose();
  }, [clearSearch, clearPeopleSearch, onClose]);

  const showEmpty =
    activeTab === 'kitchens' && query.trim().length >= 2 && !searchLoading && searchResults.length === 0;

  const showPeopleEmpty =
    activeTab === 'people' && query.trim().length >= 2 && !peopleLoading && peopleResults.length === 0;

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      {/* Search panel */}
      <View style={styles.panel}>
        {/* Input row */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="magnify"
            size={22}
            color={colors.onSurfaceVariant}
          />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={activeTab === 'kitchens' ? 'Search kitchens...' : 'Search people...'}
            placeholderTextColor={colors.outlineVariant}
            value={query}
            onChangeText={handleChangeText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            testID="kitchen-search-input"
          />
          <Pressable onPress={handleClose} hitSlop={12} testID="kitchen-search-close">
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'kitchens' && styles.tabActive]}
            onPress={() => handleTabChange('kitchens')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'kitchens' }}
          >
            <Text style={[styles.tabText, activeTab === 'kitchens' && styles.tabTextActive]}>Kitchens</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'people' && styles.tabActive]}
            onPress={() => handleTabChange('people')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'people' }}
          >
            <Text style={[styles.tabText, activeTab === 'people' && styles.tabTextActive]}>People</Text>
          </Pressable>
        </View>

        {/* Kitchens tab content */}
        {activeTab === 'kitchens' && (
          <>
            {searchLoading && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            {showEmpty && (
              <View style={styles.statusContainer}>
                <Text style={styles.emptyText}>No kitchens found</Text>
              </View>
            )}

            {searchResults.length > 0 && (
              <FlatList<KitchenProfile>
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <KitchenSearchResult
                    profile={item}
                    onPress={handleResultPress}
                  />
                )}
                keyboardShouldPersistTaps="handled"
                style={styles.resultsList}
              />
            )}
          </>
        )}

        {/* People tab content */}
        {activeTab === 'people' && (
          <>
            <PeopleSearchTab onNavigate={handleClose} />
            {showPeopleEmpty && (
              <View style={styles.statusContainer}>
                <Text style={styles.emptyText}>No people found</Text>
                <Text style={styles.emptySubtext}>Try a different @handle or name</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    maxHeight: '60%',
    ...shadows.float,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  statusContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  emptySubtext: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  resultsList: {
    maxHeight: 300,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.primary,
  },
});
