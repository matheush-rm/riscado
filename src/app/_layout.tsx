import { Bangers_400Regular } from '@expo-google-fonts/bangers';
import { Kalam_400Regular, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { PermanentMarker_400Regular } from '@expo-google-fonts/permanent-marker';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { DrawerMenu } from '@/components/DrawerMenu';
import { useAutoSync } from '@/sync/useAutoSync';
import { ImpactLayer } from '@/ui/impact/ImpactLayer';
import { useWidgetSync } from '@/widget/useWidgetSync';
import { colors } from '@/ui/theme';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(colors.bg);

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.text, primary: colors.accent },
};

export default function RootLayout() {
  const [loaded] = useFonts({ Bangers_400Regular, Kalam_400Regular, Kalam_700Bold, PermanentMarker_400Regular });
  useAutoSync();
  useWidgetSync();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          <Drawer
            drawerContent={(p) => <DrawerMenu {...p} />}
            screenOptions={{
              headerShown: false,
              swipeEdgeWidth: 28,
              drawerType: 'front',
              overlayColor: '#000b',
              drawerStyle: { backgroundColor: 'transparent', width: 300 },
            }}
          >
            <Drawer.Screen name="index" />
            <Drawer.Screen name="feitas" />
            <Drawer.Screen name="github" />
          </Drawer>
          <ImpactLayer />
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
