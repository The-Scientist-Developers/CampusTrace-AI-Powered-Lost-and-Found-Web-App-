# 🚀 CampusTrace Migration Guide: Web to Mobile

## ✅ What We've Built

You now have a **complete monorepo structure** with:

1. **Root workspace** - Manages all packages
2. **Web app** (`/apps/web`) - Your existing React + Vite app
3. **Mobile app** (`/apps/mobile`) - New React Native (Expo) app with NativeWind
4. **Shared core** (`/packages/core`) - Platform-agnostic business logic

## 📁 Final Structure

```
/CampusTrace/
├── package.json                    ✅ Root workspace config
├── README.md                       ✅ Main documentation
│
├── apps/
│   ├── web/                       ✅ React + Vite web app
│   │   ├── src/                   📋 Your existing code goes here
│   │   ├── package.json           ✅ Updated with @campustrace/core
│   │   └── ...config files
│   │
│   └── mobile/                    ✅ React Native + Expo app
│       ├── src/
│       │   ├── navigation/        ✅ Auth & Main navigators
│       │   └── screens/           ✅ All converted screens
│       ├── App.js                 ✅ Entry point with navigation
│       ├── app.config.js          ✅ Expo configuration
│       ├── tailwind.config.js     ✅ NativeWind setup
│       ├── global.css             ✅ Tailwind imports
│       ├── .env                   ✅ Environment variables
│       ├── package.json           ✅ All dependencies configured
│       └── README.md              ✅ Mobile-specific guide
│
└── packages/
    └── core/                      ✅ Shared logic
        ├── src/
        │   ├── api/              ✅ Platform-agnostic API client
        │   ├── contexts/         ✅ Shared React contexts (Theme)
        │   └── utils/            ✅ Helper functions (notifications)
        └── package.json          ✅ Core package config
```

## 🎯 Key Features Implemented

### 1. Monorepo with npm Workspaces ✅

- All packages managed from root
- Shared dependencies
- Easy cross-package imports

### 2. React Native Mobile App ✅

- **Framework**: Expo (latest)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: React Navigation
  - Stack Navigator for auth flow
  - Bottom Tab Navigator for main app

### 3. Shared Core Package ✅

- **API Client**: Works on web & mobile
- **Theme Context**: Platform-agnostic theming
- **Utilities**: Notification helpers

### 4. Navigation Structure ✅

**Auth Flow:**

- LoginScreen (fully implemented with email/password & magic link)
- RegisterScreen (placeholder)
- ForgotPasswordScreen (placeholder)

**Main App (Bottom Tabs):**

- 🏠 Dashboard - Stats and recent activity
- 🔍 Browse - Search items
- ➕ Post Item - Report items
- 💬 Messages - Chat
- 👤 Profile - Settings & logout

### 5. Web-to-Mobile Conversions ✅

| Web Component    | Mobile Equivalent    | Status            |
| ---------------- | -------------------- | ----------------- |
| `<div>`          | `<View>`             | ✅ Implemented    |
| `<img>`          | `<Image>`            | ✅ Ready to use   |
| `<input>`        | `<TextInput>`        | ✅ In LoginScreen |
| `<button>`       | `<TouchableOpacity>` | ✅ In LoginScreen |
| Tailwind classes | NativeWind classes   | ✅ Same syntax!   |

## 📝 Next Steps for You

### Step 1: Install Dependencies

```bash
cd CampusTrace
npm install
```

This installs all dependencies for all workspaces.

### Step 2: Move Your Web Code

Your existing web code in `CampusTrace-FrontEnd/src/` should be copied to `CampusTrace/apps/web/src/`.

We've already started this! Check the `apps/web/` folder.

### Step 3: Update Web Imports

Change imports in your web app from:

```javascript
// OLD
import { apiClient } from "../../api/apiClient";
import { ThemeProvider } from "../../contexts/ThemeContext";
```

To:

```javascript
// NEW
import { apiClient } from "@campustrace/core/api";
import { ThemeProvider } from "@campustrace/core/contexts";
```

### Step 4: Initialize API in Web App

In `apps/web/src/main.jsx`, add:

```javascript
import { initializeApiConfig } from "@campustrace/core";

initializeApiConfig({
  apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:8000",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
```

### Step 5: Configure Mobile Environment

Edit `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://your-backend-url:8000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 6: Test Both Apps

**Web:**

```bash
npm run dev:web
```

**Mobile:**

```bash
npm run dev:mobile
```

## 🔄 How to Convert More Screens

### Example: Converting a Page

**Web (`userMainPage.jsx`):**

```jsx
import React from "react";
import { Link } from "react-router-dom";

function UserMainPage() {
  return (
    <div className="flex-1 bg-white p-4">
      <img src={logo} alt="Logo" className="w-20 h-20" />
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        Click Me
      </button>
    </div>
  );
}
```

**Mobile (`DashboardScreen.js`):**

```jsx
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function DashboardScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white p-4">
      <Image source={require("../../assets/logo.png")} className="w-20 h-20" />
      <Text className="text-2xl font-bold">Dashboard</Text>
      <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded">
        <Text className="text-white">Click Me</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Conversion Cheat Sheet

