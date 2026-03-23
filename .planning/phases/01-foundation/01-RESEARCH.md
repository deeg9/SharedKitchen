# Phase 1: Foundation - Research

**Researched:** 2026-03-22
**Domain:** React Native/Expo app scaffolding, Supabase Auth, household data modeling, design system implementation
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield build: no code exists yet. The project needs an Expo app initialized with SDK 55 (current latest, React Native 0.83, React 19.2), Supabase backend for auth and data, a multi-household data model with RLS, and a polished "Culinary Curator" design system translated from existing Stitch UI HTML/Tailwind mockups into React Native components.

The critical path is: (1) project scaffolding with expo-router file-based routing for 5-tab navigation, (2) Supabase Auth with email/password and Google OAuth using `@react-native-google-signin/google-signin` + `signInWithIdToken`, (3) household CRUD with invite codes and multi-household switching, (4) design system tokens and reusable components matching the mockups, (5) profile screen with edit and sign-out.

**Primary recommendation:** Use Expo SDK 55 with expo-router for file-based tab/stack navigation, `@supabase/supabase-js` with `@react-native-async-storage/async-storage` for session persistence, and build a design token system (colors, typography, spacing) as the foundation for all UI components.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | Supabase Auth `signUp` with email/password; standard pattern documented in official quickstart |
| AUTH-02 | User can sign in with Google OAuth | `@react-native-google-signin/google-signin` + `supabase.auth.signInWithIdToken`; nonce handling required for iOS |
| AUTH-03 | User session persists across app restarts | AsyncStorage adapter for Supabase client with `persistSession: true` |
| HOUS-01 | User can create a household with a custom name | Supabase insert into `households` table; creator becomes admin via `household_members` junction |
| HOUS-02 | User can invite members via share code or copy link | Generate random invite code stored in DB; use `expo-sharing` / `expo-clipboard` for share UX |
| HOUS-03 | Invited user can join a household from an invite link | Deep link via expo-router + invite code lookup; add user to `household_members` |
| HOUS-04 | User can view household members with avatars and roles | Query `household_members` joined with `profiles`; RLS policy scoped to household membership |
| HOUS-05 | User can belong to and switch between multiple households | Junction table `household_members` (many-to-many); active household stored in app state (Zustand) |
| DSGN-01 | App follows "Culinary Curator" design system | Token-based theme object extracted from Stitch mockup Tailwind config; tonal layering, no-line rule |
| DSGN-02 | Consistent MD3 color tokens | Full color token map defined in Tailwind config of mockups; translate to React Native theme |
| DSGN-03 | Plus Jakarta Sans headlines, Inter body, Material Symbols icons | `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/inter`, `expo-symbols` or `MaterialCommunityIcons` |
| DSGN-04 | 5-tab bottom navigation with glassmorphic background | expo-router `(tabs)/_layout.tsx` with custom tab bar component; blur via `expo-blur` |
| DSGN-05 | All modals/bottom sheets have slide-up animations with drag handles | `@gorhom/bottom-sheet` v5 with Reanimated v3 |
| DSGN-06 | Skeleton loading states and optimistic UI updates | `react-native-auto-skeleton` or custom shimmer with Reanimated; optimistic patterns via Zustand mutations |
| PROF-01 | User can view and edit profile (avatar, name) | Supabase `profiles` table; `expo-image-picker` + Supabase Storage for avatar upload |
| PROF-06 | User can sign out | `supabase.auth.signOut()` + clear local state + navigate to auth screen |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~55.0 | App framework | Latest stable SDK; React Native 0.83, React 19.2; New Architecture default |
| expo-router | v7 (bundled with SDK 55) | File-based routing | Official Expo navigation solution; tab + stack layouts; deep linking built-in |
| @supabase/supabase-js | ^2.x | Backend client | Official JS client for Auth, Postgres, Storage, Realtime |
| react-native-reanimated | ~3.x (bundled) | Animations | Required by bottom sheet, skeleton, tab bar animations; ships with Expo |
| react-native-gesture-handler | ~2.x (bundled) | Gesture handling | Required by bottom sheet and navigation; ships with Expo |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-native-async-storage/async-storage | ^2.x | Session persistence | Supabase auth session storage adapter |
| @react-native-google-signin/google-signin | ^13.x | Google OAuth native | Native Google Sign-In flow for iOS; provides idToken for Supabase |
| @gorhom/bottom-sheet | ^5.x | Bottom sheets/modals | All modals per DSGN-05; slide-up with drag handles |
| expo-blur | (bundled) | Glassmorphic effects | Tab bar background blur per DSGN-04 |
| expo-image-picker | (bundled) | Avatar photo selection | Profile avatar upload (PROF-01) |
| expo-clipboard | (bundled) | Copy invite link | Household invite sharing (HOUS-02) |
| expo-sharing | (bundled) | Share invite link | Native share sheet for invite codes |
| expo-secure-store | (bundled) | Secure token storage | Alternative to AsyncStorage for sensitive auth tokens |
| expo-splash-screen | (bundled) | Font loading gate | Prevent render until custom fonts loaded |
| @expo-google-fonts/plus-jakarta-sans | ^0.x | Headline font | Design system typography (DSGN-03) |
| @expo-google-fonts/inter | ^0.x | Body/label font | Design system typography (DSGN-03) |
| zustand | ^5.x | Client state | Active household selection, auth state, UI state |
| react-native-safe-area-context | (bundled) | Safe area insets | Tab bar and header spacing |
| expo-symbols | (bundled) | Material Symbols icons | DSGN-03 icon requirement; uses Material Symbols on Android/web |
| base64-arraybuffer | ^1.x | Binary encoding | Avatar upload to Supabase Storage |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand | React Context | Context causes unnecessary re-renders; Zustand is simpler for multi-store patterns |
| AsyncStorage for sessions | expo-secure-store | SecureStore has size limits (2KB); AsyncStorage is what Supabase docs recommend |
| expo-symbols | @expo/vector-icons (MaterialIcons) | expo-symbols maps to Material Symbols (matching mockups exactly); MaterialIcons is the older icon set with different glyph names |
| Custom skeleton | moti/skeleton | Moti adds dependency; custom shimmer with Reanimated is lightweight and matches design system colors exactly |
| NativeWind | StyleSheet + theme tokens | NativeWind adds build complexity; for a design-system-first app, explicit theme tokens with StyleSheet give more control and are easier to debug |

