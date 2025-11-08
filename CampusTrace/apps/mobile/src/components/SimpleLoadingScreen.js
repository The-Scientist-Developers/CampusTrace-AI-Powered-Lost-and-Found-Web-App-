import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { BRAND_COLOR } from "@campustrace/core";

const SimpleLoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={BRAND_COLOR} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SimpleLoadingScreen;
