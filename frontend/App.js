import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts as useOutfit, Outfit_500Medium, Outfit_700Bold, Outfit_900Black } from '@expo-google-fonts/outfit';
import { useFonts as useManrope, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/constants';
import {
  registerForPushNotificationsAsync,
  addNotificationListeners,
  removeNotificationListeners,
  getNotificationNavigationTarget,
} from './src/utils/pushNotifications';

// Main App wrapper with navigation reference
function AppContent({ fontsReady }) {
  const navigationRef = useRef(null);
  const notificationListener = useRef(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Register for push notifications when authenticated
      registerForPushNotificationsAsync();

      // Set up notification listeners
      const subscriptions = addNotificationListeners(
        // Foreground notification received
        (notification) => {
          console.log('Notification received in foreground:', notification.request.content.title);
        },
        // User tapped notification
        (response) => {
          const target = getNotificationNavigationTarget(response.notification);
          if (navigationRef.current && target.screen) {
            navigationRef.current.navigate(target.screen, target.params);
          }
        }
      );
      notificationListener.current = subscriptions;

      return () => {
        if (notificationListener.current) {
          removeNotificationListeners(notificationListener.current);
        }
      };
    }
  }, [isAuthenticated]);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        ...NavDarkTheme,
        dark: true,
        colors: {
          ...NavDarkTheme.colors,
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.backgroundLight,
          text: COLORS.text,
          border: COLORS.border,
          notification: COLORS.accent,
        },
        fonts: NavDarkTheme.fonts || {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <StatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [outfitLoaded] = useOutfit({ Outfit_500Medium, Outfit_700Bold, Outfit_900Black });
  const [manropeLoaded] = useManrope({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold });
  const fontsReady = outfitLoaded && manropeLoaded;

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent fontsReady={fontsReady} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
