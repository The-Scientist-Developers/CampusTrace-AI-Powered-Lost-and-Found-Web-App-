/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // NEW: Hostinger-inspired light theme palette
        light: {
          background: "#FFFFFF", // Pure white for a clean look
          surface: "#F9F9F9", // A very light grey for cards and sections
          border: "#E3E3E3", // Soft borders
          text: "#222222", // Dark text for high contrast
          subtle: "#555555", // Lighter text for descriptions
        },
        dark: {
          bg: "#1a1a1a",
          surface: "#2a2a2a",
          border: "#3a3a3a",
          hover: "#333333",
        },
        // Primary colors now use CSS variables for GAD theme support
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
        },
        red: "#ef4444",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        slide: "slide 40s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slide: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
