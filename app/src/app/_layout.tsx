import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/lib/auth';
import { DEV_SKIP_AUTH } from '@/lib/config';
import { DataProvider } from '@/lib/data';
import { FontAssets } from '@/theme/fonts';
import { Colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// Noted! uses one warm light palette in every system appearance.
const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.background, card: Colors.surface, primary: Colors.navy, text: Colors.text },
};

/**
 * Keeps the signed-out user on /login and the signed-in user off it. Lives
 * inside AuthProvider because it reads the session.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, session } = useAuth();
  const segments = useSegments();
  const onLogin = segments[0] === 'login';

  useEffect(() => {
    if (!ready) return;
    // EXPO_PUBLIC_DEV_SKIP_AUTH=1 runs the UI on seed content without Auth0.
    if (DEV_SKIP_AUTH) {
      if (onLogin) router.replace('/');
      return;
    }
    if (!session && !onLogin) router.replace('/login');
    if (session && onLogin) router.replace('/');
  }, [onLogin, ready, session]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FontAssets);
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <AuthProvider>
      {/* DataProvider holds the live API content every screen reads via useContent. */}
      <DataProvider>
        <ThemeProvider value={theme}>
          <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="map" />
            <Stack.Screen name="postcard/[id]" />
            <Stack.Screen name="scrapbook/[id]" />
            <Stack.Screen name="create/postcard" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="create/scrapbook" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="join" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
          </AuthGate>
          <StatusBar style="dark" />
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  );
}
