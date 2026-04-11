import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Platform, Switch } from 'react-native';
import { useRouter, Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/stores/authStore';
import { useHouseholdStore, HouseholdMemberWithProfile } from '../../../src/stores/householdStore';
import { usePlanStore, CookingStats } from '../../../src/stores/planStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { PremiumBadge } from '../../../src/components/premium/PremiumBadge';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { CookingInsights } from '../../../src/components/profile/CookingInsights';
import { HouseholdDistribution } from '../../../src/components/profile/HouseholdDistribution';
import { SettingsSection } from '../../../src/components/profile/SettingsSection';

import { SearchableSelect, DIETARY_OPTIONS } from '../../../src/components/ui/SearchableSelect';
import SocialNotificationToggle from '../../../src/components/social/SocialNotificationToggle';
import { supabase } from '../../../src/lib/supabase';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { TAB_BAR_HEIGHT } from '../../../src/lib/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MEMBER_COLORS = [colors.primary, colors.secondary, '#A0A0A0'];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, loading: authLoading, handle } = useAuthStore();
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
  const subscription = useSubscriptionStore();

  const [signingOut, setSigningOut] = useState(false);
  const [cookingStats, setCookingStats] = useState<CookingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [defaultServings, setDefaultServings] = useState(4);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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

    // Load dark mode preference
    AsyncStorage.getItem('dark_mode').then((val) => {
      if (val === 'true') setDarkModeEnabled(true);
    });
  }, []);

  // Fetch cooking stats when household changes
  useEffect(() => {
    if (activeHouseholdId) {
      setStatsLoading(true);
      usePlanStore
        .getState()
        .fetchCookingStats(activeHouseholdId)
        .then((stats) => {
          setCookingStats(stats);
          setStatsLoading(false);
        })
        .catch(() => setStatsLoading(false));
    }
  }, [activeHouseholdId]);

  const updateServings = useCallback((delta: number) => {
    setDefaultServings((prev) => {
      const next = Math.max(1, prev + delta);
      AsyncStorage.setItem('default_servings', String(next));
      return next;
    });
  }, []);

  const handleDarkModeToggle = useCallback((value: boolean) => {
    setDarkModeEnabled(value);
    AsyncStorage.setItem('dark_mode', String(value));
  }, []);

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
  };

  const handleEditHouseholdName = () => {
    if (!currentHousehold || !activeHouseholdId) return;
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Edit Household Name',
        'Enter a new name for your household',
        async (newName) => {
          if (newName && newName.trim()) {
            await supabase
              .from('households')
              .update({ name: newName.trim() })
              .eq('id', activeHouseholdId);
            initialize();
          }
        },
        'plain-text',
        currentHousehold.name
      );
    } else {
      Alert.alert('Edit Household Name', 'This feature is available on iOS. Android support coming soon.');
    }
  };

  const handleServingsPress = () => {
    Alert.alert(
      'Default Servings',
      `Current: ${defaultServings} People`,
      [
        { text: '-', onPress: () => updateServings(-1) },
        { text: '+', onPress: () => updateServings(1) },
        { text: 'Done', style: 'cancel' },
      ]
    );
  };

  const handleDietaryPress = () => {
    // Navigate to dietary detail or show inline
    Alert.alert(
      'Dietary Restrictions',
      'Manage your dietary preferences in the section below.',
      [{ text: 'OK' }]
    );
  };

  const handleNotificationsPress = () => {
    Alert.alert(
      'Notification Settings',
      'Toggle social notifications for your feed activity.',
      [{ text: 'OK' }]
    );
  };

  // Compute household distribution data from mealPlan
  const householdDistributionData = React.useMemo(() => {
    const memberCounts = new Map<string, number>();
    mealPlan.forEach((entry) => {
      const creator = entry.created_by;
      if (creator) {
        memberCounts.set(creator, (memberCounts.get(creator) ?? 0) + 1);
      }
    });

    return members
      .map((member, index) => ({
        id: member.id,
        displayName: member.profiles?.display_name ?? 'Member',
        count: memberCounts.get(member.profiles?.id ?? member.id) ?? 0,
        color: MEMBER_COLORS[index % MEMBER_COLORS.length],
      }))
      .filter((m) => m.count > 0);
  }, [mealPlan, members]);

  const isLoading = authLoading || householdLoading;

  // Settings rows
  const preferencesRows = [
    {
      icon: 'food-variant',
      label: 'Dietary Restrictions',
      onPress: handleDietaryPress,
    },
    {
      icon: 'account-group',
      label: 'Default Servings',
      value: `${defaultServings} People`,
      onPress: handleServingsPress,
    },
    {
      icon: 'bell-outline',
      label: 'Notification Settings',
      onPress: handleNotificationsPress,
    },
  ];

  const accountRows = [
    {
      icon: 'shield-crown-outline',
      label: 'Manage Subscription',
      onPress: () => router.push('/(app)/subscription' as Href),
    },
    {
      icon: 'moon-waning-crescent',
      label: 'Dark Mode',
      toggle: {
        value: darkModeEnabled,
        onToggle: handleDarkModeToggle,
      },
    },
    {
      icon: 'download',
      label: 'Data Export',
      onPress: () =>
        Alert.alert('Coming Soon', 'Data export will be available in a future update.'),
    },
  ];

  return (
    <View style={styles.screen} testID="profile-screen">
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
              {handle && (
                <Text style={styles.handle}>@{handle}</Text>
              )}
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

        {/* Your Kitchens Section */}
        <View style={[styles.section, { zIndex: 0 }]}>
          <Text style={styles.sectionTitle}>Your Kitchens</Text>

          {isLoading ? (
            <Skeleton.Card />
          ) : households.length > 0 ? (
            <Card variant="elevated" style={styles.householdCard}>
              {/* Kitchen List */}
              <View style={styles.kitchenList}>
                {households.map((h, index) => {
                  const isActive = h.id === activeHouseholdId;
                  return (
                    <Pressable
                      key={h.id}
                      style={[
                        styles.kitchenRow,
                        isActive && styles.kitchenRowActive,
                        index < households.length - 1 && styles.kitchenRowBorder,
                      ]}
                      onPress={() => !isActive && handleSwitchHousehold(h.id)}
                      testID={`kitchen-row-${h.id}`}
                    >
                      <Text style={[
                        styles.kitchenRowText,
                        isActive && styles.kitchenRowTextActive,
                      ]}>
                        {h.name}
                      </Text>
                      {isActive && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Active Kitchen Details */}
              {currentHousehold && (
                <>
                  <View style={styles.activeKitchenHeader}>
                    <View style={styles.householdHeaderLeft}>
                      <Text style={styles.householdName}>
                        {currentHousehold.name}
                      </Text>
                      <Text style={styles.memberCountBadge}>
                        {members.length} {members.length === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={handleEditHouseholdName}
                      hitSlop={8}
                      testID="household-edit-name"
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={20}
                        color={colors.onSurfaceVariant}
                      />
                    </Pressable>
                  </View>

                  {/* Members List */}
                  <View style={styles.membersSection}>
                    <View style={styles.membersTitleRow}>
                      <Text style={styles.membersTitle}>Members</Text>
                    </View>
                    {members.map((member, index) => (
                      <View
                        key={member.id}
                        style={[
                          styles.memberRow,
                          index < members.length - 1 && styles.memberRowBorder,
                        ]}
                      >
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

                  {/* Invite Action */}
                  <Pressable
                    style={styles.inviteRow}
                    onPress={() => router.push('/(app)/household/invite' as Href)}
                  >
                    <MaterialCommunityIcons
                      name="account-plus-outline"
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={styles.inviteText}>Invite Members</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>
                </>
              )}

              {/* Create & Join Kitchen Actions */}
              <Pressable
                style={styles.actionRow}
                onPress={() => router.push('/(app)/household/create' as Href)}
                testID="kitchen-create-button"
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.actionRowText}>Create Kitchen</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
              <Pressable
                style={[styles.actionRow, { borderTopWidth: 0 }]}
                onPress={() => router.push('/(app)/household/join' as Href)}
                testID="kitchen-join-button"
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.actionRowText}>Join Kitchen</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
            </Card>
          ) : (
            <Card variant="filled" style={styles.noHouseholdCard}>
              <MaterialCommunityIcons
                name="home-plus-outline"
                size={48}
                color={colors.onSurfaceVariant}
              />
              <Text style={styles.noHouseholdText}>
                You are not part of any kitchen yet.
              </Text>
              <Pressable
                style={styles.actionRow}
                onPress={() => router.push('/(app)/household/create' as Href)}
                testID="kitchen-create-button"
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.actionRowText}>Create Kitchen</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
              <Pressable
                style={[styles.actionRow, { borderTopWidth: 0 }]}
                onPress={() => router.push('/(app)/household/join' as Href)}
                testID="kitchen-join-button"
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.actionRowText}>Join Kitchen</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
            </Card>
          )}
        </View>

        {/* Cooking Insights */}
        <CookingInsights stats={cookingStats} loading={statsLoading} />

        {/* Household Distribution */}
        <HouseholdDistribution members={householdDistributionData} />

        {/* Preferences */}
        <SettingsSection title="PREFERENCES" rows={preferencesRows} />

        {/* Account & Subscription */}
        <SettingsSection title="ACCOUNT & SUBSCRIPTION" rows={accountRows} />

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          testID="profile-sign-out-button"
          style={styles.signOutSection}
        >
          <Text style={styles.signOutText}>
            {signingOut ? 'Signing Out...' : 'SIGN OUT'}
          </Text>
        </Pressable>

        {/* Version */}
        <Text style={styles.versionText}>SharedKitchen v7.0</Text>
      </ScrollView>
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
  handle: {
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
  kitchenList: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: spacing.xs,
  },
  kitchenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  kitchenRowActive: {
    backgroundColor: colors.primaryFixed,
  },
  kitchenRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant,
  },
  kitchenRowText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  kitchenRowTextActive: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  activeKitchenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  householdHeaderLeft: {
    flex: 1,
  },
  householdName: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  memberCountBadge: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  membersSection: {
    marginBottom: 0,
  },
  membersTitleRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  membersTitle: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  memberRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant,
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
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    marginTop: spacing.sm,
  },
  inviteText: {
    ...typography.bodyLg,
    color: colors.primary,
    flex: 1,
  },
  noHouseholdCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noHouseholdText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    marginTop: spacing.sm,
    width: '100%',
  },
  actionRowText: {
    ...typography.bodyLg,
    color: colors.primary,
    flex: 1,
  },
  signOutSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  signOutText: {
    ...typography.labelLg,
    color: colors.error,
    textAlign: 'center',
  },
  versionText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
