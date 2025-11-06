# 🚀 Quick Start Guide - CampusTrace Monorepo

## Installation & Setup

```bash
# 1. Navigate to the monorepo root
cd CampusTrace

# 2. Install all dependencies
npm install

# 3. Configure mobile environment variables
cd apps/mobile
cp .env .env.local
# Edit .env with your API and Supabase credentials

# 4. Return to root
cd ../..
```

## Running the Apps

### Web App

```bash
# From root
npm run dev:web

# Or from web directory
cd apps/web
npm run dev
```

Access at: `http://localhost:5173`

### Mobile App

```bash
# From root
npm run dev:mobile

# Or from mobile directory
cd apps/mobile
npm start
```

Then:

- Scan QR code with Expo Go app (iOS/Android)
- Press `i` for iOS simulator (Mac only)
- Press `a` for Android emulator

## Project Structure

```
CampusTrace/
├── apps/
│   ├── web/          ← React + Vite web app
│   └── mobile/       ← React Native + Expo mobile app
└── packages/
    └── core/         ← Shared code (API, contexts, utils)
```

## Using Shared Code

```javascript
// Import from the shared core package
import { apiClient, getSupabaseClient } from "@campustrace/core";
import { ThemeProvider, useTheme } from "@campustrace/core/contexts";
import { sendNotification } from "@campustrace/core/utils";
```

## Component Conversion Reference

| Web Component           | Mobile Component     | Example                                    |
| ----------------------- | -------------------- | ------------------------------------------ |
| `<div>`                 | `<View>`             | `<View className="flex-1 p-4">`            |
| `<span>`, `<p>`, `<h1>` | `<Text>`             | `<Text className="text-xl">Hello</Text>`   |
| `<img>`                 | `<Image>`            | `<Image source={require('./logo.png')} />` |
| `<input>`               | `<TextInput>`        | `<TextInput placeholder="Email" />`        |
| `<button>`              | `<TouchableOpacity>` | `<TouchableOpacity onPress={fn}>`          |
| `onClick`               | `onPress`            | `onPress={() => console.log('tap')}`       |

## Navigation

### Web (react-router-dom)

```javascript
import { useNavigate, Link } from "react-router-dom";
const navigate = useNavigate();
navigate("/dashboard");
<Link to="/profile">Profile</Link>;
```

### Mobile (React Navigation)

```javascript
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
navigation.navigate('Dashboard');
<TouchableOpacity onPress={() => navigation.navigate('Profile')}>
```

## Styling with NativeWind

**Good news:** Use the same Tailwind classes in both web and mobile!

```jsx
<View className="flex-1 bg-white dark:bg-gray-900 p-4">
  <Text className="text-2xl font-bold text-primary-600">Hello World</Text>
  <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-lg mt-4">
    <Text className="text-white font-semibold">Click Me</Text>
  </TouchableOpacity>
</View>
```

## API Initialization

### Web (`apps/web/src/main.jsx`)

```javascript
import { initializeApiConfig } from "@campustrace/core";

initializeApiConfig({
  apiBaseUrl: import.meta.env.VITE_API_URL,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
```

### Mobile (`apps/mobile/App.js`)

```javascript
import Constants from "expo-constants";
import { initializeApiConfig } from "@campustrace/core";

initializeApiConfig({
  apiBaseUrl: Constants.expoConfig.extra.apiUrl,
  supabaseUrl: Constants.expoConfig.extra.supabaseUrl,
  supabaseAnonKey: Constants.expoConfig.extra.supabaseAnonKey,
});
```

## Mobile App Structure

### Authentication Flow

- `LoginScreen` ✅ (Fully implemented)
- `RegisterScreen` (Placeholder - needs implementation)
- `ForgotPasswordScreen` (Placeholder - needs implementation)

### Main App (Bottom Tabs)

- 🏠 **Dashboard** - Home screen
- 🔍 **Browse** - Search items
- ➕ **Post Item** - Report items
- 💬 **Messages** - Chat
- 👤 **Profile** - Settings

## Troubleshooting

### "Cannot find module '@campustrace/core'"

```bash
cd CampusTrace
npm install
```

### Metro bundler issues

```bash
cd apps/mobile
npx expo start --clear
```

### NativeWind not working

1. Restart Metro bundler with `--clear` flag
2. Check `global.css` is imported in `App.js`
3. Verify imports in `tailwind.config.js`

## Useful Commands

```bash
# Install dependencies
npm install

# Run web app
npm run dev:web

# Run mobile app
npm run dev:mobile

# Build web app
npm run build:web

# Lint all workspaces
npm run lint

# Clear mobile cache
cd apps/mobile && npx expo start --clear
```

## File Locations

- **Web code:** `apps/web/src/`
- **Mobile code:** `apps/mobile/src/`
- **Shared logic:** `packages/core/src/`
- **API client:** `packages/core/src/api/`
- **Contexts:** `packages/core/src/contexts/`
- **Utils:** `packages/core/src/utils/`

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env` files
3. ✅ Run web app: `npm run dev:web`
4. ✅ Run mobile app: `npm run dev:mobile`
5. 🔄 Convert remaining screens from web to mobile
6. 🔄 Implement authentication flow
7. 🔄 Add image upload for mobile
8. 🔄 Test on real devices

## Resources

- 📖 [Full README](./README.md)
- 📖 [Mobile Setup Guide](./apps/mobile/README.md)
- 📖 [Migration Guide](./MIGRATION_GUIDE.md)
- 🌐 [Expo Docs](https://docs.expo.dev/)
- 🧭 [React Navigation](https://reactnavigation.org/)
- 🎨 [NativeWind](https://www.nativewind.dev/)

---

**Happy coding! 🎉**
