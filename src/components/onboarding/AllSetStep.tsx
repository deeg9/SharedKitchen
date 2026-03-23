import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useOnboardingStore } from '../../stores/onboardingStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  colors.primary,
  colors.secondary,
  colors.secondaryContainer,
  colors.primaryFixed,
  colors.tertiaryFixedDim,
  '#e8d5b7', // warm cream
];

const CONFETTI_COUNT = 24;

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  isSquare: boolean;
  startX: number;
}

export function AllSetStep() {
  const router = useRouter();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const confettiPieces = useRef<ConfettiPiece[]>([]);

  // Initialize confetti on mount
  useEffect(() => {
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const startX = Math.random() * SCREEN_WIDTH;
      const piece: ConfettiPiece = {
        x: new Animated.Value(startX),
        y: new Animated.Value(-20),
        rotation: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
        isSquare: Math.random() > 0.5,
        startX,
      };
      pieces.push(piece);
    }

    confettiPieces.current = pieces;

    // Animate all pieces
    const animations = pieces.map((piece, i) => {
      const delay = i * 60;
      const duration = 2000 + Math.random() * 1500;
      const drift = (Math.random() - 0.5) * 120;

      return Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 20,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: piece.startX + drift,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: 3 + Math.random() * 5,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.opacity, {
          toValue: 0,
          duration: duration * 0.8,
          delay: delay + duration * 0.5,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  }, []);

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace('/(app)/(tabs)/plan');
  };

  return (
    <View style={styles.container}>
      {/* Confetti layer */}
      {confettiPieces.current.map((piece, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confetti,
            {
              width: piece.size,
              height: piece.isSquare ? piece.size : piece.size * 0.4,
              backgroundColor: piece.color,
              borderRadius: piece.isSquare ? 2 : piece.size,
              opacity: piece.opacity,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 8],
                    outputRange: ['0deg', '2880deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      <View style={styles.content}>
        <View style={styles.checkContainer}>
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons name="check-bold" size={48} color={colors.onPrimary} />
          </View>
        </View>

        <Text style={styles.headline}>You're all set!</Text>
        <Text style={styles.subtitle}>
          Your kitchen is ready. Let's start curating your culinary journey.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.goButton, pressed && styles.pressed]}
          onPress={handleFinish}
        >
          <Text style={styles.goText}>Go to my kitchen</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
        </Pressable>

        <Text style={styles.brandText}>WELCOME TO MISE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  confetti: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkContainer: {
    marginBottom: spacing.xl,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
  },
  headline: {
    ...typography.displayLg,
    color: colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  footer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  goButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    ...shadows.editorial,
  },
  pressed: {
    opacity: 0.85,
  },
  goText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
  brandText: {
    ...typography.labelSm,
    color: colors.outlineVariant,
    letterSpacing: 2,
  },
});
