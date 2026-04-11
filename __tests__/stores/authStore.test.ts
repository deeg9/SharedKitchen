// ── Mock supabase ────────────────────────────────────────────────────
const mockFrom = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    auth: {
      signOut: jest.fn().mockResolvedValue({}),
    },
  },
}));

import { useAuthStore } from '../../src/stores/authStore';

// ── Setup ───────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Default: supabase.from().update().eq() resolves successfully
  mockEq.mockResolvedValue({ data: null, error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({
    update: mockUpdate,
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  });

  useAuthStore.setState({
    user: { id: 'test-user-id' } as any,
    handle: null,
    handleChangedAt: null,
    handleChecked: true,
  });
});

// ── Tests ───────────────────────────────────────────────────────────

describe('updateHandle validation', () => {
  it('rejects reserved word "admin" without calling supabase', async () => {
    const result = await useAuthStore.getState().updateHandle('admin');
    expect(result).toEqual({ success: false, error: 'This username is reserved' });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects short handle "ab" with length error', async () => {
    const result = await useAuthStore.getState().updateHandle('ab');
    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 3');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects uppercase handle "UPPER" with format error', async () => {
    const result = await useAuthStore.getState().updateHandle('UPPER');
    expect(result.success).toBe(false);
    expect(result.error).toContain('lowercase');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects handle change within 30-day cooldown', async () => {
    useAuthStore.setState({
      handleChangedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const result = await useAuthStore.getState().updateHandle('newhandle');
    expect(result.success).toBe(false);
    expect(result.error).toContain('change your handle again in');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('allows handle change after 30-day cooldown expires', async () => {
    useAuthStore.setState({
      handleChangedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const result = await useAuthStore.getState().updateHandle('newhandle');
    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalled();
  });

  it('allows handle change when handleChangedAt is null', async () => {
    const result = await useAuthStore.getState().updateHandle('newhandle');
    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalled();
  });
});
