export default {
  expo: {
    name: "CampusTrace",
    slug: "campustrace-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.campustrace.mobile",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.campustrace.mobile",
    },
    web: {
      favicon: "./Icon.svg",
      bundler: "metro", // Use Metro for web so monorepo packages are transpiled
    },
    // This 'extra' block is where you need to add the ID
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000",
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

      // === ADD THIS BLOCK ===
      eas: {
        // You must get this value from https://expo.dev/projects
        // The ID from your command is likely the correct one:
        projectId: "7396e0a2-33f6-41b9-8f78-4fc5d0d7a128",
      },
      // ======================
    },
    plugins: [],
  },
};
