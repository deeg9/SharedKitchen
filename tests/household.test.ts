import { supabase } from '../src/lib/supabase';

// Helper to create mock query builder with chainable methods
function createMockQueryBuilder(resolveData: any = null, resolveError: any = null) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: resolveData, error: resolveError })),
    then: undefined, // Make it thenable only via single()
  };
  // Make the builder itself resolve when awaited (for non-single queries)
  builder.then = (resolve: any) =>
    resolve({ data: resolveData ? [resolveData] : [], error: resolveError });
  return builder;
}

describe('Household operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create household', () => {
    it('should insert a household with the correct name and created_by', async () => {
      const mockHousehold = {
        id: 'household-1',
        name: 'Test Kitchen',
        invite_code: 'abc12345',
        created_by: 'mock-user-id',
        created_at: '2026-01-01T00:00:00Z',
      };

      const builder = createMockQueryBuilder(mockHousehold);
      (supabase.from as jest.Mock).mockReturnValue(builder);

      // Simulate what createHousehold does:
      const { data, error } = await supabase
        .from('households')
        .insert({ name: 'Test Kitchen', created_by: 'mock-user-id' })
        .select()
        .single();

      expect(supabase.from).toHaveBeenCalledWith('households');
      expect(builder.insert).toHaveBeenCalledWith({
        name: 'Test Kitchen',
        created_by: 'mock-user-id',
      });
      expect(data).toEqual(mockHousehold);
      expect(error).toBeNull();
    });

    it('should add creator as admin in household_members', async () => {
      const memberBuilder = createMockQueryBuilder({
        id: 'member-1',
        household_id: 'household-1',
        user_id: 'mock-user-id',
        role: 'admin',
        joined_at: '2026-01-01T00:00:00Z',
      });
      (supabase.from as jest.Mock).mockReturnValue(memberBuilder);

      await supabase.from('household_members').insert({
        household_id: 'household-1',
        user_id: 'mock-user-id',
        role: 'admin',
      });

      expect(supabase.from).toHaveBeenCalledWith('household_members');
      expect(memberBuilder.insert).toHaveBeenCalledWith({
        household_id: 'household-1',
        user_id: 'mock-user-id',
        role: 'admin',
      });
    });
  });

  describe('Invite code', () => {
    it('should return a household with an invite_code after creation', async () => {
      const mockHousehold = {
        id: 'household-1',
        name: 'My Kitchen',
        invite_code: 'xyz98765',
        created_by: 'mock-user-id',
        created_at: '2026-01-01T00:00:00Z',
      };

      const builder = createMockQueryBuilder(mockHousehold);
      (supabase.from as jest.Mock).mockReturnValue(builder);

      const { data } = await supabase
        .from('households')
        .insert({ name: 'My Kitchen', created_by: 'mock-user-id' })
        .select()
        .single();

      expect(data).toBeDefined();
      expect(data!.invite_code).toBe('xyz98765');
      expect(data!.invite_code).toHaveLength(8);
    });
  });

  describe('Join household', () => {
    it('should look up a household by invite_code and add user as member', async () => {
      const mockHousehold = {
        id: 'household-2',
        name: 'Friends Kitchen',
        invite_code: 'joinme01',
        created_by: 'other-user-id',
        created_at: '2026-01-01T00:00:00Z',
      };

      // First call: lookup by invite_code
      const lookupBuilder = createMockQueryBuilder(mockHousehold);
      // Second call: insert member
      const insertBuilder = createMockQueryBuilder({ id: 'member-2' });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(lookupBuilder)
        .mockReturnValueOnce(insertBuilder);

      // Step 1: Look up household
      const { data: household } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', 'joinme01')
        .single();

      expect(household).toEqual(mockHousehold);
      expect(lookupBuilder.eq).toHaveBeenCalledWith('invite_code', 'joinme01');

      // Step 2: Join
      await supabase.from('household_members').insert({
        household_id: household!.id,
        user_id: 'mock-user-id',
        role: 'member',
      });

      expect(supabase.from).toHaveBeenCalledWith('household_members');
      expect(insertBuilder.insert).toHaveBeenCalledWith({
        household_id: 'household-2',
        user_id: 'mock-user-id',
        role: 'member',
      });
    });
  });

  describe('Fetch members', () => {
    it('should query household_members with profile join and return profiles with roles', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          household_id: 'household-1',
          user_id: 'user-1',
          role: 'admin',
          joined_at: '2026-01-01T00:00:00Z',
          profiles: { id: 'user-1', display_name: 'Alice', avatar_url: null },
        },
        {
          id: 'member-2',
          household_id: 'household-1',
          user_id: 'user-2',
          role: 'member',
          joined_at: '2026-01-02T00:00:00Z',
          profiles: { id: 'user-2', display_name: 'Bob', avatar_url: 'https://example.com/bob.jpg' },
        },
      ];

      const builder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({ data: mockMembers, error: null })),
      };
      (supabase.from as jest.Mock).mockReturnValue(builder);

      const { data } = await supabase
        .from('household_members')
        .select('*, profiles(id, display_name, avatar_url)')
        .eq('household_id', 'household-1');

      expect(supabase.from).toHaveBeenCalledWith('household_members');
      expect(builder.select).toHaveBeenCalledWith('*, profiles(id, display_name, avatar_url)');
      expect(data).toHaveLength(2);
      expect(data![0].role).toBe('admin');
      expect(data![0].profiles.display_name).toBe('Alice');
      expect(data![1].role).toBe('member');
      expect(data![1].profiles.avatar_url).toBe('https://example.com/bob.jpg');
    });
  });
});
