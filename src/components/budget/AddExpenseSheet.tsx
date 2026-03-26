import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useBudgetStore, ExpenseCategory } from '../../stores/budgetStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface AddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
}

const CATEGORIES: ExpenseCategory[] = ['Groceries', 'Dining Out', 'Takeout'];

export function AddExpenseSheet({ isOpen, onClose, householdId }: AddExpenseSheetProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const addExpense = useBudgetStore((s) => s.addExpense);

  const isValid = Number(amount) > 0 && category !== null;

  const handleSubmit = async () => {
    if (!isValid || !category) return;
    setSubmitting(true);

    await addExpense(householdId, {
      amount: Number(amount),
      category,
      description: description || undefined,
      expense_date: date,
    });

    // Reset form
    setAmount('');
    setCategory(null);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setSubmitting(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['65%']}>
      <View style={styles.container}>
        <Text style={styles.title}>Add Expense</Text>

        <View style={styles.amountContainer}>
          <Text style={styles.dollarSign}>$</Text>
          <Input
            label=""
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.chip,
                category === cat && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  category === cat && styles.chipTextSelected,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input
          label="Description"
          placeholder="What was this for?"
          value={description}
          onChangeText={setDescription}
        />

        <Input
          label="Date"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={!isValid}
          loading={submitting}
          style={styles.submitButton}
          testID="budget-expense-submit"
        >
          Add Expense
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dollarSign: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginRight: spacing.sm,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.labelMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  submitButton: {
    width: '100%',
    marginTop: spacing.md,
  },
});