**Installation:**
```bash
npx create-expo-app@latest mise --template tabs
cd mise
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage @react-native-google-signin/google-signin @gorhom/bottom-sheet zustand base64-arraybuffer
npx expo install @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/inter
```

## Architecture Patterns

### Recommended Project Structure

```
app/
├── _layout.tsx              # Root layout: font loading, Supabase auth listener, splash screen
├── (auth)/
│   ├── _layout.tsx          # Auth stack layout
│   ├── sign-in.tsx          # Email/password sign-in + Google OAuth button
│   └── sign-up.tsx          # Registration screen
├── (app)/
│   ├── _layout.tsx          # Authenticated layout: redirect to auth if no session
│   ├── (tabs)/
│   │   ├── _layout.tsx      # 5-tab bottom nav with custom glassmorphic tab bar
│   │   ├── plan.tsx         # Placeholder (Phase 2)
│   │   ├── recipes.tsx      # Placeholder (Phase 2)
│   │   ├── grocery.tsx      # Placeholder (Phase 2)
│   │   ├── budget.tsx       # Placeholder (Phase 3)
│   │   └── profile.tsx      # Profile & household management
│   ├── household/
│   │   ├── create.tsx       # Create household screen
│   │   ├── invite.tsx       # Invite members screen
│   │   └── join.tsx         # Join household via invite code
│   └── edit-profile.tsx     # Edit profile modal/screen
├── join/
│   └── [code].tsx           # Deep link handler for invite links
src/
├── lib/
│   ├── supabase.ts          # Supabase client initialization with AsyncStorage
│   └── constants.ts         # App-wide constants
├── theme/
│   ├── colors.ts            # MD3 color tokens from design system
│   ├── typography.ts        # Font families, sizes, weights
│   ├── spacing.ts           # 8px grid spacing scale
│   └── shadows.ts           # Ambient shadow presets
├── components/
│   ├── ui/                  # Design system primitives
│   │   ├── Button.tsx       # Primary/Secondary/Tertiary buttons
│   │   ├── Card.tsx         # Surface-layered card (no borders)
│   │   ├── Input.tsx        # Ghost-border text input
│   │   ├── BottomSheet.tsx  # Wrapper around @gorhom/bottom-sheet
│   │   ├── Skeleton.tsx     # Shimmer loading placeholder
│   │   ├── Avatar.tsx       # Circular avatar with fallback
│   │   └── TabBar.tsx       # Custom glassmorphic bottom tab bar
│   └── household/
│       ├── MemberList.tsx   # Household member list with roles
│       └── InviteCard.tsx   # Invite link generation UI
├── stores/
│   ├── authStore.ts         # Zustand: auth session, user profile
│   └── householdStore.ts    # Zustand: active household, household list
├── hooks/
│   ├── useSession.ts        # Auth session hook
│   └── useHousehold.ts      # Active household hook
└── types/
    └── database.ts          # Supabase generated types
```

