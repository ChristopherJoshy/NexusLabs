import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';

import { AppProviders } from '@/providers/app-providers';
import { useAuth } from '@/stores/auth';
import { useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootNavigator() {
  const theme = useTheme();
  const hydrate = useAuth((state) => state.hydrate);
  const session = useAuth((state) => state.session);
  const hydrated = useAuth((state) => state.hydrated);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const handled = new Set<string>();
    const openAssignment = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      if (data?.kind !== 'assignment-reminder' || typeof data.assignmentId !== 'string') return;

      const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handled.has(responseKey)) return;
      handled.add(responseKey);

      if (!useAuth.getState().session) {
        void Notifications.clearLastNotificationResponseAsync();
        return;
      }

      router.push({ pathname: '/assignment/[id]', params: { id: data.assignmentId } });
      void Notifications.clearLastNotificationResponseAsync();
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(openAssignment);
    const last = Notifications.getLastNotificationResponse();
    if (last) openAssignment(last);
    return () => subscription.remove();
  }, [hydrated, session]);

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: reduceMotion ? 'fade' : 'default',
        }}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="assignment/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
