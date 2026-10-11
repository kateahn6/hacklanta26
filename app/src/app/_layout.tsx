import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { C } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth';
import { DataProvider } from '@/lib/data';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <StatusBar style="dark" />
          {/* Headers are off: every screen draws the prototype's own detailTop row. */}
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: C.cream },
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="new-entry" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="share" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="postcard" options={{ presentation: 'modal' }} />
          </Stack>
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