### Pattern 1: Auth-Gated Navigation with expo-router

**What:** Use route groups `(auth)` and `(app)` with a root layout that checks session state and redirects accordingly.
**When to use:** Always -- this is the standard pattern for authenticated Expo apps.

```typescript
// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setInitialized(true);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (session && inAuthGroup) {
      router.replace('/(app)/(tabs)/plan');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [session, initialized, segments]);

  return <Slot />;
}
```

### Pattern 2: Supabase Client with Session Persistence

**What:** Initialize Supabase client with AsyncStorage for session persistence across app restarts.
**When to use:** Always -- required for AUTH-03.

```typescript
// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Pattern 3: Google OAuth with Nonce Handling (iOS)

**What:** Use native Google Sign-In to get an idToken, then pass it to Supabase `signInWithIdToken`. iOS requires nonce alignment.
**When to use:** AUTH-02 implementation.

```typescript
// Simplified Google sign-in flow
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

async function signInWithGoogle() {
  // Generate nonce for iOS security
  const rawNonce = Crypto.getRandomValues(new Uint8Array(32))
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
  const nonceDigest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn({ nonce: nonceDigest });

  if (response.data?.idToken) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.data.idToken,
      nonce: rawNonce,
    });
    return { data, error };
  }
  throw new Error('No idToken returned from Google Sign-In');
}
```

### Pattern 4: Multi-Household Data Model

**What:** Junction table pattern for many-to-many user-household relationship with RLS policies.
**When to use:** HOUS-01 through HOUS-05.

```sql
-- Core tables for multi-household support
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- RLS Policies
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read households they belong to
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

-- Users can create households
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can view members of their households
CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

-- Users can read their own profile and profiles of household co-members
CREATE POLICY "Users can view co-member profiles"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR
    id IN (
      SELECT user_id FROM household_members
      WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());
