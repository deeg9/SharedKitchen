import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipeForm } from '../../../src/components/recipes/RecipeForm';
import { Button } from '../../../src/components/ui/Button';
import { useRecipeStore } from '../../../src/stores/recipeStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { supabase } from '../../../src/lib/supabase';
import { parseRecipeUrl } from '../../../src/lib/ai';
import { RecipeInsert } from '../../../src/types/database';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { getErrorMessage } from '../../../src/lib/errors';

const PROGRESS_MESSAGES = [
  'Fetching recipe...',
  'Parsing ingredients...',
  'Extracting instructions...',
  'Almost done...',
];

export default function AddRecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createRecipe } = useRecipeStore();
  const { activeHouseholdId } = useHouseholdStore();
  const [loading, setLoading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [importedData, setImportedData] = useState<Omit<RecipeInsert, 'household_id' | 'created_by'> | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    let idx = 0;
    setProgressMsg(PROGRESS_MESSAGES[0]);
    progressInterval.current = setInterval(() => {
      idx = Math.min(idx + 1, PROGRESS_MESSAGES.length - 1);
      setProgressMsg(PROGRESS_MESSAGES[idx]);
    }, 2000);
  };

  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setProgressMsg('');
  };

  const handleImport = async () => {
    if (!importUrl.trim()) {
      Alert.alert('Error', 'Please enter a recipe URL.');
      return;
    }

    setImporting(true);
    startProgress();
    try {
      const data = await parseRecipeUrl(importUrl.trim());
      setImportedData(data);
    } catch (error: unknown) {
      Alert.alert('Import Failed', getErrorMessage(error));
    } finally {
      setImporting(false);
      stopProgress();
    }
  };

  const handleSubmit = async (
    recipeData: Omit<RecipeInsert, 'household_id' | 'created_by'>,
    imageUri?: string
  ) => {
    if (!activeHouseholdId) {
      Alert.alert('Error', 'No active household selected.');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be signed in to add a recipe.');
        setLoading(false);
        return;
      }

      let imageUrl: string | null = null;

      // Upload image if provided
      if (imageUri) {
        const fileName = `${activeHouseholdId}/${Date.now()}.jpg`;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue without image rather than blocking recipe creation
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from('recipe-images').getPublicUrl(uploadData.path);
          imageUrl = publicUrl;
        }
      }

      const recipe: RecipeInsert = {
        ...recipeData,
        household_id: activeHouseholdId,
        created_by: user.id,
        image_url: imageUrl,
      };

      const created = await createRecipe(recipe);

      if (created) {
        router.back();
      } else {
        Alert.alert('Error', 'Failed to create recipe. Please try again.');
      }
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/recipes')} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Recipe</Text>
        <View style={styles.backButton} />
      </View>

      {/* Import from URL Section */}
      <View style={styles.importSection}>
        <View style={styles.importHeader}>
          <MaterialCommunityIcons name="link-variant" size={20} color={colors.primary} />
          <Text style={styles.importTitle}>Import from URL</Text>
        </View>
        <View style={styles.importRow}>
          <TextInput
            style={styles.urlInput}
            placeholder="Paste recipe URL..."
            placeholderTextColor={colors.outlineVariant}
            value={importUrl}
            onChangeText={setImportUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!importing}
            testID="recipe-import-url-input"
          />
          <Button
            variant="secondary"
            size="sm"
            onPress={handleImport}
            loading={importing}
            disabled={importing}
            testID="recipe-import-button"
          >
            Import
          </Button>
        </View>
        {importing && progressMsg ? (
          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progressText}>{progressMsg}</Text>
          </View>
        ) : null}
      </View>

      <RecipeForm
        onSubmit={handleSubmit}
        loading={loading}
        initialData={importedData ?? undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.titleLg,
    color: colors.primary,
    fontWeight: '600',
  },
  importSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  importTitle: {
    ...typography.labelLg,
    color: colors.primary,
  },
  importRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  progressText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
