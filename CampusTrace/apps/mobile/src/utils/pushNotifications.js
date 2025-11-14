import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getSupabaseClient } from "@campustrace/core";
import Constants from "expo-constants";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  // Check if running in Expo Go (development)
  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    console.log(
      "📱 Running in Expo Go - Push notifications limited in development"
    );
    // Still continue to set up local notifications
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Failed to get push token: Permission not granted.");
    return;
  }

  // Skip token registration in Expo Go to avoid warnings
  if (isExpoGo) {
    console.log("⚠️ Skipping push token registration in Expo Go");
    return;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error(
        "EAS projectId not found in app.json/app.config.js. Go to https://expo.dev/projects to find it."
      );
      return;
    }

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = expoPushToken;
  } catch (e) {
    console.error("Failed to get Expo push token:", e);
  }

  if (!token) {
    console.error("Expo push token is undefined.");
    return;
  }

  // === Save the token to your backend ===
  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("No user logged in, cannot save push token.");
      return;
    }

    // --- THIS IS THE LOOP-BREAKING FIX ---
    // 1. Get the current token from the profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    // 2. Check if the token is already the same
    if (profile && profile.push_token === token) {
      console.log("Push token is already up-to-date.");
      return; // Do nothing
    }

    // 3. If it's different (or new), update it
    console.log("New or different push token, updating profile...");
    const { error } = await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", user.id);

    if (error) throw error;

    console.log("Successfully saved new push token to user profile.");
    // --- END OF FIX ---
  } catch (error) {
    console.error("Error saving push token to Supabase:", error);
  }

  return token;
}