```

### Pattern 5: Custom Glassmorphic Tab Bar

**What:** Custom tab bar component for expo-router tabs with blur background, rounded top corners, and active tab gradient.
**When to use:** DSGN-04 implementation.

```typescript
// src/components/ui/TabBar.tsx
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={90}
      tint="systemChromeMaterialLight"
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        // ... render tab items with active gradient pill
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    // Ambient shadow matching design system
    shadowColor: '#1b1c1a',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
  },
});
```

### Anti-Patterns to Avoid

- **Hardcoded colors:** Never use hex values directly in components. Always reference theme tokens. The mockups define 40+ color tokens -- centralize them.
- **1px borders for separation:** The design system explicitly forbids visible borders. Use tonal layering (background color shifts between surface tiers) instead.
- **Single-household assumption:** Never store `household_id` on the user profile. Always use the junction table `household_members` and an app-level "active household" selector.
- **Storing auth tokens manually:** Let Supabase client handle token refresh and storage via AsyncStorage adapter. Do not manually manage JWT tokens.
- **Inline styles for recurring patterns:** Extract all design-system-aligned styles into reusable components and theme objects.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet modals | Custom animated View | `@gorhom/bottom-sheet` v5 | Gesture handling, keyboard avoidance, snap points, scroll interaction are extremely complex |
| Google OAuth flow | WebView-based OAuth | `@react-native-google-signin/google-signin` | Native flow is more secure, handles nonces, no redirect URI issues |
| Session persistence | Manual token storage | Supabase client `persistSession` + AsyncStorage | Handles refresh tokens, expiry, race conditions automatically |
| Tab navigation | Custom tab bar from scratch | expo-router `(tabs)` + custom `tabBar` prop | Route management, deep linking, state persistence handled by framework |
| Invite code generation | Custom random string | Postgres `substr(md5(random()::text), 1, 8)` in default | Collision-resistant, generated server-side, no client round-trip |
| Avatar upload pipeline | Manual multipart upload | `expo-image-picker` + Supabase Storage | Handles permissions, image compression, upload progress |

**Key insight:** This phase has many integration points (auth, database, storage, navigation, deep linking). Each of these has well-tested library solutions. Custom implementations would introduce subtle bugs around edge cases like token refresh races, gesture conflicts, and session hydration timing.

## Common Pitfalls

### Pitfall 1: iOS Nonce Mismatch with Google OAuth
**What goes wrong:** Google Sign-In on iOS throws "Passed nonce and nonce in id_token must align" error.
**Why it happens:** Google's iOS SDK skips nonces by default, but Supabase expects them for security.
**How to avoid:** Generate a raw nonce with `expo-crypto`, hash it with SHA-256, pass the hash to GoogleSignin and the raw nonce to `signInWithIdToken`.
**Warning signs:** Works on simulator but fails on real device; works on Android but fails on iOS.

### Pitfall 2: AsyncStorage Not Persisting Sessions
**What goes wrong:** Users get logged out on every app restart.
**Why it happens:** Missing `react-native-url-polyfill/auto` import, or `detectSessionInUrl` set to `true` (which doesn't work in React Native).
**How to avoid:** Always import `react-native-url-polyfill/auto` before creating the Supabase client. Set `detectSessionInUrl: false`.
**Warning signs:** Auth works during session but breaks after app kill/restart.

### Pitfall 3: RLS Policies Block All Access
**What goes wrong:** After enabling RLS, all queries return empty arrays.
**Why it happens:** RLS with no policies = no access. Also, missing `auth.uid()` context if using service key instead of anon key.
**How to avoid:** Always create SELECT/INSERT/UPDATE/DELETE policies for each table. Test with the anon key (which passes user JWT), not the service role key.
**Warning signs:** Queries work in Supabase dashboard but return nothing from the app.

### Pitfall 4: Font Loading Flash of Unstyled Text
**What goes wrong:** App briefly shows system fonts before custom fonts load.
**Why it happens:** Fonts load asynchronously; components render before fonts are ready.
**How to avoid:** Use `expo-splash-screen` to keep the splash screen visible until `useFonts` returns `loaded: true`. Call `SplashScreen.hideAsync()` only after fonts are ready.
**Warning signs:** Brief flash of different font on app launch.

### Pitfall 5: Tab Bar Obscuring Content
**What goes wrong:** Content at the bottom of scrollable screens is hidden behind the tab bar.
**Why it happens:** Custom tab bar with `position: 'absolute'` doesn't affect layout flow.
**How to avoid:** Add `contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}` to all scrollable views. Define `TAB_BAR_HEIGHT` as a shared constant.
**Warning signs:** Last items in lists are cut off or unreachable.

### Pitfall 6: Recursive RLS Policies
**What goes wrong:** Queries become extremely slow or time out.
**Why it happens:** RLS policy on `household_members` references itself (e.g., "can view members WHERE household_id IN (SELECT from household_members...)").
**How to avoid:** Use a security definer function to break the recursion, or use `auth.uid()` directly without self-referencing the same table in the policy.
**Warning signs:** Simple queries taking >1s; works with few rows but degrades with scale.

## Code Examples

### Supabase Auth: Email Sign Up

```typescript
// Source: Supabase official React Native quickstart
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
});

