// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  })),
  useSegments: jest.fn(() => []),
  useRootNavigationState: jest.fn(() => ({ key: 'test' })),
  Slot: 'Slot',
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
  Link: 'Link',
  Redirect: 'Redirect',
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() =>
      Promise.resolve({
        data: {
          idToken: 'mock-id-token',
          user: {
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      })
    ),
    signOut: jest.fn(() => Promise.resolve()),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

// Mock Supabase client
jest.mock('../src/lib/supabase', () => {
  const mockAuth = {
    signUp: jest.fn(() =>
      Promise.resolve({
        data: { user: { id: 'mock-user-id', email: 'test@example.com' }, session: null },
        error: null,
      })
    ),
    signInWithPassword: jest.fn(() =>
      Promise.resolve({
        data: {
          user: { id: 'mock-user-id', email: 'test@example.com' },
          session: { access_token: 'mock-token', user: { id: 'mock-user-id' } },
        },
        error: null,
      })
    ),
    signInWithIdToken: jest.fn(() =>
      Promise.resolve({
        data: {
          user: { id: 'mock-user-id', email: 'test@example.com' },
          session: { access_token: 'mock-token', user: { id: 'mock-user-id' } },
        },
        error: null,
      })
    ),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getUser: jest.fn(() =>
      Promise.resolve({
        data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
        error: null,
      })
    ),
    getSession: jest.fn(() =>
      Promise.resolve({
        data: { session: null },
        error: null,
      })
    ),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  };

  return {
    supabase: {
      auth: mockAuth,
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      functions: {
        invoke: jest.fn(() => Promise.resolve({ data: null, error: null })),
      },
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn(),
      })),
      removeChannel: jest.fn(),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() => Promise.resolve({ data: { path: 'mock-path' }, error: null })),
          getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://mock-url.com/image.jpg' } })),
        })),
      },
    },
  };
});

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => Promise.resolve('mock-hashed-nonce')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
  getRandomBytes: jest.fn(() => new Uint8Array(16)),
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name, ...props }: any) => (
      <Text testID={`icon-${name}`} {...props}>{name}</Text>
    ),
    MaterialIcons: ({ name, ...props }: any) => (
      <Text testID={`icon-${name}`} {...props}>{name}</Text>
    ),
  };
});

// Mock expo-blur
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return {
    BlurView: ({ children, ...props }: any) => (
      <View testID="blur-view" {...props}>{children}</View>
    ),
  };
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: [] })
  ),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock @shopify/flash-list
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return {
    FlashList: FlatList,
    MasonryFlashList: FlatList,
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));
