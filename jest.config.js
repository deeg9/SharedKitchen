module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./tests/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*|@react-native-async-storage/.*|@react-native-google-signin/.*|@gorhom/.*|zustand|react-native-url-polyfill|base64-arraybuffer)',
  ],
};