// Auto-create profile on signup via database trigger
// CREATE FUNCTION handle_new_user()
// RETURNS TRIGGER AS $$
// BEGIN
//   INSERT INTO public.profiles (id, display_name)
//   VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
//   RETURN NEW;
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;
//
// CREATE TRIGGER on_auth_user_created
//   AFTER INSERT ON auth.users
//   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Household Creation with Admin Role

```typescript
async function createHousehold(name: string) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Insert household
  const { data: household, error: hError } = await supabase
    .from('households')
    .insert({ name, created_by: userId })
    .select()
    .single();

  if (hError) throw hError;

  // Add creator as admin
  const { error: mError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: userId,
      role: 'admin',
    });

  if (mError) throw mError;
  return household;
}
```

### Join Household via Invite Code

```typescript
async function joinHousehold(inviteCode: string) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Look up household by invite code
  const { data: household, error: lookupError } = await supabase
    .from('households')
    .select('id, name')
    .eq('invite_code', inviteCode.toLowerCase())
    .single();

  if (lookupError || !household) throw new Error('Invalid invite code');

  // Check if already a member
  const { data: existing } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', household.id)
    .eq('user_id', userId)
    .single();

  if (existing) throw new Error('Already a member');

  // Add as member
  const { error } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: userId,
      role: 'member',
    });

  if (error) throw error;
  return household;
}
```

### Design System Color Tokens

```typescript
// src/theme/colors.ts
// Extracted from Stitch UI mockup Tailwind config
export const colors = {
  primary: '#334537',
  primaryContainer: '#4a5d4e',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#c0d5c2',
  primaryFixed: '#d3e8d5',
  primaryFixedDim: '#b7ccb9',

  secondary: '#904d00',
  secondaryContainer: '#fe932c',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#663500',
  secondaryFixed: '#ffdcc3',
  secondaryFixedDim: '#ffb77d',

  tertiary: '#3b4436',
  tertiaryContainer: '#535b4c',
  tertiaryFixed: '#dde6d2',
  tertiaryFixedDim: '#c0c9b7',

  surface: '#fbf9f5',
  surfaceDim: '#dbdad6',
  surfaceBright: '#fbf9f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f3ef',
  surfaceContainer: '#efeeea',
  surfaceContainerHigh: '#eae8e4',
  surfaceContainerHighest: '#e4e2de',
  surfaceVariant: '#e4e2de',

  onSurface: '#1b1c1a',
  onSurfaceVariant: '#434843',
  onBackground: '#1b1c1a',
  background: '#fbf9f5',

  outline: '#737872',
  outlineVariant: '#c3c8c1',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  inverseSurface: '#30312e',
  inverseOnSurface: '#f2f0ed',
  inversePrimary: '#b7ccb9',

  surfaceTint: '#506354',
} as const;
```

### Design System Typography

```typescript
// src/theme/typography.ts
import { TextStyle } from 'react-native';

export const fontFamily = {
  headline: 'PlusJakartaSans',
  headlineBold: 'PlusJakartaSans_700Bold',
  headlineExtraBold: 'PlusJakartaSans_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  label: 'Inter_500Medium',
} as const;

export const typography: Record<string, TextStyle> = {
  displayLg: { fontFamily: fontFamily.headlineExtraBold, fontSize: 36, lineHeight: 44, letterSpacing: -0.5 },
  headlineLg: { fontFamily: fontFamily.headlineBold, fontSize: 28, lineHeight: 36, letterSpacing: -0.25 },
  headlineMd: { fontFamily: fontFamily.headlineBold, fontSize: 24, lineHeight: 32 },
  titleLg: { fontFamily: fontFamily.bodySemiBold, fontSize: 20, lineHeight: 28 },
  titleMd: { fontFamily: fontFamily.bodySemiBold, fontSize: 16, lineHeight: 24 },
  bodyLg: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: fontFamily.body, fontSize: 12, lineHeight: 16 },
  labelLg: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMd: { fontFamily: fontFamily.label, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSm: { fontFamily: fontFamily.label, fontSize: 10, lineHeight: 14, letterSpacing: 0.5, textTransform: 'uppercase' },
};
```

