import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 px-6 py-8 justify-center items-center">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Register Screen
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          This screen will contain the registration form
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          className="bg-primary-600 rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
