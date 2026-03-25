import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { Ingredient } from '../../types/database';
import { UnitSystem, convertIngredient } from '../../lib/unit-conversion';
import { scaleIngredients } from '../../stores/recipeStore';

const SIDEBAR_WIDTH = 240;

interface IngredientSidebarProps {
  ingredients: Ingredient[];
  scale: number;
  unitSystem: UnitSystem;
  visible: boolean;
  onClose: () => void;
}

export function IngredientSidebar({
  ingredients,
  scale,
  unitSystem,
  visible,
  onClose,
}: IngredientSidebarProps) {
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -SIDEBAR_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const scaled = scaleIngredients(ingredients, scale);
  const displayIngredients = unitSystem !== 'imperial'
    ? scaled.map((ing) => convertIngredient(ing, unitSystem))
    : scaled;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[s.overlay, { opacity: overlayOpacity }]} />
      </Pressable>

      {/* Sidebar panel */}
      <Animated.View style={[s.panel, { transform: [{ translateX }] }]}>
        <Text style={s.title}>Ingredients</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {displayIngredients.map((ing, i) => {
            const amountStr = ing.amount > 0 ? `${ing.amount}` : '';
            return (
              <View key={i} style={s.ingredientRow}>
                <Text style={s.ingredientAmount}>
                  {amountStr} {ing.unit}
                </Text>
                <Text style={s.ingredientName}>{ing.name}</Text>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.inverseSurface,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 24,
    fontWeight: '700',
    color: colors.inverseOnSurface,
    marginBottom: spacing.lg,
  },
  ingredientRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  ingredientAmount: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.outlineVariant,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.inverseOnSurface,
    marginTop: 2,
  },
});
