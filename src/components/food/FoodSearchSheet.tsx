import React, { useRef, useCallback } from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { useFoodStore } from '../../stores/foodStore';
import { FoodResultRow } from './FoodResultRow';
import { FoodSearchResult } from '../../types/food';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface FoodSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FoodSearchSheet({ isOpen, onClose }: FoodSearchSheetProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    query,
    results,
    loading,
    error,
    rateLimited,
    expandedItemId,
    expandedItemDetail,
    detailLoading,
    setQuery,
    searchFoods,
    clearResults,
    toggleExpanded,
    reset,
  } = useFoodStore();

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const trimmed = text.trim();
      if (trimmed.length < 2) {
        clearResults();
        return;
      }

      debounceRef.current = setTimeout(() => {
        searchFoods(trimmed);
      }, 300);
    },
    [setQuery, clearResults, searchFoods]
  );

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const renderItem = useCallback(
    ({ item }: { item: FoodSearchResult }) => (
      <FoodResultRow
        item={item}
        isExpanded={expandedItemId === item.id}
        expandedDetail={expandedItemId === item.id ? expandedItemDetail : null}
        detailLoading={expandedItemId === item.id ? detailLoading : false}
        onToggleExpand={() => toggleExpanded(item.id)}
      />
    ),
    [expandedItemId, expandedItemDetail, detailLoading, toggleExpanded]
  );

  const trimmedQuery = query.trim();
  const showLoading = loading && results.length === 0;
  const showError = error != null;
  const showEmpty =
    trimmedQuery.length >= 2 && !loading && results.length === 0 && !error;
  const showDefault = trimmedQuery.length < 2 && results.length === 0 && !error;

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} snapPoints={['85%']}>
      <View style={styles.container}>
        <Text style={styles.title}>Search Foods</Text>

        <TextInput
          style={styles.input}
          placeholder="Search any food for nutrition info"
          placeholderTextColor={colors.onSurfaceVariant}
          value={query}
          onChangeText={handleChangeText}
          autoFocus={false}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {showLoading && (
          <ActivityIndicator
            color={colors.primary}
            size="large"
            style={styles.centered}
          />
        )}

        {showError && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>
              {rateLimited
                ? 'Daily search limit reached. Upgrade to Premium for unlimited searches.'
                : error}
            </Text>
          </View>
        )}

        {showEmpty && (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              No foods found for &apos;{trimmedQuery}&apos;
            </Text>
          </View>
        )}

        {showDefault && (
          <View style={styles.defaultState}>
            <MaterialCommunityIcons
              name="food-apple-outline"
              size={48}
              color={colors.onSurfaceVariant}
            />
            <Text style={styles.defaultText}>
              Search any food for nutrition info
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <FlashList
            data={results}
            renderItem={renderItem}
            estimatedItemSize={80}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  input: {
    ...typography.bodyMd,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.error,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  defaultState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  defaultText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
