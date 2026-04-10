import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface PermissionPromptProps {
  isOpen: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

interface BenefitRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}

function BenefitRow({ icon, text }: BenefitRowProps) {
  return (
    <View style={styles.benefitRow}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={colors.primary}
        style={styles.benefitIcon}
      />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

export function PermissionPrompt({ isOpen, onEnable, onDismiss }: PermissionPromptProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onDismiss} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.handle} />

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={48}
                color={colors.primary}
              />
            </View>

            <Text style={styles.title}>Stay on top of dinner plans</Text>

            <View style={styles.benefits}>
              <BenefitRow
                icon="clock-outline"
                text="Get cooking reminders so dinner is ready on time"
              />
              <BenefitRow
                icon="food-apple-outline"
                text="Know when leftovers need to be used before they expire"
              />
              <BenefitRow
                icon="wallet-outline"
                text="Budget alerts when spending hits 80% or 100%"
              />
            </View>

            <Pressable style={styles.enableButton} onPress={onEnable}>
              <Text style={styles.enableButtonText}>Enable Notifications</Text>
            </Pressable>

            <Pressable style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissButtonText}>Not Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: '#FFFDF7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 20,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f5f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  benefits: {
    width: '100%',
    gap: 14,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    marginRight: 12,
    width: 24,
  },
  benefitText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#4a5d4e',
    flex: 1,
    lineHeight: 21,
  },
  enableButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  enableButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#9ca3af',
  },
});
