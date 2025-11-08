import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { BRAND_COLOR } from "@campustrace/core";
import { LinearGradient } from "expo-linear-gradient"; // or react-native-linear-gradient

const { height } = Dimensions.get("window");

const LoadingScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnimBottom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simple fade-in like Instagram
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        delay: 100,
      }),
      Animated.timing(fadeAnimBottom, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        delay: 200,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Instagram-style gradient icon */}
        <LinearGradient
          colors={[BRAND_COLOR, `${BRAND_COLOR}DD`, `${BRAND_COLOR}BB`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoGradient}
        >
          <Text style={styles.logoText}>CT</Text>
        </LinearGradient>

        <Text style={styles.appName}>CampusTrace</Text>
      </Animated.View>

      {/* Bottom text like Instagram's "from Meta" */}
      <Animated.View
        style={[styles.bottomContainer, { opacity: fadeAnimBottom }]}
      >
        <Text style={styles.fromText}>from</Text>
        <Text style={styles.brandText}>Your Campus</Text>
      </Animated.View>
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
  logoContainer: {
    alignItems: "center",
    position: "absolute",
    top: height / 2 - 100, // Center vertically
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24, // Instagram uses rounded square
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    // Instagram-style shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  logoText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  appName: {
    fontSize: 36,
    fontWeight: Platform.OS === "ios" ? "400" : "normal",
    color: "#262626", // Instagram's text color
    fontFamily: Platform.select({
      ios: "SnellRoundhand-Bold", // or custom font
      android: "cursive",
      default: "serif",
    }),
    letterSpacing: 0.5,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  fromText: {
    fontSize: 14,
    color: "#8E8E8E",
    fontWeight: "400",
    marginBottom: 4,
  },
  brandText: {
    fontSize: 16,
    color: "#262626",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

export default LoadingScreen;
