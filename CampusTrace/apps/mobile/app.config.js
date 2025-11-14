// app.config.js - Dynamic Expo configuration
export default ({ config }) => {
  // Determine environment based on EAS build profile or default to development
  const environment = process.env.APP_ENV || "development";

  console.log(`📱 Building for environment: ${environment}`);

  return {
    ...config,
    name: "CampusTrace",
    slug: "campustrace-monorepo",
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
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    extra: {
      // These will be accessible via Constants.expoConfig.extra
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      environment,
      eas: {
        projectId: "8d3dfad3-5b4f-4fea-ab86-59762edd8083", // Replace with your EAS project ID after running 'eas build:configure'
      },
    },
  };
};
