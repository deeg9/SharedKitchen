/**
 * Tests for the Supabase client configuration.
 * We verify the configuration constants and patterns used in supabase.ts.
 */

// The supabase module is already mocked via setup.ts, so we test config values
// by reading the source file's configuration expectations.

describe('Supabase Client Configuration', () => {
  it('exports a supabase client', () => {
    const { supabase } = require('../src/lib/supabase');
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('has auth methods available', () => {
    const { supabase } = require('../src/lib/supabase');
    expect(supabase.auth.signUp).toBeDefined();
    expect(supabase.auth.signInWithPassword).toBeDefined();
    expect(supabase.auth.signInWithIdToken).toBeDefined();
    expect(supabase.auth.signOut).toBeDefined();
    expect(supabase.auth.onAuthStateChange).toBeDefined();
    expect(supabase.auth.getSession).toBeDefined();
  });

  it('has database query methods available', () => {
    const { supabase } = require('../src/lib/supabase');
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  // Verify the source file contains correct configuration by reading it
  it('source file configures persistSession: true and detectSessionInUrl: false', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'lib', 'supabase.ts'),
      'utf-8'
    );

    expect(source).toContain('persistSession: true');
    expect(source).toContain('detectSessionInUrl: false');
    expect(source).toContain('autoRefreshToken: true');
    expect(source).toContain('AsyncStorage');
    expect(source).toContain("import 'react-native-url-polyfill/auto'");
  });
});
