# CampusTrace Mobile App Setup Guide

## 📱 React Native (Expo) Mobile App

This guide will help you set up and run the CampusTrace mobile app.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Mac with Xcode
- For Android: Android Studio or Expo Go app on your device

## 📦 Installation

### 1. Install Dependencies from the Root

Navigate to the monorepo root and install all dependencies:

```bash
cd CampusTrace
npm install
```

This will install dependencies for all workspaces (web, mobile, and core).

### 2. Configure Environment Variables

Copy the `.env.example` to `.env` in the mobile app directory:

```bash
cd apps/mobile
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
EXPO_PUBLIC_API_URL=http://your-backend-url:8000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Running the App

### Option 1: From the Root (Recommended)

```bash
cd CampusTrace
npm run dev:mobile
```

### Option 2: From the Mobile Directory

```bash
cd apps/mobile
npm start
```

This will start the Expo development server. You'll see a QR code in the terminal.

## 📱 Running on Devices

### On Your Physical Device (Easiest)

1. Install the **Expo Go** app from:

   - iOS: App Store
   - Android: Google Play Store

2. Scan the QR code shown in the terminal with:
   - iOS: Camera app
   - Android: Expo Go app

### On iOS Simulator (Mac only)

```bash
npm run ios
```

Or press `i` in the Expo terminal.

### On Android Emulator

```bash
npm run android
```

Or press `a` in the Expo terminal.

Make sure you have Android Studio installed with an emulator set up.

## 🎨 UI Framework: NativeWind (Tailwind for React Native)

The mobile app uses **NativeWind**, which brings Tailwind CSS to React Native.

### Using Tailwind Classes

```jsx
<View className="flex-1 bg-white dark:bg-gray-900 p-4">
  <Text className="text-xl font-bold text-primary-600">Hello World</Text>
</View>
```

### Supported Features

- ✅ All Tailwind utility classes
- ✅ Dark mode (`dark:` prefix)
- ✅ Responsive design (use `sm:`, `md:`, `lg:` prefixes)
- ✅ Custom colors defined in `tailwind.config.js`

## 🧭 Navigation Structure

### Auth Stack (Unauthenticated)

- **LoginScreen** - Email/password and magic link login
- **RegisterScreen** - New user registration
- **ForgotPasswordScreen** - Password reset

### Main Tab Navigator (Authenticated)

- **Dashboard** 🏠 - Home screen with stats and recent activity
- **Browse** 🔍 - Search and filter lost & found items
- **Post Item** ➕ - Report lost or found items
- **Messages** 💬 - Chat with other users
- **Profile** 👤 - User profile and settings

## 📂 Project Structure

```
apps/mobile/
├── src/
│   ├── navigation/
│   │   ├── AuthNavigator.js      ← Auth flow navigation
│   │   └── MainNavigator.js      ← Main app with bottom tabs
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.js
│       │   ├── RegisterScreen.js
│       │   └── ForgotPasswordScreen.js
│       └── main/
│           ├── DashboardScreen.js
│           ├── BrowseScreen.js
│           ├── PostItemScreen.js
│           ├── MessagesScreen.js
│           └── ProfileScreen.js
├── App.js                         ← Entry point
├── app.config.js                  ← Expo configuration
├── tailwind.config.js             ← NativeWind config
└── package.json
```

## 🔗 Shared Core Package

The mobile app uses `@campustrace/core` for shared logic with the web app:

```javascript
import {
  apiClient,
  getSupabaseClient,
  initializeApiConfig,
} from "@campustrace/core";

// Initialize in App.js
initializeApiConfig({
  apiBaseUrl: Constants.expoConfig.extra.apiUrl,
  supabaseUrl: Constants.expoConfig.extra.supabaseUrl,
  supabaseAnonKey: Constants.expoConfig.extra.supabaseAnonKey,
});

// Use in components
const supabase = getSupabaseClient();
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

## 🐛 Troubleshooting

### "Cannot find module '@campustrace/core'"

Make sure you've installed dependencies from the root:

```bash
cd ../../   # Go to monorepo root
npm install
```

### Expo not starting

Clear the cache and restart:

```bash
npx expo start -c
```

### Metro bundler errors

Reset Metro cache:

```bash
npx expo start --clear
```

### NativeWind styles not working

1. Make sure `global.css` is imported in `App.js`
2. Check that `tailwind.config.js` includes all your component paths
3. Restart the Metro bundler

## 📱 Building for Production

### Create a Development Build

```bash
npx expo install expo-dev-client
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Create a Production Build

```bash
eas build --profile production --platform all
```

You'll need an [Expo Application Services (EAS)](https://expo.dev/eas) account.

## 🎯 Next Steps

1. **Complete Authentication** - Implement full auth flow with Supabase
2. **Convert More Screens** - Port remaining web screens to mobile
3. **Add Image Upload** - Implement camera and gallery access
4. **Push Notifications** - Set up Expo push notifications
5. **Offline Support** - Add local storage and sync

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Supabase React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)

## 🆘 Need Help?

Check the main monorepo README or reach out to the team!
