import React, { useState, useRef, useMemo } from 'react';
import { getErrorMessage } from '../../src/lib/errors';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { HandleInput } from '../../src/components/handle/HandleInput';
import { validateHandle } from '../../src/lib/handle-utils';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, handle, handleChangedAt, updateHandle } = useAuthStore();

  const currentName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.display_name ??
    '';
  const currentAvatar = user?.user_metadata?.avatar_url ?? null;

  const [displayName, setDisplayName] = useState(currentName);
  const [avatarUri, setAvatarUri] = useState<string | null>(currentAvatar);
  const [saving, setSaving] = useState(false);
  const [newAvatarBase64, setNewAvatarBase64] = useState<string | null>(null);

  // Handle editing state
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<{ state: 'idle' | 'checking' | 'available' | 'taken' | 'error'; message: string }>({ state: 'idle', message: '' });
  const [savingHandle, setSavingHandle] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Cooldown computation
  const canChangeHandle = useMemo(() => {
    if (!handleChangedAt) return true;
    const changedDate = new Date(handleChangedAt);
    const cooldownEnd = new Date(changedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    return new Date() >= cooldownEnd;
  }, [handleChangedAt]);

  const daysUntilChange = useMemo(() => {
    if (!handleChangedAt || canChangeHandle) return 0;
    const changedDate = new Date(handleChangedAt);
    const cooldownEnd = new Date(changedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    return Math.ceil((cooldownEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  }, [handleChangedAt, canChangeHandle]);

  const handleHandleChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setNewHandle(cleaned);

    clearTimeout(debounceRef.current);
    const validation = validateHandle(cleaned);
    if (!validation.valid) {
      setHandleStatus({ state: 'error', message: validation.error! });
      return;
    }
    if (cleaned === handle) {
      setHandleStatus({ state: 'error', message: 'This is your current handle' });
      return;
    }

    setHandleStatus({ state: 'checking', message: 'Checking availability...' });
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', cleaned)
        .maybeSingle();

      setHandleStatus(data
        ? { state: 'taken', message: 'This handle is taken' }
        : { state: 'available', message: 'This handle is available' }
      );
    }, 400);
  };

  const handleSaveHandle = async () => {
    if (handleStatus.state !== 'available') return;
    setSavingHandle(true);
    const result = await updateHandle(newHandle);
    setSavingHandle(false);
    if (result.success) {
      setIsEditingHandle(false);
      setNewHandle('');
      setHandleStatus({ state: 'idle', message: '' });
      Alert.alert('Handle Updated', `Your handle is now @${newHandle}`);
    } else {
      setHandleStatus({ state: 'taken', message: result.error ?? 'Failed to update handle' });
    }
  };

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your avatar.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setNewAvatarBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let avatarUrl = currentAvatar;

      // Upload new avatar if selected
      if (newAvatarBase64) {
        const filePath = `${user.id}/avatar.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(newAvatarBase64), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = urlData.publicUrl;
      }

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          avatar_url: avatarUrl,
        },
      });

      if (router.canGoBack()) router.back();
      else router.replace('/(app)/(tabs)/profile');
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Avatar Picker */}
        <Pressable onPress={handlePickAvatar} style={styles.avatarSection}>
          <Avatar uri={avatarUri} name={displayName || 'User'} size="lg" />
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </Pressable>

        {/* Name Input */}
        <Input
          label="Display Name"
          placeholder="Enter your name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />

        {/* Handle Section */}
        <View style={styles.handleSection}>
          <Text style={styles.handleSectionLabel}>Handle</Text>
          <Text style={styles.currentHandle}>@{handle}</Text>

          {canChangeHandle ? (
            isEditingHandle ? (
              <View style={{ marginTop: spacing.sm }}>
                <HandleInput
                  value={newHandle}
                  onChangeText={handleHandleChange}
                  status={handleStatus}
                />
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onPress={() => { setIsEditingHandle(false); setNewHandle(''); setHandleStatus({ state: 'idle', message: '' }); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={handleSaveHandle}
                    disabled={handleStatus.state !== 'available' || savingHandle}
                    loading={savingHandle}
                  >
                    Save Handle
                  </Button>
                </View>
              </View>
            ) : (
              <Button
                variant="tertiary"
                size="sm"
                onPress={() => setIsEditingHandle(true)}
                style={{ marginTop: spacing.sm }}
              >
                Change Handle
              </Button>
            )
          ) : (
            <Text style={styles.cooldownText}>
              You can change your handle in {daysUntilChange} day{daysUntilChange !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Save Button */}
        <Button
          variant="primary"
          size="lg"
          loading={saving}
          disabled={!displayName.trim()}
          onPress={handleSave}
          style={styles.saveButton}
        >
          Save
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cancelText: {
    ...typography.bodyLg,
    color: colors.primary,
  },
  title: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  changePhotoText: {
    ...typography.labelMd,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  handleSection: {
    marginTop: spacing.lg,
  },
  handleSectionLabel: {
    ...typography.labelLg,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  currentHandle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
  cooldownText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});
