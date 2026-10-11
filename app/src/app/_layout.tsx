import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth';
import { DataProvider } from '@/lib/data';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.paper },
              headerTitleStyle: { color: Colors.ink },
              headerTintColor: Colors.accent,
              contentStyle: { backgroundColor: Colors.paper },
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="new-entry" options={{ title: 'New scrapbook entry' }} />
            <Stack.Screen name="share" options={{ title: 'Share this map' }} />
            <Stack.Screen
              name="postcard"
              options={{ title: 'Postcard', presentation: 'modal' }}
            />
          </Stack>
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