### Ambient Shadow Presets

```typescript
// src/theme/shadows.ts
import { ViewStyle } from 'react-native';

export const shadows: Record<string, ViewStyle> = {
  editorial: {
    shadowColor: '#1b1c1a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 2,
  },
  float: {
    shadowColor: '#1b1c1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#1b1c1a',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 8,
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Navigation standalone | expo-router (file-based) | Expo SDK 49+ (2023) | No manual route config; URL-based deep linking free |
| Expo SDK 52 / RN 0.76 | Expo SDK 55 / RN 0.83 / React 19.2 | Feb 2026 | New Architecture default; Legacy Architecture removed |
| `expo-auth-session` for OAuth | `@react-native-google-signin/google-signin` + `signInWithIdToken` | 2024+ | Native flow is more reliable; no redirect URI issues on iOS |
| `react-native-url-polyfill` manual install | Still needed for Supabase | Ongoing | Supabase client needs URL polyfill in React Native |
| expo-router v4 | expo-router v7 (SDK 55) | Feb 2026 | New Stack API with composable React components for headers |

**Deprecated/outdated:**
- `expo-auth-session` for native OAuth: Use native sign-in libraries instead; `expo-auth-session` is web-redirect-based
- `expo-av`: No longer maintained as of SDK 54+; replaced by `expo-video` and `expo-audio`
- Legacy Architecture: Removed in SDK 55; New Architecture is now the only option

## Open Questions

1. **Invite Link Deep Linking Configuration**
   - What we know: expo-router supports file-based deep link routes. Universal Links require domain association file hosting.
   - What's unclear: Whether to use custom URL scheme (`mise://join/CODE`) for MVP simplicity or full Universal Links (`https://mise.app/join/CODE`) which requires domain + AASA file hosting.
   - Recommendation: Start with custom URL scheme for MVP; Universal Links can be added later. Use expo-router's `app/join/[code].tsx` route either way.

2. **Profile Trigger vs. Client-Side Insert**
   - What we know: Supabase recommends a database trigger on `auth.users` to auto-create a profile row on signup.
   - What's unclear: Whether the trigger approach works cleanly with Google OAuth (which may provide different metadata).
   - Recommendation: Use the trigger approach with `COALESCE` for metadata fields; it handles both email signup and OAuth consistently.

3. **expo-symbols vs. @expo/vector-icons for Material Symbols**
   - What we know: `expo-symbols` uses Material Symbols on Android/web and SF Symbols on iOS. The mockups use Material Symbols Outlined specifically.
   - What's unclear: Whether `expo-symbols` provides the exact same glyph names as the mockups' `material-symbols-outlined` web font.
   - Recommendation: Use `@expo/vector-icons`'s `MaterialCommunityIcons` or `MaterialIcons` as a reliable cross-platform fallback. Alternatively, bundle the Material Symbols Outlined font as a custom icon font for exact parity with mockups.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (bundled with Expo) + React Native Testing Library |
