import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Platform } from 'react-native';
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

import { SearchableSelect, DIETARY_OPTIONS } from '../../../src/components/ui/SearchableSelect';
import { supabase } from '../../../src/lib/supabase';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { TAB_BAR_HEIGHT } from '../../../src/lib/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const subscription = useSubscriptionStore();

  const [signingOut, setSigningOut] = useState(false);
  const [cookingCount, setCookingCount] = useState(0);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [defaultServings, setDefaultServings] = useState(4);

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

  const updateServings = useCallback((delta: number) => {
    setDefaultServings((prev) => {
      const next = Math.max(1, prev + delta);
      AsyncStorage.setItem('default_servings', String(next));
      return next;
    });
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
          <SearchableSelect
            options={DIETARY_OPTIONS}
            selected={dietaryPrefs}
            onSelectionChange={(next) => {
              setDietaryPrefs(next);
              AsyncStorage.setItem('dietary_preferences', JSON.stringify(next));
            }}
            placeholder="Search dietary restrictions..."
            testID="dietary-search"
          />

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
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
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
});
