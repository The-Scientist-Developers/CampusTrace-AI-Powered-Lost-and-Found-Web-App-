import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Platform-agnostic storage utility
const storage = {
  getItem: (key) => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(key);
    }
    // For React Native, this will be overridden by AsyncStorage
    return null;
  },
  setItem: (key, value) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(key, value);
    }
    // For React Native, this will be overridden by AsyncStorage
  },
};

export const ThemeProvider = ({ children }) => {
  // Light/Dark mode state
  const [theme, setTheme] = useState(() => {
    const savedTheme = storage.getItem("theme");
    return savedTheme || "light";
  });

  // Color mode state (default, purple, pink, blue, green)
  const [colorMode, setColorMode] = useState(() => {
    const savedColorMode = storage.getItem("color-mode");
    return savedColorMode || "default";
  });

  // Accessibility: Font Size
  const [fontSize, setFontSize] = useState(() => {
    const savedFontSize = storage.getItem("font-size");
    return savedFontSize || "medium";
  });

  // Accessibility: High Contrast
  const [contrast, setContrast] = useState(() => {
    const savedContrast = storage.getItem("contrast");
    return savedContrast || "normal";
  });

  // Apply theme (light/dark) and color mode classes (Web only)
  useEffect(() => {
    if (typeof window !== "undefined" && window.document) {
      const root = window.document.documentElement;

      // Manage light/dark mode
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      storage.setItem("theme", theme);

      // Manage color mode - remove all theme classes first
      root.classList.remove(
        "theme-purple",
        "theme-pink",
        "theme-blue",
        "theme-green"
      );

      // Add the selected color theme class
      if (colorMode !== "default") {
        root.classList.add(`theme-${colorMode}`);
      }
      storage.setItem("color-mode", colorMode);

      // Manage font size
      root.setAttribute("data-font-size", fontSize);
      storage.setItem("font-size", fontSize);

      // Manage high contrast
      if (contrast === "high") {
        root.classList.add("theme-high-contrast");
      } else {
        root.classList.remove("theme-high-contrast");
      }
      storage.setItem("contrast", contrast);
    }
  }, [theme, colorMode, fontSize, contrast]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        colorMode,
        setColorMode,
        fontSize,
        setFontSize,
        contrast,
        setContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
