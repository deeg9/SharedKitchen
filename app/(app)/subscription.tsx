import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SubscriptionSheet } from '../../src/components/premium/SubscriptionSheet';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { status, loading } = useSubscriptionStore();
  const isPremium = useSubscriptionStore((s) => s.isPremium);

  // Refresh subscription status on screen focus
  useFocusEffect(
    useCallback(() => {
      useSubscriptionStore.getState().refreshSubscription();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          {isPremium() ? (
            <>
              <MaterialCommunityIcons name="crown" size={48} color={colors.secondary} />
              <Text style={styles.heroTitle}>You're on Premium!</Text>
              <Text style={styles.heroSubtitle}>
                Enjoy all the exclusive features of your premium membership.
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="star-four-points" size={48} color={colors.secondary} />
              <Text style={styles.heroTitle}>Upgrade Your Kitchen</Text>
              <Text style={styles.heroSubtitle}>
                Unlock advanced analytics, AI suggestions, and more.
              </Text>
            </>
          )}
        </View>

        {/* Subscription Content */}
        <SubscriptionSheet />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
});
