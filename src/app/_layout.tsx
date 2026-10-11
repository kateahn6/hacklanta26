import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { FontAssets } from '@/theme/fonts';
import { Colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// Noted! uses one warm light palette in every system appearance.
const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.cream, card: Colors.paper, primary: Colors.cherry, text: Colors.softBlack },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FontAssets);
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.cream } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="map" />
        <Stack.Screen name="postcard/[id]" />
        <Stack.Screen name="scrapbook/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="create/postcard" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create/scrapbook" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create/pick-postcards" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
