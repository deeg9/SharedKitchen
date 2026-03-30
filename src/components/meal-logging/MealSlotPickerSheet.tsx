import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { MealType, MEAL_TYPES, MEAL_TYPE_CONFIG } from '../../types/database';
import { getWeekDays, toDateString, formatDayLabel } from '../../lib/dates';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface MealSlotPickerSheetProps {
  isOpen: boolean;
  dishName: string;
  onClose: () => void;
  onSelect: (date: string, mealType: MealType) => void;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getNext7Days(): Date[] {
  const thisWeek = getWeekDays(0);
  const nextWeek = getWeekDays(1);
  const allDays = [...thisWeek, ...nextWeek];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDays = allDays.filter((d) => {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    return day >= today;
  });

  return futureDays.slice(0, 7);
}

export function MealSlotPickerSheet({
  isOpen,
  dishName,
  onClose,
  onSelect,
}: MealSlotPickerSheetProps) {
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const days = useMemo(() => getNext7Days(), []);

  const handleMealSelect = (mealType: MealType) => {
    onSelect(toDateString(selectedDay), mealType);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['55%']}>
      <View style={styles.container}>
        <Text style={styles.title} numberOfLines={1}>
          Log {dishName}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayScroll}
          contentContainerStyle={styles.dayScrollContent}
        >
          {days.map((day) => {
            const dateStr = toDateString(day);
            const selectedStr = toDateString(selectedDay);
            const selected = dateStr === selectedStr;
            const label = formatDayLabel(day);
            const todayDay = isToday(day);

            return (
              <Pressable
                key={dateStr}
                style={[styles.dayChip, selected && styles.dayChipSelected]}
                onPress={() => setSelectedDay(day)}
                testID={`meal-day-${dateStr}`}
              >
                <Text
                  style={[
                    styles.dayChipWeekday,
                    selected && styles.dayChipTextSelected,
                  ]}
                >
                  {todayDay ? 'Today' : label.weekday}
                </Text>
                <Text
                  style={[
                    styles.dayChipDate,
                    selected && styles.dayChipTextSelected,
                  ]}
                >
                  {label.day}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.mealSlots}>
          {MEAL_TYPES.map((mealType) => {
            const config = MEAL_TYPE_CONFIG[mealType];
            return (
              <Pressable
                key={mealType}
                style={styles.mealSlotButton}
                onPress={() => handleMealSelect(mealType)}
                testID={`meal-slot-${mealType}`}
              >
                <MaterialCommunityIcons
                  name={config.icon}
                  size={22}
                  color={colors.onSurface}
                />
                <Text style={styles.mealSlotText}>{config.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  title: {
    ...typography.titleLg,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  dayScroll: {
    marginBottom: spacing.lg,
  },
  dayScrollContent: {
    gap: spacing.sm,
  },
  dayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 56,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
  },
  dayChipWeekday: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  dayChipDate: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  dayChipTextSelected: {
    color: colors.onPrimary,
  },
  mealSlots: {
    gap: spacing.sm,
  },
  mealSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  mealSlotText: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
});
