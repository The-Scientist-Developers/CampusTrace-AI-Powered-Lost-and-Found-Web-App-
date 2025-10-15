// // tailwind.config.js
// module.exports = {
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
//   theme: {
//     extend: {
//       colors: {
//         red: "#ef4444", // Ensure your custom red color is defined
//       },
//       animation: {
//         "fade-in-up": "fadeInUp 0.6s ease-out forwards",
//         blob: "blob 7s infinite cubic-bezier(0.42, 0, 0.58, 1)", // Adjust animation duration and curve as needed
//       },
//       keyframes: {
//         fadeInUp: {
//           "0%": { opacity: "0", transform: "translateY(20px)" },
//           "100%": { opacity: "1", transform: "translateY(0)" },
//         },
//         blob: {
//           "0%": { transform: "translate(0px, 0px) scale(1)" },
//           "33%": { transform: "translate(30px, -50px) scale(1.1)" },
//           "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
//           "100%": { transform: "translate(0px, 0px) scale(1)" },
//         },
//       },
//       animationDelay: {
//         // For staggering animations, if needed (optional)
//         200: "200ms",
//         400: "400ms",
//       },
//     },
//   },
//   plugins: [],
// };
// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        red: "#ef4444", // Ensure your custom red color is defined
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        blob: "blob 7s infinite cubic-bezier(0.42, 0, 0.58, 1)", // Adjust animation duration and curve as needed
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
      animationDelay: {
        // For staggering animations, if needed (optional)
        200: "200ms",
        400: "400ms",
      },
    },
  },
  plugins: [],
};