import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Expense } from '../types/database';
import { checkBudgetThreshold } from '../lib/notifications';
import { getErrorMessage } from '../lib/errors';

export type ExpenseCategory = 'Groceries' | 'Dining Out' | 'Takeout';

interface CategoryTotal {
  amount: number;
  percentage: number;
}

interface WeekBucket {
  weekNumber: number;
  dateRange: string;
  total: number;
  isCurrent: boolean;
  categoryBreakdown: Record<string, number>;
}

interface BudgetState {
  expenses: Expense[];
  budgetTarget: number;
  loading: boolean;
  error: string | null;
  selectedMonth: Date;

  // Computed
  monthlyTotal: () => number;
  categoryTotals: () => Record<ExpenseCategory, CategoryTotal>;
  weeklyBreakdown: () => WeekBucket[];

  // Actions
  fetchExpenses: (householdId: string, month: Date) => Promise<void>;
  addExpense: (
    householdId: string,
    data: {
      amount: number;
      category: ExpenseCategory;
      description?: string;
      expense_date: string;
    }
  ) => Promise<void>;
  fetchBudgetTarget: (householdId: string) => Promise<void>;
  setBudgetTarget: (householdId: string, amount: number) => Promise<void>;
  setSelectedMonth: (date: Date) => void;
}

function getMonthRange(month: Date): { start: string; end: string } {
  const year = month.getFullYear();
  const m = month.getMonth();
  const start = new Date(year, m, 1);
  const end = new Date(year, m + 1, 1);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function getWeeksOfMonth(month: Date): Array<{ weekNumber: number; start: Date; end: Date; dateRange: string; isCurrent: boolean }> {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const lastDay = new Date(year, m + 1, 0);
  const today = new Date();

  const weeks: Array<{ weekNumber: number; start: Date; end: Date; dateRange: string; isCurrent: boolean }> = [];
  let weekStart = new Date(firstDay);
  let weekNum = 1;

  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    // Clamp to end of month
    const clampedEnd = weekEnd > lastDay ? lastDay : weekEnd;

    const startStr = `${weekStart.toLocaleString('en-US', { month: 'short' })} ${weekStart.getDate()}`;
    const endStr = `${clampedEnd.getDate()}`;
    const dateRange = `${startStr}-${endStr}`;

    const isCurrent =
      today >= weekStart &&
      today <= clampedEnd &&
      today.getMonth() === m &&
      today.getFullYear() === year;

    weeks.push({
      weekNumber: weekNum,
      start: new Date(weekStart),
      end: clampedEnd,
      dateRange,
      isCurrent,
    });

    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() + 7);
    weekNum++;
  }

  return weeks;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  expenses: [],
  budgetTarget: 600,
  loading: false,
  error: null,
  selectedMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),

  monthlyTotal: () => {
    const { expenses } = get();
    return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  },

  categoryTotals: () => {
    const { expenses } = get();
    const totals: Record<ExpenseCategory, number> = {
      Groceries: 0,
      'Dining Out': 0,
      Takeout: 0,
    };

    expenses.forEach((e) => {
      if (e.category in totals) {
        totals[e.category as ExpenseCategory] += Number(e.amount);
      }
    });

    const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

    const result: Record<ExpenseCategory, CategoryTotal> = {
      Groceries: {
        amount: totals.Groceries,
        percentage: grandTotal > 0 ? Math.round((totals.Groceries / grandTotal) * 100) : 0,
      },
      'Dining Out': {
        amount: totals['Dining Out'],
        percentage: grandTotal > 0 ? Math.round((totals['Dining Out'] / grandTotal) * 100) : 0,
      },
      Takeout: {
        amount: totals.Takeout,
        percentage: grandTotal > 0 ? Math.round((totals.Takeout / grandTotal) * 100) : 0,
      },
    };

    return result;
  },

  weeklyBreakdown: () => {
    const { expenses, selectedMonth, budgetTarget } = get();
    const weeks = getWeeksOfMonth(selectedMonth);

    return weeks.map((week) => {
      const weekExpenses = expenses.filter((e) => {
        const d = new Date(e.expense_date + 'T00:00:00');
        return d >= week.start && d <= week.end;
      });

      const categoryBreakdown: Record<string, number> = {};
      let total = 0;

      weekExpenses.forEach((e) => {
        const amt = Number(e.amount);
        total += amt;
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + amt;
      });

      return {
        weekNumber: week.weekNumber,
        dateRange: week.dateRange,
        total,
        isCurrent: week.isCurrent,
        categoryBreakdown,
      };
    });
  },

  fetchExpenses: async (householdId, month) => {
    set({ loading: true, error: null, selectedMonth: month });
    try {
      const { start, end } = getMonthRange(month);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('household_id', householdId)
        .gte('expense_date', start)
        .lt('expense_date', end)
        .order('expense_date', { ascending: true });

      if (error) throw error;

      set({ expenses: (data as Expense[]) ?? [], loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  addExpense: async (householdId, data) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          household_id: householdId,
          amount: data.amount,
          category: data.category,
          description: data.description || null,
          expense_date: data.expense_date,
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        expenses: [...state.expenses, expense as Expense],
      }));

      // Check budget thresholds and fire alerts
      const { monthlyTotal, budgetTarget } = get();
      try {
        await checkBudgetThreshold(monthlyTotal(), budgetTarget, 'Your Household');
      } catch {}
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  fetchBudgetTarget: async (householdId) => {
    try {
      const { data, error } = await supabase
        .from('budget_settings')
        .select('*')
        .eq('household_id', householdId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, use default
          return;
        }
        throw error;
      }

      if (data) {
        set({ budgetTarget: Number(data.monthly_target) });
      }
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  setBudgetTarget: async (householdId, amount) => {
    try {
      const { data, error } = await supabase
        .from('budget_settings')
        .upsert(
          {
            household_id: householdId,
            monthly_target: amount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'household_id' }
        )
        .select()
        .single();

      if (error) throw error;

      set({ budgetTarget: Number(data.monthly_target) });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  setSelectedMonth: (date) => {
    set({ selectedMonth: date });
  },
}));
