import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Theme color palettes
export const THEME_COLORS = {
  blue: {
    primary: "#1877F2",
    light: "#60A5FA",
    dark: "#1565D8",
    name: "Blue (Default)",
    emoji: "💙",
    description: "Autism awareness & accessibility",
  },
  purple: {
    primary: "#A855F7",
    light: "#C084FC",
    dark: "#9333EA",
    name: "Purple",
    emoji: "💜",
    description: "Gender & Development awareness",
  },
  pink: {
    primary: "#EC4899",
    light: "#F472B6",
    dark: "#DB2777",
    name: "Pink",
    emoji: "💗",
    description: "Breast cancer awareness",
  },
  green: {
    primary: "#22C55E",
    light: "#4ADE80",
    dark: "#16A34A",
    name: "Green",
    emoji: "💚",
    description: "Environmental awareness",
  },
};

// Font sizes
export const FONT_SIZES = {
  small: {
    tiny: 10,
    small: 12,
    base: 14,
    medium: 16,
    large: 18,
    xl: 20, // alias for xlarge
    xlarge: 20,
    xxl: 24, // alias for xxlarge
    xxlarge: 24,
  },
  medium: {
    tiny: 11,
    small: 13,
    base: 16,
    medium: 18,
    large: 20,
    xl: 24, // alias for xlarge
    xlarge: 24,
    xxl: 28, // alias for xxlarge
    xxlarge: 28,
  },
  large: {
    tiny: 12,
    small: 14,
    base: 18,
    medium: 20,
    large: 22,
    xl: 26, // alias for xlarge
    xlarge: 26,
    xxl: 32, // alias for xxlarge
    xxlarge: 32,
  },
  xlarge: {
    tiny: 13,
    small: 15,
    base: 20,
    medium: 22,
    large: 24,
    xl: 28, // alias for xlarge
    xlarge: 28,
    xxl: 36, // alias for xxlarge
    xxlarge: 36,
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [colorMode, setColorMode] = useState("blue");
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [savedTheme, savedColorMode, savedFontSize, savedContrast] =
        await Promise.all([
          AsyncStorage.getItem("theme"),
          AsyncStorage.getItem("colorMode"),
          AsyncStorage.getItem("fontSize"),
          AsyncStorage.getItem("highContrast"),
        ]);

      if (savedTheme) setIsDark(savedTheme === "dark");
      if (savedColorMode) setColorMode(savedColorMode);
      if (savedFontSize) setFontSize(savedFontSize);
      if (savedContrast) setHighContrast(savedContrast === "true");
    } catch (error) {
      console.error("Error loading theme preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const changeColorMode = async (mode) => {
    setColorMode(mode);
    await AsyncStorage.setItem("colorMode", mode);
  };

  const changeFontSize = async (size) => {
    setFontSize(size);
    await AsyncStorage.setItem("fontSize", size);
  };

  const toggleHighContrast = async () => {
    const newContrast = !highContrast;
    setHighContrast(newContrast);
    await AsyncStorage.setItem("highContrast", String(newContrast));
  };

  // Get current colors based on theme mode and color mode
  const colors = {
    // Primary colors
    primary: THEME_COLORS[colorMode].primary,
    primaryLight: THEME_COLORS[colorMode].light,
    primaryDark: THEME_COLORS[colorMode].dark,

    // Background colors
    background: highContrast ? "#000000" : isDark ? "#1A1A1A" : "#FFFFFF",
    surface: highContrast ? "#000000" : isDark ? "#2A2A2A" : "#FAFAFA",
    card: highContrast ? "#000000" : isDark ? "#2A2A2A" : "#FFFFFF",

    // Text colors
    text: highContrast ? "#FFFFFF" : isDark ? "#FFFFFF" : "#000000",
    textSecondary: highContrast ? "#FFFFFF" : isDark ? "#9CA3AF" : "#6B7280",
    textTertiary: highContrast ? "#FFFFFF" : isDark ? "#6B7280" : "#9CA3AF",

    // Border colors
    border: highContrast ? "#FFFFFF" : isDark ? "#3A3A3A" : "#E5E7EB",
    divider: highContrast ? "#FFFFFF" : isDark ? "#2A2A2A" : "#F3F4F6",

    // Status colors
    success: highContrast ? "#00FF00" : "#10B981",
    error: highContrast ? "#FF0000" : "#EF4444",
    warning: highContrast ? "#FFFF00" : "#F59E0B",
    info: highContrast ? "#00FFFF" : "#3B82F6",

    // Additional utility colors
    overlay: "rgba(0, 0, 0, 0.5)",
    shadow: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.1)",
  };

  // Get current font sizes
  const fontSizes = FONT_SIZES[fontSize];

  const theme = {
    isDark,
    colorMode,
    fontSize,
    highContrast,
    colors,
    fontSizes,
    toggleTheme,
    changeColorMode,
    changeFontSize,
    toggleHighContrast,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;
