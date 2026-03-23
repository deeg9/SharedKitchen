import { Tabs } from 'expo-router';
import { TabBar } from '../../../src/components/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes' }} />
      <Tabs.Screen name="grocery" options={{ title: 'Grocery' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
