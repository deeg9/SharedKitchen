import { supabase } from '../../src/lib/supabase';
import { useBudgetStore } from '../../src/stores/budgetStore';

// Reset store state between tests
beforeEach(() => {
  useBudgetStore.setState({
    expenses: [],
    budgetTarget: 600,
    loading: false,
    error: null,
    selectedMonth: new Date(2026, 2, 1), // March 2026
  });
  jest.clearAllMocks();
});

describe('budgetStore', () => {
  describe('fetchExpenses', () => {
    it('loads expenses for household+month and sets state', async () => {
      const mockExpenses = [
        { id: 'e1', household_id: 'h1', amount: 50, category: 'Groceries', expense_date: '2026-03-05' },
        { id: 'e2', household_id: 'h1', amount: 30, category: 'Takeout', expense_date: '2026-03-10' },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockExpenses, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useBudgetStore.getState().fetchExpenses('h1', new Date(2026, 2, 1));

      expect(supabase.from).toHaveBeenCalledWith('expenses');
      expect(mockChain.eq).toHaveBeenCalledWith('household_id', 'h1');
      expect(useBudgetStore.getState().expenses).toEqual(mockExpenses);
      expect(useBudgetStore.getState().loading).toBe(false);
    });
  });

  describe('addExpense', () => {
    it('inserts expense row and appends to state', async () => {
      const newExpense = {
        amount: 25.50,
        category: 'Dining Out' as const,
        description: 'Lunch',
        expense_date: '2026-03-15',
      };
      const createdExpense = { id: 'e3', household_id: 'h1', ...newExpense, created_at: '2026-03-15T12:00:00Z' };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: createdExpense, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      // Mock auth.getUser
      (supabase.auth as any).getUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      await useBudgetStore.getState().addExpense('h1', newExpense);

      expect(supabase.from).toHaveBeenCalledWith('expenses');
      expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({
        household_id: 'h1',
        amount: 25.50,
        category: 'Dining Out',
      }));
      expect(useBudgetStore.getState().expenses).toContainEqual(createdExpense);
    });
  });

  describe('monthlyTotal', () => {
    it('computes sum of all expenses in current month', () => {
      useBudgetStore.setState({
        expenses: [
          { id: 'e1', amount: 100, expense_date: '2026-03-05' } as any,
          { id: 'e2', amount: 50.50, expense_date: '2026-03-10' } as any,
          { id: 'e3', amount: 25, expense_date: '2026-03-15' } as any,
        ],
      });

      const total = useBudgetStore.getState().monthlyTotal();
      expect(total).toBe(175.50);
    });
  });

  describe('categoryTotals', () => {
    it('returns breakdown by category with amounts and percentages', () => {
      useBudgetStore.setState({
        expenses: [
          { id: 'e1', amount: 200, category: 'Groceries' } as any,
          { id: 'e2', amount: 100, category: 'Groceries' } as any,
          { id: 'e3', amount: 80, category: 'Dining Out' } as any,
          { id: 'e4', amount: 20, category: 'Takeout' } as any,
        ],
      });

      const totals = useBudgetStore.getState().categoryTotals();
      expect(totals.Groceries.amount).toBe(300);
      expect(totals.Groceries.percentage).toBe(75);
      expect(totals['Dining Out'].amount).toBe(80);
      expect(totals['Dining Out'].percentage).toBe(20);
      expect(totals.Takeout.amount).toBe(20);
      expect(totals.Takeout.percentage).toBe(5);
    });
  });

  describe('weeklyBreakdown', () => {
    it('groups expenses into week buckets with totals', () => {
      useBudgetStore.setState({
        selectedMonth: new Date(2026, 2, 1), // March 2026
        expenses: [
          { id: 'e1', amount: 50, category: 'Groceries', expense_date: '2026-03-02' } as any, // Week 1
          { id: 'e2', amount: 30, category: 'Takeout', expense_date: '2026-03-03' } as any, // Week 1
          { id: 'e3', amount: 100, category: 'Groceries', expense_date: '2026-03-09' } as any, // Week 2
          { id: 'e4', amount: 45, category: 'Dining Out', expense_date: '2026-03-16' } as any, // Week 3
        ],
      });

      const weeks = useBudgetStore.getState().weeklyBreakdown();
      expect(weeks.length).toBeGreaterThanOrEqual(3);
      // Find Week 1 (containing March 2)
      const week1 = weeks.find(w => w.total > 0 && w.weekNumber === 1);
      expect(week1).toBeDefined();
      expect(week1!.total).toBe(80);
    });
  });

  describe('setBudgetTarget', () => {
    it('updates the monthly target', async () => {
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'bs1', household_id: 'h1', monthly_target: 800 },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useBudgetStore.getState().setBudgetTarget('h1', 800);

      expect(supabase.from).toHaveBeenCalledWith('budget_settings');
      expect(useBudgetStore.getState().budgetTarget).toBe(800);
    });
  });
});
