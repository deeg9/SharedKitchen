import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const { session, initialized } = useAuthStore();

  if (!initialized) return null;

  if (session) {
    return <Redirect href="/(app)/(tabs)/plan" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