| Config file | None -- Wave 0 must create jest.config.js and setup |
| Quick run command | `npx jest --testPathPattern=src --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Email/password signup calls supabase.auth.signUp | unit | `npx jest tests/auth.test.ts -t "signup" -x` | Wave 0 |
| AUTH-02 | Google OAuth calls signInWithIdToken with nonce | unit | `npx jest tests/auth.test.ts -t "google" -x` | Wave 0 |
| AUTH-03 | Supabase client configured with AsyncStorage persistence | unit | `npx jest tests/supabase-client.test.ts -x` | Wave 0 |
| HOUS-01 | createHousehold inserts household + admin member | unit | `npx jest tests/household.test.ts -t "create" -x` | Wave 0 |
| HOUS-02 | Invite code generated and shareable | unit | `npx jest tests/household.test.ts -t "invite" -x` | Wave 0 |
| HOUS-03 | joinHousehold with valid code adds member | unit | `npx jest tests/household.test.ts -t "join" -x` | Wave 0 |
| HOUS-04 | Member list query returns profiles with roles | unit | `npx jest tests/household.test.ts -t "members" -x` | Wave 0 |
| HOUS-05 | Active household switch updates store | unit | `npx jest tests/stores/householdStore.test.ts -x` | Wave 0 |
| DSGN-01 | Theme tokens match design system specification | unit | `npx jest tests/theme.test.ts -x` | Wave 0 |
| DSGN-02 | Color tokens exported with correct hex values | unit | `npx jest tests/theme.test.ts -t "colors" -x` | Wave 0 |
| DSGN-03 | Fonts load without error | integration | Manual -- verify in Expo Go | N/A |
| DSGN-04 | Tab bar renders 5 tabs | component | `npx jest tests/components/TabBar.test.tsx -x` | Wave 0 |
| DSGN-05 | Bottom sheet renders with drag handle | component | `npx jest tests/components/BottomSheet.test.tsx -x` | Wave 0 |
| DSGN-06 | Skeleton component renders shimmer animation | component | `npx jest tests/components/Skeleton.test.tsx -x` | Wave 0 |
| PROF-01 | Profile screen renders user data | component | `npx jest tests/screens/profile.test.tsx -x` | Wave 0 |
| PROF-06 | Sign out clears session and navigates to auth | unit | `npx jest tests/auth.test.ts -t "signout" -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx jest --passWithNoTests --bail`
- **Per wave merge:** `npx jest --passWithNoTests`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `jest.config.js` -- Jest configuration for Expo + TypeScript
- [ ] `tests/setup.ts` -- Mock setup for Supabase client, AsyncStorage, navigation
- [ ] `tests/auth.test.ts` -- Covers AUTH-01, AUTH-02, AUTH-03, PROF-06
- [ ] `tests/household.test.ts` -- Covers HOUS-01, HOUS-02, HOUS-03, HOUS-04
- [ ] `tests/stores/householdStore.test.ts` -- Covers HOUS-05
- [ ] `tests/theme.test.ts` -- Covers DSGN-01, DSGN-02
- [ ] `tests/components/TabBar.test.tsx` -- Covers DSGN-04
- [ ] Framework install: `npx expo install jest-expo @testing-library/react-native @testing-library/jest-native`

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- SDK 55 features, React Native 0.83, React 19.2
- [Supabase Auth React Native Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native) -- email/password auth, AsyncStorage config
- [Supabase Google OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google) -- signInWithIdToken pattern
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/) -- file-based routing, tabs, nested stacks
- [Expo Fonts Documentation](https://docs.expo.dev/develop/user-interface/fonts/) -- Google Fonts integration
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- policy patterns
- [Stitch UI Mockups](stitch_ui/stitch_grocery_list/) -- HTML/Tailwind reference implementations with exact color tokens (project-local)
- [DESIGN.md](stitch_ui/stitch_grocery_list/mise_en_place/DESIGN.md) -- "The Culinary Curator" design system specification (project-local)

### Secondary (MEDIUM confidence)
- [@gorhom/bottom-sheet GitHub](https://github.com/gorhom/react-native-bottom-sheet) -- v5 with Reanimated v3
- [@expo-google-fonts npm](https://www.npmjs.com/package/@expo-google-fonts/plus-jakarta-sans) -- font package availability
- [Expo Using Supabase Guide](https://docs.expo.dev/guides/using-supabase/) -- official Expo + Supabase integration
- [Multiple blog posts on nonce handling](https://readwriteexercise.com/posts/google-signin-expo-supabase/) -- iOS Google OAuth nonce pattern

### Tertiary (LOW confidence)
- expo-symbols icon name parity with Material Symbols Outlined web font -- needs validation against mockup icon names

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries verified via official docs and npm; SDK 55 is current stable
- Architecture: HIGH -- expo-router file-based routing and Supabase patterns are well-documented standards
- Pitfalls: HIGH -- Nonce issue, RLS gotchas, session persistence are all well-documented community pain points
- Design system: HIGH -- Color tokens extracted directly from project's own Stitch UI mockup Tailwind config
- Icon parity: LOW -- Need to verify expo-symbols glyph names match mockup Material Symbols Outlined names

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable ecosystem, 30-day validity)
