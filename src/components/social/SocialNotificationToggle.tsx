import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import {
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
} from '../../lib/notifications';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function SocialNotificationToggle() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef<NotificationSettings | null>(null);

  useEffect(() => {
    getNotificationSettings().then((settings) => {
      settingsRef.current = settings;
      setEnabled(settings.socialNotifications);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    if (settingsRef.current) {
      const updated = { ...settingsRef.current, socialNotifications: value };
      settingsRef.current = updated;
      await saveNotificationSettings(updated);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Social Notifications</Text>
        <Text style={styles.subtitle}>
          Get notified when someone follows, likes, or comments
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        disabled={loading}
        trackColor={{ false: colors.outlineVariant, true: colors.primaryFixed }}
        thumbColor={enabled ? colors.primary : colors.onSurfaceVariant}
        testID="social-notifications-toggle"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
});
