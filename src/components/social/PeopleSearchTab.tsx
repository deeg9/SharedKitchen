import React from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Keyboard } from 'react-native';
import { useSocialStore } from '../../stores/socialStore';
import { UserSearchResult } from './UserSearchResult';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface PeopleSearchTabProps {
  onNavigate: () => void;
}

export function PeopleSearchTab({ onNavigate }: PeopleSearchTabProps) {
  const router = useRouter();
  const { peopleResults, peopleLoading, clearPeopleSearch } = useSocialStore();

  const handleResultPress = (userId: string) => {
    Keyboard.dismiss();
    clearPeopleSearch();
    onNavigate();
    router.push(`/user/${userId}` as any);
  };

  if (peopleLoading) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (peopleResults.length === 0) {
    return null;
  }

  return (
    <FlatList
      data={peopleResults}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <UserSearchResult
          id={item.id}
          handle={item.handle}
          displayName={item.display_name}
          avatarUrl={item.avatar_url}
          onPress={handleResultPress}
        />
      )}
      keyboardShouldPersistTaps="handled"
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  list: {
    maxHeight: 400,
  },
});
