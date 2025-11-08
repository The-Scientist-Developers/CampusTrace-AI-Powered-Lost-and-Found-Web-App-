import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import Constants from "expo-constants";
import { initializeApiConfig, getSupabaseClient } from "@campustrace/core";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Import navigators
import AuthNavigator from "./src/navigation/AuthNavigator";
import MainNavigator from "./src/navigation/MainNavigator";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Initialize Supabase client
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

    console.log("[App] Initializing with env:", {
      apiUrl,
      hasSupabase: !!(supabaseUrl && supabaseAnonKey),
    });

    if (supabaseUrl && supabaseAnonKey) {
      initializeApiConfig({
        apiBaseUrl: apiUrl,
        supabaseUrl,
        supabaseAnonKey,
      });

      // Get the initialized Supabase client
      const supabase = getSupabaseClient();

      if (supabase) {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log(
            "[App] Session loaded:",
            session ? "authenticated" : "no session"
          );
          setSession(session);
          setIsLoading(false);
        });

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log(
            "[App] Auth state changed:",
            _event,
            session ? "authenticated" : "signed out"
          );
          setSession(session);
        });

        return () => subscription?.unsubscribe();
      }
    } else {
      console.warn("[App] Supabase credentials missing - running without auth");
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        {session ? <MainNavigator /> : <AuthNavigator />}
        <StatusBar style="auto" />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
