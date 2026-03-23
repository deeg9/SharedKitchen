import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useLeftoverStore } from '../../stores/leftoverStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface AddLeftoverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
}

const statusOptions: Array<{ value: 'fresh' | 'frozen'; label: string }> = [
  { value: 'fresh', label: 'Fresh' },
  { value: 'frozen', label: 'Frozen' },
];

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function AddLeftoverSheet({ isOpen, onClose, householdId }: AddLeftoverSheetProps) {
  const { addLeftover } = useLeftoverStore();

  const [name, setName] = useState('');
  const [dateMade, setDateMade] = useState(todayString());
  const [useByDate, setUseByDate] = useState('');
  const [portions, setPortions] = useState('1');
  const [status, setStatus] = useState<'fresh' | 'frozen'>('fresh');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = name.trim().length > 0 && useByDate.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await addLeftover(householdId, {
        name: name.trim(),
        date_made: dateMade,
        use_by_date: useByDate,
        portions: parseInt(portions, 10) || 1,
        status,
        notes: notes.trim() || null,
      });
      // Reset form
      setName('');
      setDateMade(todayString());
      setUseByDate('');
      setPortions('1');
      setStatus('fresh');
      setNotes('');
      onClose();
    } catch {
      // Error handled in store
    } finally {
      setSubmitting(false);
    }
  }, [isValid, name, dateMade, useByDate, portions, status, notes, householdId, addLeftover, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['70%']}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Leftover</Text>

        <Input
          label="Name"
          placeholder="e.g. Chicken Soup"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Date Made"
          placeholder="YYYY-MM-DD"
          value={dateMade}
          onChangeText={setDateMade}
        />

        <Input
          label="Use By Date"
          placeholder="YYYY-MM-DD"
          value={useByDate}
          onChangeText={setUseByDate}
        />

        <Input
          label="Portions"
          placeholder="1"
          value={portions}
          onChangeText={setPortions}
          keyboardType="numeric"
        />

        {/* Status chips */}
        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.chipRow}>
          {statusOptions.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.chip,
                status === opt.value && styles.chipSelected,
              ]}
              onPress={() => setStatus(opt.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  status === opt.value && styles.chipTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input
          label="Notes (optional)"
          placeholder="Any additional notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!isValid}
          style={styles.submitButton}
        >
          Add Leftover
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.labelMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
