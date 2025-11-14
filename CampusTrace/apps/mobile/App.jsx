import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, LogBox } from "react-native";
import { useEffect, useState } from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { initializeApiConfig, getSupabaseClient } from "@campustrace/core";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { supabaseStorage } from "./src/utils/supabaseStorage";
import * as Notifications from "expo-notifications";

import AuthNavigator from "./src/navigation/AuthNavigator";
import MainNavigator from "./src/navigation/MainNavigator";

// Suppress known warnings for Expo Go limitations
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "setLayoutAnimationEnabledExperimental",
  "expo-notifications functionality is not fully supported in Expo Go",
]);

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  // Effect to run ONCE for listeners
  useEffect(() => {
    const apiUrl =
      process.env.EXPO_PUBLIC_API_URL ||
      Constants.expoConfig?.extra?.apiUrl ||
      "http://localhost:8000";
    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      Constants.expoConfig?.extra?.supabaseUrl;
    const supabaseAnonKey =
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      Constants.expoConfig?.extra?.supabaseAnonKey;

    if (supabaseUrl && supabaseAnonKey) {
      initializeApiConfig({
        apiBaseUrl: apiUrl,
        supabaseUrl,
        supabaseAnonKey,
        storage: supabaseStorage,
      });

      const supabase = getSupabaseClient();

      if (supabase) {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setIsLoading(false);
        });

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });

        // Listen for notification taps
        const responseListener =
          Notifications.addNotificationResponseReceivedListener((response) => {
            const url = response.notification.request.content.data?.url;
            if (url) {
              // Let the router handle auth checks
              if (url.includes("/messages")) {
                navigation.navigate("Messages");
              }
              // Add other routes here
            }
          });

        return () => {
          subscription?.unsubscribe();
          responseListener.remove(); // This is the correct way
        };
      }
    } else {
      console.warn("[App] Supabase credentials missing");
      setIsLoading(false);
    }
  }, [navigation]); // Only depends on navigation, which is stable

  // --- NEW Effect ---
  // This effect runs ONLY when the session state changes
  useEffect(() => {
    if (session) {
      // User is logged in, register for push
      console.log("Session detected, attempting push registration...");
      import("./src/utils/pushNotifications")
        .then((module) => {
          if (
            module &&
            typeof module.registerForPushNotificationsAsync === "function"
          ) {
            module.registerForPushNotificationsAsync();
          }
        })
        .catch((err) => {
          console.warn("Failed to load pushNotifications module:", err);
        });
    }
    // If session becomes null (logged out), we don't need to do anything
  }, [session]); // This is the key change

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {session ? <MainNavigator /> : <AuthNavigator />}
      <StatusBar style={isDark ? "light" : "dark"} />
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </ThemeProvider>
  );
}
