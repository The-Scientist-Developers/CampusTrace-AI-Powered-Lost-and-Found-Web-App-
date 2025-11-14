import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  G,
  Circle,
  Line,
} from "react-native-svg";
import { useTheme } from "../contexts/ThemeContext";

const { height } = Dimensions.get("window");

// CampusTrace Icon Component
const CampusTraceIcon = ({ width = 80, height = 80 }) => (
  <Svg width={width} height={height} viewBox="0 0 512 512">
    <Defs>
      <LinearGradient id="iconBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2563EB" stopOpacity="1" />
        <Stop offset="100%" stopColor="#1E40AF" stopOpacity="1" />
      </LinearGradient>
    </Defs>

    {/* Background */}
    <Rect
      x="16"
      y="16"
      width="480"
      height="480"
      rx="100"
      ry="100"
      fill="url(#iconBlueGradient)"
    />

    {/* Search icon */}
    <G transform="translate(256, 256)">
      {/* Search circle */}
      <Circle
        r="100"
        fill="none"
        stroke="white"
        strokeWidth="26"
        transform="translate(-26, -26)"
      />
      {/* Handle */}
      <Line
        x1="46"
        y1="46"
        x2="110"
        y2="110"
        stroke="white"
        strokeWidth="26"
        strokeLinecap="round"
      />
      {/* AI dot */}
      <Circle r="18" fill="white" transform="translate(-26, -26)" />
    </G>
  </Svg>
);

const LoadingScreen = () => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnimBottom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simple entrance animation like Instagram
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
        delay: 100,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 100,
      }),
    ]).start();

    // Bottom text fade in
    Animated.timing(fadeAnimBottom, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      delay: 800,
    }).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo SVG */}
        <View style={styles.logoImage}>
          <CampusTraceIcon width={96} height={96} />
        </View>

        {/* Brand Name */}
        <Text
          style={[
            styles.appName,
            {
              color: colors.text,
              fontWeight: "700",
            },
          ]}
        >
          CampusTrace
        </Text>
      </Animated.View>

      {/* Bottom text like Instagram's "from Meta" */}
      <Animated.View
        style={[styles.bottomContainer, { opacity: fadeAnimBottom }]}
      >
        <Text style={[styles.poweredText, { color: colors.textSecondary }]}>
          Powered by AI
        </Text>
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
  },
  logoImage: {
    width: 96,
    height: 96,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    ...Platform.select({
      ios: {
        fontFamily: "System",
        fontWeight: "700",
      },
      android: {
        fontFamily: "sans-serif-medium",
        fontWeight: "700",
      },
    }),
  },
  bottomContainer: {
    position: "absolute",
    bottom: 48,
    alignItems: "center",
  },
  poweredText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});

export default LoadingScreen;