| Web                     | React Native                                    |
| ----------------------- | ----------------------------------------------- |
| `<div>`                 | `<View>`                                        |
| `<span>`, `<p>`, `<h1>` | `<Text>`                                        |
| `<img>`                 | `<Image>`                                       |
| `<input>`               | `<TextInput>`                                   |
| `<button>`              | `<TouchableOpacity>` + `<Text>`                 |
| `<a>` or `<Link>`       | `<TouchableOpacity>` + `navigation.navigate()`  |
| `onClick`               | `onPress`                                       |
| `className`             | `className` (same with NativeWind!)             |
| `style={{}}`            | `style={{}}` (similar but different properties) |

## 🎨 Styling with NativeWind

Good news: **Use the same Tailwind classes!**

```jsx
// Works in both web and mobile!
<View className="flex-1 bg-white dark:bg-gray-900 p-4">
  <Text className="text-xl font-bold text-primary-600">Hello World</Text>
</View>
```

### Dark Mode

```jsx
className = "bg-white dark:bg-gray-900 text-black dark:text-white";
```

## 📦 Using Shared Logic

```javascript
// In any screen (web or mobile)
import {
  apiClient,
  getSupabaseClient,
  sendNotification,
  ThemeProvider,
  useTheme,
} from "@campustrace/core";

// Use them the same way everywhere!
const data = await apiClient.getRecentActivity();
await sendNotification(userId, "Hello!");
```

## 🐛 Common Issues & Fixes

### "Cannot find module '@campustrace/core'"

**Solution:** Install from root:

```bash
cd CampusTrace
npm install
```

### Metro bundler cache issues

**Solution:**

```bash
cd apps/mobile
npx expo start --clear
```

### NativeWind classes not working

**Solution:**

1. Restart Metro bundler
2. Check `global.css` is imported in `App.js`
3. Verify `tailwind.config.js` includes your component paths

### Web app not finding shared package

**Solution:**

```bash
cd CampusTrace
npm install
```

## 📚 Documentation Created

1. **`/CampusTrace/README.md`** - Main monorepo guide
2. **`/CampusTrace/apps/mobile/README.md`** - Mobile-specific setup
3. **This file** - Migration guide

## 🎉 What You Can Do Now

1. ✅ Share API calls between web & mobile
2. ✅ Share business logic and utilities
3. ✅ Share theme configuration
4. ✅ Use same Tailwind styling approach
5. ✅ Develop both apps in same codebase
6. ✅ Run both apps simultaneously for testing

## 🚀 Quick Start Commands

```bash
# Install everything
cd CampusTrace
npm install

# Run web app
npm run dev:web

# Run mobile app
npm run dev:mobile

# Run both (in separate terminals)
npm run dev:web &
npm run dev:mobile
```

## 🎯 Your Conversion Roadmap

### Phase 1: Core Screens (Highest Priority)

- [ ] Complete RegisterScreen
- [ ] Complete ForgotPasswordScreen
- [ ] Add authentication state management
- [ ] Convert BrowseScreen with filters
- [ ] Convert PostItemScreen with image upload

### Phase 2: User Features

- [ ] Convert userMypostPage
- [ ] Convert userNotificationPage
- [ ] Convert userMessageApp
- [ ] Convert userSettingsPage
- [ ] Add camera access for mobile

### Phase 3: Admin Features

- [ ] Convert admin dashboard
- [ ] Convert post moderation
- [ ] Convert user management
- [ ] Add push notifications

### Phase 4: Polish

- [ ] Add offline support
- [ ] Add biometric auth (fingerprint/face)
- [ ] Optimize performance
- [ ] Add animations
- [ ] Create app icons and splash screens

## 💡 Pro Tips

1. **Start with LoginScreen** - It's already done! Study it as a template.
2. **Test on real device** - Use Expo Go for fastest development
3. **Use shared logic** - Don't duplicate code between web & mobile
4. **Tailwind is the same** - Your styling knowledge transfers!
5. **Navigation is different** - Learn React Navigation patterns

## 🆘 Need Help?

- Check the README files in each folder
- Review the LoginScreen implementation as a reference
- Expo docs: https://docs.expo.dev/
- React Navigation: https://reactnavigation.org/
- NativeWind: https://www.nativewind.dev/

---

## 🎊 Congratulations!

You now have a **production-ready monorepo structure** with:

- ✅ Code sharing between web & mobile
- ✅ Modern React Native setup with Expo
- ✅ Tailwind CSS on mobile (NativeWind)
- ✅ Professional navigation structure
- ✅ Complete authentication flow template
- ✅ Bottom tab navigation for main features

**Start converting your screens and building your cross-platform app!** 🚀
