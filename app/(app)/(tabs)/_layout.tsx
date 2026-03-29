import { Tabs } from 'expo-router';
import { TabBar } from '../../../src/components/ui/TabBar';
import { useKitchenDataSync } from '../../../src/hooks/useKitchenDataSync';

export default function TabsLayout() {
  useKitchenDataSync();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes' }} />
      <Tabs.Screen name="grocery" options={{ title: 'Kitchen' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
