# CampusTrace Monorepo

This is a monorepo structure for CampusTrace, containing both the web app and the mobile app, with shared code in the `packages/core` directory.

## 📁 Folder Structure

```
/CampusTrace/
├── package.json          ← Root package.json managing the monorepo
├── apps/
│   ├── web/             ← Your existing React (Vite) web app
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   └── mobile/          ← Your new React Native (Expo) app
│       ├── app/
│       ├── package.json
│       └── ...
└── packages/
    └── core/            ← Shared logic between web and mobile
        ├── src/
        │   ├── api/     ← Your apiClient.js goes here
        │   ├── contexts/← Your ThemeContext.jsx goes here
        │   └── utils/   ← Your notificationHelpers.js goes here
        └── package.json
```

## 🚀 Getting Started

### 1. Install Dependencies

From the root of the monorepo (`/CampusTrace/`), run:

```bash
npm install
```

This will install dependencies for all workspaces (web, mobile, and core).

### 2. Running the Web App

```bash
npm run dev:web
```

Or navigate to `apps/web` and run:

```bash
cd apps/web
npm run dev
```

### 3. Running the Mobile App (After setup)

```bash
npm run dev:mobile
```

Or navigate to `apps/mobile` and run:

```bash
cd apps/mobile
npm start
```

## 📦 Shared Core Package

The `@campustrace/core` package contains all the shared logic:

- **API Client** (`src/api/apiClient.js`): Platform-agnostic API calls
- **Contexts** (`src/contexts/ThemeContext.jsx`): Shared React contexts
- **Utils** (`src/utils/notificationHelpers.js`): Helper functions

### Using Shared Code

In your web or mobile app, import from the core package:

```javascript
// Import from the main package
import { apiClient, initializeApiConfig } from "@campustrace/core";

// Or import from specific modules
import { apiClient } from "@campustrace/core/api";
import { ThemeProvider, useTheme } from "@campustrace/core/contexts";
import { sendNotification } from "@campustrace/core/utils";
```

### Initialize API Config

Before using the API client, initialize it with your environment variables:

**Web (`apps/web/src/main.jsx`):**

```javascript
import { initializeApiConfig } from "@campustrace/core";

initializeApiConfig({
  apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:8000",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
```

**Mobile (`apps/mobile/App.js`):**

```javascript
import { initializeApiConfig } from "@campustrace/core";
import Constants from "expo-constants";

initializeApiConfig({
  apiBaseUrl: Constants.expoConfig.extra.apiUrl,
  supabaseUrl: Constants.expoConfig.extra.supabaseUrl,
  supabaseAnonKey: Constants.expoConfig.extra.supabaseAnonKey,
});
```

## 🛠 Next Steps

1. **Move your existing web app** into `/apps/web/`
2. **Create the Expo mobile app** in `/apps/mobile/`
3. **Update imports** in your web app to use `@campustrace/core`
4. **Build mobile screens** using shared logic from the core package

## 📝 Available Scripts

- `npm run dev:web` - Start the web development server
- `npm run dev:mobile` - Start the Expo development server
- `npm run build:web` - Build the web app for production
- `npm run build:mobile` - Build the mobile app
- `npm run lint` - Run linting across all workspaces
