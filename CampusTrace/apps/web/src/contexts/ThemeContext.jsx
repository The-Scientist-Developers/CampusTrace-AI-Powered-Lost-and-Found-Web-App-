import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Light/Dark mode state
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  // Color mode state (default, purple, pink, blue, green)
  const [colorMode, setColorMode] = useState(() => {
    const savedColorMode = localStorage.getItem("color-mode");
    return savedColorMode || "default";
  });

  // Accessibility: Font Size
  const [fontSize, setFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem("font-size");
    return savedFontSize || "medium";
  });

  // Accessibility: High Contrast
  const [contrast, setContrast] = useState(() => {
    const savedContrast = localStorage.getItem("contrast");
    return savedContrast || "normal";
  });

  // Apply theme (light/dark) and color mode classes
  useEffect(() => {
    const root = window.document.documentElement;

    // Manage light/dark mode
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);

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
    localStorage.setItem("color-mode", colorMode);

    // Manage font size
    root.setAttribute("data-font-size", fontSize);
    localStorage.setItem("font-size", fontSize);

    // Manage high contrast
    if (contrast === "high") {
      root.classList.add("theme-high-contrast");
    } else {
      root.classList.remove("theme-high-contrast");
    }
    localStorage.setItem("contrast", contrast);
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
