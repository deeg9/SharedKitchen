import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter, Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/stores/authStore';
import { useHouseholdStore, HouseholdMemberWithProfile } from '../../../src/stores/householdStore';
import { usePlanStore } from '../../../src/stores/planStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { PremiumBadge } from '../../../src/components/premium/PremiumBadge';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { BottomSheet } from '../../../src/components/ui/BottomSheet';
import { useColorScheme } from '../../../src/lib/color-scheme';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { TAB_BAR_HEIGHT } from '../../../src/lib/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestPermission, NotificationSettings } from '../../../src/lib/notifications';

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Nut-Free',
  'Vegan',
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuthStore();
  const {
    households,
    activeHouseholdId,
    members,
    loading: householdLoading,
    activeHousehold,
    setActiveHousehold,
    initialize,
  } = useHouseholdStore();

  const { mealPlan } = usePlanStore();
  const { isDark, toggleColorScheme } = useColorScheme();
  const subscription = useSubscriptionStore();

  const [showHouseholdPicker, setShowHouseholdPicker] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [cookingCount, setCookingCount] = useState(0);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [defaultServings, setDefaultServings] = useState(4);
  const [showNotifications, setShowNotifications] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    cookingReminders: true,
    leftoverAlerts: true,
    budgetWarnings: true,
    householdActivity: true,
  });

  useEffect(() => {
    initialize();
    subscription.initialize();

    // Load dietary preferences
    AsyncStorage.getItem('dietary_preferences').then((val) => {
      if (val) setDietaryPrefs(JSON.parse(val));
    });

    // Load default servings
    AsyncStorage.getItem('default_servings').then((val) => {
      if (val) setDefaultServings(parseInt(val, 10));
    });

    // Load notification settings
    AsyncStorage.getItem('notification_settings').then((val) => {
      if (val) setNotifSettings(JSON.parse(val));
    });

    // Check notification permission status
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermissionGranted(status === 'granted');
    });
  }, []);

  // Compute cooking count from meal plan data
  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let count = 0;
    mealPlan.forEach((entry) => {
      const date = new Date(entry.plan_date + 'T00:00:00');
      if (date >= monthStart && date <= now) count++;
    });
    setCookingCount(count);
  }, [mealPlan]);

  const toggleDietaryPref = useCallback(
    (pref: string) => {
      setDietaryPrefs((prev) => {
        const next = prev.includes(pref)
          ? prev.filter((p) => p !== pref)
          : [...prev, pref];
        AsyncStorage.setItem('dietary_preferences', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateServings = useCallback((delta: number) => {
    setDefaultServings((prev) => {
      const next = Math.max(1, prev + delta);
      AsyncStorage.setItem('default_servings', String(next));
      return next;
    });
  }, []);

  const updateNotifSetting = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      if (value && !permissionGranted) {
        const granted = await requestPermission();
        setPermissionGranted(granted);
        if (!granted) {
          Alert.alert(
            'Notifications Disabled',
            'Please enable notifications in your device Settings to receive alerts.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      const next = { ...notifSettings, [key]: value };
      setNotifSettings(next);
      AsyncStorage.setItem('notification_settings', JSON.stringify(next));
    },
    [notifSettings, permissionGranted]
  );

  const currentHousehold = activeHousehold();
  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.display_name ?? 'User';
  const email = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  const handleSwitchHousehold = async (id: string) => {
    await setActiveHousehold(id);
    setShowHouseholdPicker(false);
  };

  const isLoading = authLoading || householdLoading;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: TAB_BAR_HEIGHT + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          {isLoading ? (
            <>
              <Skeleton.Circle size={64} />
              <Skeleton.Text width={160} style={{ marginTop: spacing.md }} />
              <Skeleton.Text width={200} style={{ marginTop: spacing.sm }} />
            </>
          ) : (
            <>
              <Avatar uri={avatarUrl} name={displayName} size="lg" />
              <View style={styles.nameRow}>
                <Text style={styles.displayName}>{displayName}</Text>
                <PremiumBadge size="large" />
              </View>
              <Text style={styles.email}>{email}</Text>
            </>
          )}

          <Button
            variant="tertiary"
            size="sm"
            onPress={() => router.push('/(app)/edit-profile')}
            style={{ marginTop: spacing.md }}
            testID="profile-edit-button"
          >
            Edit Profile
          </Button>
        </View>

        {/* Household Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household</Text>

          {isLoading ? (
            <Skeleton.Card />
          ) : currentHousehold ? (
            <Card variant="elevated" style={styles.householdCard}>
              <Pressable
                onPress={() =>
                  households.length > 1 && setShowHouseholdPicker(true)
                }
                style={styles.householdHeader}
              >
                <Text style={styles.householdName}>
                  {currentHousehold.name}
                </Text>
                {households.length > 1 && (
                  <Text style={styles.switchText}>Switch</Text>
                )}
              </Pressable>

              {/* Inline Member List - TODO: Replace with MemberList component from Plan 02 when available */}
              <View style={styles.membersSection}>
                <Text style={styles.membersTitle}>Members</Text>
                {members.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <Avatar
                      uri={member.profiles?.avatar_url}
                      name={member.profiles?.display_name ?? 'Member'}
                      size="sm"
                    />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {member.profiles?.display_name ?? 'Unknown'}
                      </Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Button
                variant="tertiary"
                size="sm"
                onPress={() => router.push('/(app)/household/invite' as Href)}
                style={{ marginTop: spacing.sm }}
              >
                Invite Members
              </Button>
            </Card>
          ) : (
            <Card variant="filled" style={styles.noHouseholdCard}>
              <Text style={styles.noHouseholdText}>
                You are not part of any household yet.
              </Text>
              <Button
                variant="primary"
                size="md"
                onPress={() => router.push('/(app)/household/create' as Href)}
                style={{ marginTop: spacing.md }}
              >
                Create a Household
              </Button>
            </Card>
          )}
        </View>

        {/* Cooking Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking Stats</Text>
          <Card variant="filled">
            <View style={styles.statsRow}>
              <MaterialCommunityIcons name="chef-hat" size={24} color={colors.primary} />
              <Text style={styles.statsText}>
                You've cooked {cookingCount} {cookingCount === 1 ? 'time' : 'times'} this month
              </Text>
            </View>
          </Card>
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <Pressable onPress={() => router.push('/(app)/subscription' as Href)} testID="profile-subscription-link">
            <Card variant="filled" style={styles.subscriptionCard}>
              <View style={styles.subscriptionRow}>
                <MaterialCommunityIcons
                  name={subscription.isPremium() ? 'crown' : 'star-outline'}
                  size={22}
                  color={subscription.isPremium() ? colors.secondary : colors.onSurfaceVariant}
                />
                <Text style={styles.subscriptionLabel}>
                  {subscription.isPremium() ? 'Premium' : 'Free Plan'}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Dietary Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          <View style={styles.chipRow}>
            {DIETARY_OPTIONS.map((opt) => {
              const selected = dietaryPrefs.includes(opt);
              return (
                <Pressable
                  key={opt}
                  style={[styles.dietChip, selected && styles.dietChipSelected]}
                  onPress={() => toggleDietaryPref(opt)}
                >
                  <Text style={[styles.dietChipText, selected && styles.dietChipTextSelected]}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.servingsRow}>
            <Text style={styles.servingsLabel}>Default Servings</Text>
            <View style={styles.servingsStepper}>
              <Pressable
                style={styles.servingsButton}
                onPress={() => updateServings(-1)}
              >
                <MaterialCommunityIcons name="minus" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
              <Text style={styles.servingsCount}>{defaultServings}</Text>
              <Pressable
                style={styles.servingsButton}
                onPress={() => updateServings(1)}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="weather-night" size={20} color={colors.onSurface} />
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleColorScheme}
              trackColor={{ false: colors.outlineVariant, true: colors.primary }}
              thumbColor={colors.surfaceContainerLowest}
            />
          </View>

          <Pressable
            style={styles.settingRow}
            onPress={() => setShowNotifications(true)}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.onSurface} />
            <Text style={[styles.settingLabel, { flex: 1 }]}>Notification Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </Pressable>

          <Pressable
            style={styles.settingRow}
            onPress={() => router.push('/(app)/leftovers' as Href)}
          >
            <MaterialCommunityIcons name="food-variant" size={20} color={colors.onSurface} />
            <Text style={[styles.settingLabel, { flex: 1 }]}>Manage Leftovers</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </Pressable>

          <Pressable style={styles.settingRow}>
            <MaterialCommunityIcons name="download-outline" size={20} color={colors.onSurface} />
            <Text style={[styles.settingLabel, { flex: 1 }]}>Data Export</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Button
            variant="ghost"
            size="md"
            loading={signingOut}
            onPress={handleSignOut}
            style={styles.signOutButton}
            testID="profile-sign-out-button"
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </Button>
        </View>
      </ScrollView>

      {/* Household Picker Bottom Sheet */}
      <BottomSheet
        isOpen={showHouseholdPicker}
        onClose={() => setShowHouseholdPicker(false)}
        snapPoints={['40%']}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Switch Household</Text>
          {households.map((h) => (
            <Pressable
              key={h.id}
              style={[
                styles.householdOption,
                h.id === activeHouseholdId && styles.activeHouseholdOption,
              ]}
              onPress={() => handleSwitchHousehold(h.id)}
            >
              <Text
                style={[
                  styles.householdOptionText,
                  h.id === activeHouseholdId && styles.activeHouseholdOptionText,
                ]}
              >
                {h.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* Notification Settings Bottom Sheet */}
      <BottomSheet
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        snapPoints={['50%']}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Notification Settings</Text>

          <View style={styles.notifRow}>
            <Text style={styles.notifLabel}>Cooking Reminders</Text>
            <Switch
              value={notifSettings.cookingReminders}
              onValueChange={(v) => updateNotifSetting('cookingReminders', v)}
              trackColor={{ false: colors.outlineVariant, true: colors.primary }}
              thumbColor={colors.surfaceContainerLowest}
            />
          </View>

          <View style={styles.notifRow}>
            <Text style={styles.notifLabel}>Leftover Alerts</Text>
            <Switch
              value={notifSettings.leftoverAlerts}
              onValueChange={(v) => updateNotifSetting('leftoverAlerts', v)}
              trackColor={{ false: colors.outlineVariant, true: colors.primary }}
              thumbColor={colors.surfaceContainerLowest}
            />
          </View>

          <View style={styles.notifRow}>
            <Text style={styles.notifLabel}>Budget Warnings</Text>
            <Switch
              value={notifSettings.budgetWarnings}
              onValueChange={(v) => updateNotifSetting('budgetWarnings', v)}
              trackColor={{ false: colors.outlineVariant, true: colors.primary }}
              thumbColor={colors.surfaceContainerLowest}
            />
          </View>

          <View style={styles.notifRow}>
            <Text style={styles.notifLabel}>Household Activity</Text>
            <Switch
              value={notifSettings.householdActivity}
              onValueChange={(v) => updateNotifSetting('householdActivity', v)}
              trackColor={{ false: colors.outlineVariant, true: colors.primary }}
              thumbColor={colors.surfaceContainerLowest}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
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
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  displayName: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  email: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  householdCard: {
    // No extra styles needed beyond Card defaults
  },
  householdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  householdName: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  switchText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  membersSection: {
    marginBottom: spacing.sm,
  },
  membersTitle: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  memberInfo: {
    marginLeft: spacing.sm,
  },
  memberName: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  memberRole: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  noHouseholdCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noHouseholdText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  signOutSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  signOutButton: {
    // Ghost button styling handled by Button component
  },
  signOutText: {
    ...typography.labelLg,
    color: colors.error,
  },
  sheetContent: {
    padding: spacing.lg,
  },
  sheetTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  householdOption: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  activeHouseholdOption: {
    backgroundColor: colors.primaryFixed,
  },
  householdOptionText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  activeHouseholdOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  subscriptionCard: {
    // Card defaults are sufficient
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  subscriptionLabel: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statsText: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dietChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  dietChipSelected: {
    backgroundColor: colors.primary,
  },
  dietChipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  dietChipTextSelected: {
    color: colors.onPrimary,
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  servingsLabel: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  servingsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsCount: {
    ...typography.labelLg,
    color: colors.onSurface,
    minWidth: 20,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  settingLabel: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  notifLabel: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
});
