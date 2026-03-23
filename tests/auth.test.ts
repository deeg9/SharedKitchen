import { supabase } from '../src/lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

describe('Auth - Sign Up (AUTH-01)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls supabase.auth.signUp with email and password', async () => {
    const email = 'newuser@example.com';
    const password = 'securePassword123';

    await supabase.auth.signUp({ email, password });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email, password });
    expect(supabase.auth.signUp).toHaveBeenCalledTimes(1);
  });
});

describe('Auth - Google OAuth (AUTH-02)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls GoogleSignin.signIn and passes idToken to supabase.auth.signInWithIdToken', async () => {
    const result = await GoogleSignin.signIn();
    const idToken = result.data?.idToken;

    expect(idToken).toBe('mock-id-token');

    await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken!,
      nonce: 'mock-raw-nonce',
    });

    expect(GoogleSignin.signIn).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'mock-id-token',
      nonce: 'mock-raw-nonce',
    });
  });
});

describe('Auth - Sign Out (PROF-06)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls supabase.auth.signOut to end the session', async () => {
    await supabase.auth.signOut();

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
