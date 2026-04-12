import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipeForm } from '../../../src/components/recipes/RecipeForm';
import { Button } from '../../../src/components/ui/Button';
import { useRecipeStore } from '../../../src/stores/recipeStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { supabase } from '../../../src/lib/supabase';
import { parseRecipeUrl, VideoRateLimitError, getVideoImportCount } from '../../../src/lib/ai';
import { isVideoUrl } from '../../../src/lib/videoUrl';
import { RecipeInsert } from '../../../src/types/database';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { getErrorMessage } from '../../../src/lib/errors';

const VIDEO_PROGRESS_MESSAGES = [
  'Extracting transcript...',
  'Parsing recipe...',
  'Almost done!',
];
const WEB_PROGRESS_MESSAGES = [
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
  const [videoUsage, setVideoUsage] = useState<{ used: number; limit: number } | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Share intent handling
  const { fromShare } = useLocalSearchParams<{ fromShare?: string }>();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const usage = await getVideoImportCount(user.id);
        setVideoUsage(usage);
      }
    })();
  }, []);

  const startProgress = (isVideo: boolean) => {
    let idx = 0;
    const messages = isVideo ? VIDEO_PROGRESS_MESSAGES : WEB_PROGRESS_MESSAGES;
    setProgressMsg(messages[0]);
    progressInterval.current = setInterval(() => {
      idx = Math.min(idx + 1, messages.length - 1);
      setProgressMsg(messages[idx]);
    }, isVideo ? 3000 : 2000);
  };

  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setProgressMsg('');
  };

  const handleImportUrl = async (url: string) => {
    const urlIsVideo = isVideoUrl(url);
    setImporting(true);
    startProgress(urlIsVideo);
    try {
      const data = await parseRecipeUrl(url);
      setImportedData(data);
      // Refresh usage counter after successful video import
      if (urlIsVideo) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const usage = await getVideoImportCount(user.id);
          setVideoUsage(usage);
        }
      }
    } catch (error: unknown) {
      if (error instanceof VideoRateLimitError) {
        setShowUpgradePrompt(true);
      } else {
        Alert.alert('Import Failed', getErrorMessage(error));
      }
    } finally {
      setImporting(false);
      stopProgress();
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) {
      Alert.alert('Error', 'Please enter a recipe URL.');
      return;
    }
    await handleImportUrl(importUrl.trim());
  };

  // Auto-import when a URL arrives via share sheet
  useEffect(() => {
    if (hasShareIntent && shareIntent?.webUrl) {
      const sharedUrl = shareIntent.webUrl;
      setImportUrl(sharedUrl);
      resetShareIntent();
      // Auto-trigger import after a brief delay for UI to render
      const timer = setTimeout(() => {
        handleImportUrl(sharedUrl);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasShareIntent, shareIntent]);

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
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(app)/(tabs)/recipes');
        }
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
          <Text style={styles.importTitle}>Import from URL (optional)</Text>
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
        {videoUsage && videoUsage.used > 0 && !showUpgradePrompt && (
          <View style={styles.usageRow}>
            <MaterialCommunityIcons name="video-outline" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.usageText}>
              {videoUsage.used} of {videoUsage.limit} video imports used this month
            </Text>
          </View>
        )}
        {showUpgradePrompt && (
          <View style={styles.upgradeCard}>
            <MaterialCommunityIcons name="star-circle" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>Video import limit reached</Text>
              <Text style={styles.upgradeText}>
                Free accounts can import 3 video recipes per month. Upgrade to Premium for unlimited video imports.
              </Text>
            </View>
            <Pressable onPress={() => { setShowUpgradePrompt(false); router.push('/(app)/settings/subscription'); }}>
              <Text style={styles.upgradeButton}>Upgrade</Text>
            </Pressable>
          </View>
        )}
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
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  usageText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  upgradeTitle: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
    marginBottom: 2,
  },
  upgradeText: {
    ...typography.bodySm,
    color: colors.onPrimaryContainer,
  },
  upgradeButton: {
    ...typography.labelLg,
    color: colors.primary,
  },
});
