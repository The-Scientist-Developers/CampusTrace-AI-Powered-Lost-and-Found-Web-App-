import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Image, StyleSheet } from "react-native";
import {
  Feather,
  MaterialIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
// Import Supabase client
import { getSupabaseClient } from "@campustrace/core";
import { useTheme } from "../contexts/ThemeContext";

// Import main screens
import DashboardScreen from "../screens/main/DashboardScreen";
import BrowseScreen from "../screens/main/BrowseScreen";
import PostItemScreen from "../screens/main/PostItemScreen";
import LeaderboardScreen from "../screens/main/LeaderboardScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import MessagesScreen from "../screens/main/MessagesScreen";
import NotificationScreen from "../screens/main/NotificationScreen";
import ChatScreen from "../screens/main/ChatScreen";
import MyPostsScreen from "../screens/main/MyPostsScreen";

// --- IMPORT NEW SCREENS ---
import SettingsScreen from "../screens/main/SettingsScreen";
import HelpScreen from "../screens/main/HelpScreen";
// Import auth screen for password reset
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator(); // New stack for profile

// Dashboard Stack Navigator (includes nested screens)
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

// --- UPDATED PROFILE STACK ---
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStackNav.Screen name="Settings" component={SettingsScreen} />
      <ProfileStackNav.Screen name="Help" component={HelpScreen} />
      <ProfileStackNav.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </ProfileStackNav.Navigator>
  );
}

export default function MainNavigator() {
  const [profile, setProfile] = useState(null);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let profileListener = null;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (profileListener) {
          supabase.removeChannel(profileListener);
          profileListener = null;
        }

        const userId = session?.user?.id;

        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          if (!userId) return;

          (async () => {
            try {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("avatar_url")
                .eq("id", userId)
                .single();
              setProfile(profileData);
            } catch (error) {
              console.error("Error fetching profile for tab icon:", error);
              setProfile(null);
            }
          })();

          profileListener = supabase
            .channel(`public:profiles:id=eq.${userId}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
                filter: `id=eq.${userId}`,
              },
              (payload) => {
                setProfile((prev) => ({ ...prev, ...payload.new }));
              }
            )
            .subscribe();
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
      if (profileListener) {
        supabase.removeChannel(profileListener);
      }
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = focused ? 28 : 24;
          const avatarUrl = profile?.avatar_url;

          switch (route.name) {
            case "Dashboard":
              return <Feather name="home" size={iconSize} color={color} />;
            case "Browse":
              return <Feather name="search" size={iconSize} color={color} />;
            case "PostItem":
              return (
                <Feather name="plus-square" size={iconSize} color={color} />
              );
            case "Leaderboard":
              return (
                <FontAwesome5 name="trophy" size={iconSize} color={color} />
              );
            case "Profile":
              if (avatarUrl) {
                return (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={[
                      styles.profileIcon,
                      {
                        width: iconSize + 4,
                        height: iconSize + 4,
                        borderRadius: (iconSize + 4) / 2,
                        borderColor: focused ? color : "transparent",
                      },
                    ]}
                  />
                );
              }
              return <Feather name="user" size={iconSize} color={color} />;
            case "MyPosts":
              return (
                <MaterialIcons name="post-add" size={iconSize} color={color} />
              );
            default:
              return <Feather name="home" size={iconSize} color={color} />;
          }
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? "#8E8E93" : "#8E8E93",
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 56,
        },
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen name="PostItem" component={PostItemScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="MyPosts" component={MyPostsScreen} />
      {/* --- UPDATE PROFILE TAB TO USE THE STACK --- */}
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  profileIcon: {
    borderWidth: 2,
  },
});
