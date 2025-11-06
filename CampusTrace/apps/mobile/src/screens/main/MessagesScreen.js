import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MessagesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Messages
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-center">
          Chat with other users
        </Text>
      </View>
    </SafeAreaView>
  );
}
