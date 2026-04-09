import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  startDate?: Date;
  endDate?: Date;
}

const DAY_CELL_WIDTH = 56;
const DAY_CELL_HEIGHT = 68;
const DAY_CELL_GAP = spacing.sm; // 8
const SNAP_INTERVAL = DAY_CELL_WIDTH + DAY_CELL_GAP; // 64
const TODAY_CIRCLE_SIZE = 36;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // getDay(): 0=Sun, 1=Mon, ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function generateDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setHours(23, 59, 59, 999);

  while (current <= endNorm) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function DateStrip({
  selectedDate,
  onSelectDate,
  startDate,
  endDate,
}: DateStripProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [layoutWidth, setLayoutWidth] = useState(300);

  // Compute date range
  const defaultStart = startDate ?? getMondayOfWeek(selectedDate);
  const defaultEnd =
    endDate ??
    (() => {
      const sunday = new Date(defaultStart);
      sunday.setDate(sunday.getDate() + 6);
      return sunday;
    })();

  const dates = generateDateRange(defaultStart, defaultEnd);

  const today = new Date();

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  }, []);

  // Auto-scroll to today on mount
  useEffect(() => {
    const todayIndex = dates.findIndex((d) => isSameDay(d, today));
    if (todayIndex >= 0 && scrollViewRef.current) {
      const offset = todayIndex * SNAP_INTERVAL - layoutWidth / 2 + DAY_CELL_WIDTH / 2;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: Math.max(0, offset),
          animated: true,
        });
      }, 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (dates.length === 0) {
    return null;
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      snapToInterval={SNAP_INTERVAL}
      decelerationRate="fast"
      contentContainerStyle={styles.container}
      onLayout={handleLayout}
    >
      {dates.map((dayDate, index) => {
        const isToday = isSameDay(dayDate, today);
        const isSelected = isSameDay(dayDate, selectedDate);

        const dayName = dayDate
          .toLocaleDateString('en-US', { weekday: 'short' })
          .toUpperCase();
        const dateNumber = dayDate.getDate();
        const fullDateLabel = dayDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

        return (
          <TouchableOpacity
            key={dayDate.toISOString()}
            activeOpacity={0.7}
            onPress={() => onSelectDate(dayDate)}
            style={[
              styles.dayCell,
              isSelected && !isToday && styles.dayCellSelected,
              index < dates.length - 1 && styles.dayCellMargin,
            ]}
            accessibilityRole="button"
            accessibilityLabel={fullDateLabel}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.dayName,
                isToday && styles.dayNameToday,
              ]}
            >
              {dayName}
            </Text>
            {isToday ? (
              <View style={styles.todayCircle}>
                <Text style={styles.dateNumberToday}>{dateNumber}</Text>
              </View>
            ) : (
              <Text style={styles.dateNumber}>{dateNumber}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  dayCell: {
    width: DAY_CELL_WIDTH,
    height: DAY_CELL_HEIGHT,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayCellSelected: {
    backgroundColor: colors.surfaceContainer,
  },
  dayCellMargin: {
    marginRight: DAY_CELL_GAP,
  },
  dayName: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  dayNameToday: {
    color: colors.primary,
  },
  todayCircle: {
    width: TODAY_CIRCLE_SIZE,
    height: TODAY_CIRCLE_SIZE,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumberToday: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
  dateNumber: {
    ...typography.titleMd,
    color: colors.onSurfaceVariant,
  },
});
