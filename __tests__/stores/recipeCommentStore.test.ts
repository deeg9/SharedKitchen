import { RecipeCommentWithProfile } from '../../src/types/database';
import { groupComments } from '../../src/stores/recipeCommentStore';
import { useRecipeCommentStore } from '../../src/stores/recipeCommentStore';

// ── Mock supabase ────────────────────────────────────────────────────
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'recipes') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { comment_count: 5 }, error: null }),
            }),
          }),
        };
      }
      return {
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockReturnValue(
              Promise.resolve({ data: [], error: null })
            ),
          }),
        }),
        insert: mockInsert.mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: { id: 'new-id', recipe_id: 'r1', user_id: 'u1', parent_id: null, body: 'test', created_at: '2026-01-01T00:00:00Z', profiles: null },
              error: null,
            }),
          }),
        }),
        delete: mockDelete.mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
    }),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────

function makeComment(overrides: Partial<RecipeCommentWithProfile> = {}): RecipeCommentWithProfile {
  return {
    id: 'c1',
    recipe_id: 'r1',
    user_id: 'u1',
    parent_id: null,
    body: 'Hello',
    photo_url: null,
    created_at: '2026-01-01T00:00:00Z',
    profiles: { handle: 'alice', avatar_url: null },
    ...overrides,
  };
}

// ── groupComments tests ─────────────────────────────────────────────

describe('groupComments', () => {
  it('returns empty array for empty input', () => {
    expect(groupComments([])).toEqual([]);
  });

  it('returns 2 ThreadedComment objects for 2 top-level comments', () => {
    const comments = [
      makeComment({ id: 'c1', created_at: '2026-01-01T00:00:00Z' }),
      makeComment({ id: 'c2', created_at: '2026-01-01T01:00:00Z' }),
    ];
    const result = groupComments(comments);
    expect(result).toHaveLength(2);
    expect(result[0].comment.id).toBe('c1');
    expect(result[1].comment.id).toBe('c2');
    expect(result[0].replies).toEqual([]);
    expect(result[1].replies).toEqual([]);
  });

  it('threads 2 replies under their parent', () => {
    const comments = [
      makeComment({ id: 'c1', created_at: '2026-01-01T00:00:00Z' }),
      makeComment({ id: 'r1', parent_id: 'c1', created_at: '2026-01-01T01:00:00Z' }),
      makeComment({ id: 'r2', parent_id: 'c1', created_at: '2026-01-01T02:00:00Z' }),
    ];
    const result = groupComments(comments);
    expect(result).toHaveLength(1);
    expect(result[0].comment.id).toBe('c1');
    expect(result[0].replies).toHaveLength(2);
    expect(result[0].replies[0].id).toBe('r1');
    expect(result[0].replies[1].id).toBe('r2');
  });

  it('flattens reply-to-reply to the root parent', () => {
    const comments = [
      makeComment({ id: 'c1', created_at: '2026-01-01T00:00:00Z' }),
      makeComment({ id: 'r1', parent_id: 'c1', created_at: '2026-01-01T01:00:00Z' }),
      makeComment({ id: 'rr1', parent_id: 'r1', created_at: '2026-01-01T02:00:00Z' }),
    ];
    const result = groupComments(comments);
    expect(result).toHaveLength(1);
    expect(result[0].replies).toHaveLength(2);
    // rr1 should be flattened under c1, not nested under r1
    expect(result[0].replies.map((r) => r.id)).toContain('rr1');
  });
});

// ── Store action tests ──────────────────────────────────────────────

describe('useRecipeCommentStore', () => {
  beforeEach(() => {
    useRecipeCommentStore.setState({
      comments: [],
      commentCount: 0,
      loading: false,
      error: null,
      replyingTo: null,
    });
    jest.clearAllMocks();
  });

  it('addComment sets optimistic comment in state before API call', async () => {
    // The store should add an optimistic comment immediately
    const promise = useRecipeCommentStore.getState().addComment({
      recipeId: 'r1',
      userId: 'u1',
      body: 'Optimistic!',
    });

    // After initiating, state should have optimistic comment
    const stateAfterCall = useRecipeCommentStore.getState();
    expect(stateAfterCall.comments.length).toBeGreaterThanOrEqual(1);
    expect(stateAfterCall.comments.some((c) => c.body === 'Optimistic!')).toBe(true);

    await promise;
  });

  it('deleteComment removes comment from state', async () => {
    const comment = makeComment({ id: 'del-1' });
    useRecipeCommentStore.setState({ comments: [comment], commentCount: 1 });

    await useRecipeCommentStore.getState().deleteComment('del-1', 'r1');

    const state = useRecipeCommentStore.getState();
    expect(state.comments.find((c) => c.id === 'del-1')).toBeUndefined();
  });

  it('setReplyingTo updates replyingTo state', () => {
    const comment = makeComment({ id: 'reply-target' });
    useRecipeCommentStore.getState().setReplyingTo(comment);
    expect(useRecipeCommentStore.getState().replyingTo).toEqual(comment);

    useRecipeCommentStore.getState().setReplyingTo(null);
    expect(useRecipeCommentStore.getState().replyingTo).toBeNull();
  });

  it('clearComments resets state to empty', () => {
    useRecipeCommentStore.setState({
      comments: [makeComment()],
      commentCount: 5,
      loading: true,
      error: 'some error',
      replyingTo: makeComment(),
    });

    useRecipeCommentStore.getState().clearComments();

    const state = useRecipeCommentStore.getState();
    expect(state.comments).toEqual([]);
    expect(state.commentCount).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.replyingTo).toBeNull();
  });
});
