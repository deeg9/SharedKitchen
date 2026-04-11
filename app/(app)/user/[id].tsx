import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../src/lib/supabase';
import { Avatar } from '../../../src/components/ui/Avatar';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { getDefaultRecipeImage } from '../../../src/lib/images';

interface ProfileData {
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface RecipeItem {
  id: string;
  name: string;
  image_url: string | null;
  category?: string | null;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('handle, display_name, avatar_url')
          .eq('id', id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (!profileData) {
          setError('Profile not found');
          setLoading(false);
          return;
        }
        setProfile(profileData);

        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select('id, name, image_url, category')
          .eq('created_by', id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (recipeError) throw recipeError;
        setRecipes(recipeData ?? []);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/plan' as any);
    }
  };

  const renderRecipeCard = ({ item }: { item: RecipeItem }) => (
    <View style={styles.recipeCard}>
      <Image
        source={{ uri: item.image_url || getDefaultRecipeImage(item.id, item.category) }}
        style={styles.recipeImage}
      />
      <Text style={styles.recipeName} numberOfLines={2}>{item.name}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Pressable style={[styles.headerBtn, { top: insets.top + spacing.sm }]} onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn't load this profile.</Text>
          <Text style={styles.errorSubtext}>Check your connection and try again.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              // Re-trigger by toggling loading
              const reload = async () => {
                try {
                  const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('handle, display_name, avatar_url')
                    .eq('id', id)
                    .maybeSingle();
                  if (profileError) throw profileError;
                  if (!profileData) {
                    setError('Profile not found');
                    setLoading(false);
                    return;
                  }
                  setProfile(profileData);
                  const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('id, name, image_url, category')
                    .eq('created_by', id)
                    .order('created_at', { ascending: false })
                    .limit(50);
                  if (recipeError) throw recipeError;
                  setRecipes(recipeData ?? []);
                } catch (err: any) {
                  setError(err.message ?? 'Failed to load profile');
                } finally {
                  setLoading(false);
                }
              };
              reload();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Back button */}
      <Pressable style={[styles.headerBtn, { top: insets.top + spacing.sm }]} onPress={handleBack}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Avatar uri={profile?.avatar_url} name={profile?.handle ?? '?'} size="lg" />
        <Text style={styles.handle}>@{profile?.handle}</Text>
        {profile?.display_name && (
          <Text style={styles.displayName}>{profile.display_name}</Text>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Recipes heading */}
      <Text style={styles.sectionTitle}>Recipes</Text>

      {/* Recipe grid or empty state */}
      {recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptySubtext}>This person hasn't created any recipes</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipeCard}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  headerBtn: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingTop: spacing.xl + 20,
    backgroundColor: colors.surfaceContainer,
  },
  handle: {
    ...typography.titleMd,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  displayName: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  sectionTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  gridContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  gridRow: {
    gap: spacing.xs * 2,
  },
  recipeCard: {
    flex: 1,
    margin: spacing.xs,
  },
  recipeImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHigh,
  },
  recipeName: {
    ...typography.labelLg,
    color: colors.onSurface,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  emptySubtext: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorText: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  errorSubtext: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  retryText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});
