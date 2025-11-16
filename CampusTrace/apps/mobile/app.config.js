// app.config.js - Dynamic Expo configuration
export default ({ config }) => {
  // Determine environment based on EAS build profile or default to development
  const environment = process.env.APP_ENV || "development";

  console.log(`📱 Building for environment: ${environment}`);

  // Log environment variables to help debug
  console.log("API URL:", process.env.EXPO_PUBLIC_API_URL);
  console.log(
    "Supabase URL:",
    process.env.EXPO_PUBLIC_SUPABASE_URL ? "Set" : "Missing"
  );
  console.log(
    "Supabase Key:",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"
  );

  return {
    ...config,
    name: "CampusTrace",
    slug: "campustrace-monorepo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/Icon.png",
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
        foregroundImage: "./assets/Icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.campustrace.mobile",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    extra: {
      // These will be accessible via Constants.expoConfig.extra
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.43:8000",
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        "https://cvcxqsdwtcvwgdftsdtp.supabase.co",
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y3hxc2R3dGN2d2dkZnRzZHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2OTQ2NTAsImV4cCI6MjA3MjI3MDY1MH0.QDiwFK_CqhCyyB7XeCYLJKcNoYVflVVCgDod6IIyOPA",
      environment,
      eas: {
        projectId: "8d3dfad3-5b4f-4fea-ab86-59762edd8083", // Replace with your EAS project ID after running 'eas build:configure'
      },
    },
  };
};
