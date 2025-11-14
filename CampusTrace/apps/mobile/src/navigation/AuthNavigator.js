import React, { lazy, Suspense } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/auth/LoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
// Lazy-load PendingApprovalScreen to avoid potential module interop issues
const PendingApprovalScreen = lazy(() =>
  import("../screens/auth/PendingApprovalScreen")
);

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Suspense fallback={null}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        {/* Add the new screen to the stack (lazy-loaded) */}
        <Stack.Screen
          name="PendingApproval"
          component={PendingApprovalScreen}
        />
      </Stack.Navigator>
    </Suspense>
  );
};

export default AuthNavigator;
