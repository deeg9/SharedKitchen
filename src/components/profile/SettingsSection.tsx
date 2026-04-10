import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface SettingsRow {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: {
    value: boolean;
    onToggle: (v: boolean) => void;
  };
}

interface SettingsSectionProps {
  title: string;
  rows: SettingsRow[];
}

export function SettingsSection({ title, rows }: SettingsSectionProps) {
  const testId = `settings-section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <View style={styles.container} testID={testId}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.card}>
        {rows.map((row, index) => {
          const isLast = index === rows.length - 1;
          const content = (
            <View
              key={row.label}
              style={[
                styles.row,
                !isLast && styles.rowBorder,
              ]}
            >
              <MaterialCommunityIcons
                name={row.icon as any}
                size={22}
                color={colors.onSurfaceVariant}
              />
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.value != null && (
                <Text style={styles.rowValue}>{row.value}</Text>
              )}
              {row.toggle && (
                <Switch
                  value={row.toggle.value}
                  onValueChange={row.toggle.onToggle}
                  trackColor={{
                    false: colors.surfaceContainerHigh,
                    true: colors.primaryFixed,
                  }}
                  thumbColor={row.toggle.value ? colors.primary : colors.onSurfaceVariant}
                />
              )}
              {row.onPress && !row.toggle && (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              )}
            </View>
          );

          if (row.onPress) {
            return (
              <Pressable key={row.label} onPress={row.onPress}>
                {content}
              </Pressable>
            );
          }

          return content;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant,
  },
  rowLabel: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
    marginLeft: spacing.md,
  },
  rowValue: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginRight: spacing.sm,
  },
});
