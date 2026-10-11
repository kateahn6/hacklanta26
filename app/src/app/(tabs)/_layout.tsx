import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/navigation/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Explore' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
    </Tabs>
  );
}
