// Quick test to check what API URL will be used
require("dotenv").config();

console.log("=".repeat(60));
console.log("API URL Configuration Test");
console.log("=".repeat(60));
console.log("");
console.log("Environment Variables:");
console.log(
  "  EXPO_PUBLIC_API_URL:",
  process.env.EXPO_PUBLIC_API_URL || "(not set)",
);
console.log("");
console.log("Expected URL: http://192.168.1.100:8000");
console.log("");

if (process.env.EXPO_PUBLIC_API_URL) {
  if (
    process.env.EXPO_PUBLIC_API_URL.includes("localhost") ||
    process.env.EXPO_PUBLIC_API_URL.includes("192.168")
  ) {
    console.log("✅ Configured for LOCAL development");
  } else {
    console.log("⚠️  Configured for PRODUCTION");
  }
} else {
  console.log("❌ EXPO_PUBLIC_API_URL not set - will use production URL");
  console.log("");
  console.log("To fix:");
  console.log("  1. Check .env file exists in apps/mobile/");
  console.log('  2. Restart Expo dev server (stop and run "npm start" again)');
  console.log("  3. Clear Metro bundler cache: npm start -- --clear");
}

console.log("");
console.log("=".repeat(60));
