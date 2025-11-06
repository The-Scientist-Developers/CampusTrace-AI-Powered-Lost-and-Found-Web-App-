import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PostItemScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Post New Item
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-center">
          Report a lost or found item
        </Text>
      </View>
    </SafeAreaView>
  );
}
