import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardType,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface AlertDialogAction {
  label: string;
  onPress: (inputValue?: string) => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

interface AlertDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  input?: {
    placeholder?: string;
    defaultValue?: string;
    keyboardType?: KeyboardType;
    onChangeText?: (text: string) => void;
  };
  actions: AlertDialogAction[];
}

const ACTION_COLORS: Record<string, string> = {
  primary: colors.primary,
  secondary: colors.onSurfaceVariant,
  destructive: colors.error,
};

export function AlertDialog({
  visible,
  onClose,
  title,
  message,
  input,
  actions,
}: AlertDialogProps) {
  const [inputValue, setInputValue] = useState(input?.defaultValue ?? '');

  useEffect(() => {
    if (visible) {
      setInputValue(input?.defaultValue ?? '');
    }
  }, [visible, input?.defaultValue]);

  const handleChangeText = (text: string) => {
    setInputValue(text);
    input?.onChangeText?.(text);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          {message != null && (
            <Text style={styles.message}>{message}</Text>
          )}

          {input != null && (
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={handleChangeText}
              placeholder={input.placeholder}
              placeholderTextColor={colors.outlineVariant}
              keyboardType={input.keyboardType}
              autoFocus
            />
          )}

          <View style={styles.actionsRow}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                style={styles.actionButton}
                onPress={() => action.onPress(inputValue)}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    { color: ACTION_COLORS[action.variant ?? 'primary'] },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  message: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.bodyMd,
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionLabel: {
    ...typography.labelLg,
  },
});
