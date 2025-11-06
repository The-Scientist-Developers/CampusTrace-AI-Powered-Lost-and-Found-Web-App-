// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
//   darkMode: "class",
//   theme: {
//     extend: {
//       fontFamily: {
//         sans: ["Inter", "sans-serif"],
//       },
//       colors: {
//         // Smooth dark mode palette (like Claude/Supabase)
//         dark: {
//           bg: "#1a1a1a", // Main background
//           surface: "#2a2a2a", // Cards, panels
//           border: "#3a3a3a", // Borders, dividers
//           hover: "#333333", // Hover states
//         },
//         neutral: {
//           50: "#fafafa",
//           100: "#f5f5f5",
//           200: "#e5e5e5",
//           300: "#d4d4d4",
//           400: "#a3a3a3",
//           500: "#737373",
//           600: "#525252",
//           700: "#404040",
//           800: "#262626",
//           900: "#171717",
//           950: "#0a0a0a",
//         },
//         primary: {
//           50: "#eef2ff",
//           100: "#e0e7ff",
//           200: "#c7d2fe",
//           300: "#a5b4fc",
//           400: "#818cf8",
//           500: "#6366f1",
//           600: "#4f46e5",
//           700: "#4338ca",
//           800: "#3730a3",
//           900: "#312e81",
//           950: "#1e1b4b",
//         },
//         red: "#ef4444",
//       },
//       animation: {
//         "fade-in-up": "fadeInUp 0.6s ease-out forwards",
//         slide: "slide 40s linear infinite",
//       },
//       keyframes: {
//         fadeInUp: {
//           "0%": { opacity: "0", transform: "translateY(20px)" },
//           "100%": { opacity: "1", transform: "translateY(0)" },
//         },
//         slide: {
//           "0%": { transform: "translateX(0)" },
//           "100%": { transform: "translateX(-50%)" },
//         },
//       },
//     },
//   },
//   plugins: [require("@tailwindcss/forms")],
// };

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
