import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface ActionMenuItem {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  items: ActionMenuItem[];
  title?: string;
}

export function ActionMenu({ visible, onClose, items, title }: ActionMenuProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View
          style={[styles.menu, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        >
          <View style={styles.handle} />

          {title != null && <Text style={styles.title}>{title}</Text>}

          {items.map((item) => (
            <Pressable
              key={item.label}
              style={styles.item}
              onPress={item.onPress}
            >
              {item.icon != null && (
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={22}
                  color={item.destructive ? colors.error : colors.onSurface}
                />
              )}
              <Text
                style={[
                  styles.itemText,
                  item.destructive && styles.itemTextDestructive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}

          <View style={styles.separator} />

          <Pressable style={styles.item} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
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
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menu: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  itemText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  itemTextDestructive: {
    color: colors.error,
  },
  separator: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.lg,
  },
  cancelText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
});
