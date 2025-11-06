import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Image } from "react-native";
import { Home, Search, PlusSquare, Trophy, User } from "lucide-react-native";

// Import main screens
import DashboardScreen from "../screens/main/DashboardScreen";
import BrowseScreen from "../screens/main/BrowseScreen";
import PostItemScreen from "../screens/main/PostItemScreen";
import LeaderboardScreen from "../screens/main/LeaderboardScreen";
import ProfileScreen from "../screens/main/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          switch (route.name) {
            case "Dashboard":
              IconComponent = Home;
              break;
            case "Browse":
              IconComponent = Search;
              break;
            case "PostItem":
              IconComponent = PlusSquare;
              break;
            case "Leaderboard":
              IconComponent = Trophy;
              break;
            case "Profile":
              IconComponent = User;
              break;
            default:
              IconComponent = Home;
          }

          return (
            <IconComponent
              size={26}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          );
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0.5,
          borderTopColor: "#DBDBDB",
          paddingBottom: 8,
          paddingTop: 8,
          height: 56,
        },
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen name="PostItem" component={PostItemScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
