import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SubscriptionSheet } from '../../src/components/premium/SubscriptionSheet';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';

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
        <Pressable onPress={() => router.back()} style={styles.backButton} testID="subscription-back-button">
          <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isPremium() ? (
          /* Premium hero -- existing crown view */
          <View style={styles.premiumHero}>
            <MaterialCommunityIcons name="crown" size={48} color={colors.secondary} />
            <Text style={styles.premiumHeroTitle}>You're on Premium!</Text>
            <Text style={styles.premiumHeroSubtitle}>
              Enjoy all the exclusive features of your premium membership.
            </Text>
          </View>
        ) : (
          /* Free user editorial hero */
          <>
            {/* Hero Kitchen Photo */}
            <View style={styles.heroImageContainer}>
              <Image
                source={require('../../assets/food-images/heroes/kitchen-cooking.jpg')}
                style={styles.heroImage}
                contentFit="cover"
                transition={300}
              />
            </View>

            {/* "LEVEL UP YOUR KITCHEN" badge */}
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>LEVEL UP YOUR KITCHEN</Text>
            </View>

            {/* Editorial headline */}
            <Text style={styles.editorialHeadline}>
              Unlock your kitchen's{' '}
              <Text style={styles.italicText}>full potential.</Text>
            </Text>

            {/* Subtitle */}
            <Text style={styles.editorialSubtitle}>
              Get organized, save money, and cook together seamlessly with SharedKitchen Premium. The ultimate toolkit for the intentional chef.
            </Text>
          </>
        )}

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
    paddingBottom: spacing.xxl,
  },
  // Premium hero (existing view for premium users)
  premiumHero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  premiumHeroTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  premiumHeroSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  // Free user editorial hero
  heroImageContainer: {
    height: 240,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
    ...shadows.editorial,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  badgePill: {
    backgroundColor: colors.primaryFixed,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    marginLeft: spacing.lg,
    marginTop: spacing.lg,
  },
  badgeText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  editorialHeadline: {
    ...typography.displayLg,
    color: colors.onSurface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  italicText: {
    fontStyle: 'italic',
  },
  editorialSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
});
