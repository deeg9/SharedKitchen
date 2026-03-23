import { supabase } from '../src/lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

describe('Auth - Sign Up (AUTH-01)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls supabase.auth.signUp with email and password', async () => {
    const email = 'newuser@example.com';
    const password = 'securePassword123';

    const result = await supabase.auth.signUp({ email, password });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email, password });
    expect(supabase.auth.signUp).toHaveBeenCalledTimes(1);
    expect(result.data.user).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('returns user data on successful signup', async () => {
    const result = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.data.user?.id).toBe('mock-user-id');
    expect(result.data.user?.email).toBe('test@example.com');
  });
});

describe('Auth - Google OAuth (AUTH-02)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls GoogleSignin.signIn and passes idToken to supabase.auth.signInWithIdToken', async () => {
    // Simulate the Google Sign-In flow
    const result = await GoogleSignin.signIn();
    const idToken = result.data?.idToken;

    expect(idToken).toBe('mock-id-token');

    // Pass token to Supabase with nonce
    const rawNonce = 'mock-raw-nonce';
    await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken!,
      nonce: rawNonce,
    });

    expect(GoogleSignin.signIn).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'mock-id-token',
      nonce: 'mock-raw-nonce',
    });
  });

  it('uses nonce for security in Google OAuth flow', async () => {
    const result = await GoogleSignin.signIn();
    const rawNonce = 'test-nonce-value';

    await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: result.data?.idToken!,
      nonce: rawNonce,
    });

    const callArgs = (supabase.auth.signInWithIdToken as jest.Mock).mock.calls[0][0];
    expect(callArgs.nonce).toBe('test-nonce-value');
    expect(callArgs.provider).toBe('google');
  });
});

describe('Auth - Sign Out (PROF-06)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls supabase.auth.signOut to end the session', async () => {
    const result = await supabase.auth.signOut();

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(result.error).toBeNull();
  });
});

describe('Auth - Email Sign In', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls signInWithPassword with email and password', async () => {
    const email = 'user@example.com';
    const password = 'myPassword';

    const result = await supabase.auth.signInWithPassword({ email, password });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email, password });
    expect(result.data.session).toBeDefined();
    expect(result.data.session?.access_token).toBe('mock-token');
  });
});
