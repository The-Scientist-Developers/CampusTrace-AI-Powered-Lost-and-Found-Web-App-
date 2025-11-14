// apps/mobile/src/utils/apiClient.js

import { getSupabaseClient } from "@campustrace/core";
import { Platform } from "react-native";
import Constants from "expo-constants";

// ============= API BASE URL CONFIGURATION =============

/**
 * Get the correct API base URL based on platform and environment
 * Priority order:
 * 1. Environment variable (EXPO_PUBLIC_API_URL from .env)
 * 2. app.config.js extra.apiUrl
 * 3. Platform-specific defaults for development
 * 4. Production URL
 */
const getApiBaseUrl = () => {
  // 1. Check for environment variable first (from .env file)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log(
      "📡 [API] Using URL from .env:",
      process.env.EXPO_PUBLIC_API_URL
    );
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Check for custom API URL in app.json/app.config.js
  const customApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (customApiUrl && customApiUrl !== "http://localhost:8000") {
    console.log("📡 [API] Using URL from app.config.js:", customApiUrl);
    return customApiUrl;
  }

  // 3. Development mode - platform-specific defaults
  if (__DEV__) {
    const isAndroid = Platform.OS === "android";
    const isDevice = Constants.isDevice;

    // Android Emulator uses special IP 10.0.2.2 to access host machine
    if (isAndroid && !isDevice) {
      const url = "http://10.0.2.2:8000";
      console.log("📡 [API] Android Emulator detected, using:", url);
      return url;
    }

    // iOS Simulator can use localhost
    if (Platform.OS === "ios" && !isDevice) {
      const url = "http://localhost:8000";
      console.log("📡 [API] iOS Simulator detected, using:", url);
      return url;
    }

    // Physical Device - MUST use computer's IP address
    if (isDevice) {
      console.error("❌ [API] CRITICAL: Running on PHYSICAL DEVICE!");
      console.error(
        "❌ [API] You MUST set EXPO_PUBLIC_API_URL in your .env file!"
      );
      console.error(
        "❌ [API] Example: EXPO_PUBLIC_API_URL=http://10.0.0.37:8081"
      );
      console.error("❌ [API] Falling back to localhost (THIS WILL NOT WORK)");
    }

    const url = "http://localhost:8000";
    console.log("📡 [API] Using development URL:", url);
    return url;
  }

  // 4. Production - use deployed backend
  const productionUrl =
    "https://campustrace-ai-powered-lost-and-found-bcho.onrender.com";
  console.log("📡 [API] Production mode, using:", productionUrl);
  return productionUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Log the final URL being used
console.log("✅ [API] Final API_BASE_URL:", API_BASE_URL);
console.log("📱 [API] Platform:", Platform.OS);
console.log("📱 [API] Is Device:", Constants.isDevice);
console.log("🔧 [API] Is DEV:", __DEV__);

// Timeout configuration (in milliseconds)
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const UPLOAD_TIMEOUT = 60000; // 60 seconds for file uploads

/**
 * Fetch with timeout to prevent hanging requests
 */
async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(
        "Request timed out. Please check your internet connection and try again."
      );
    }
    throw error;
  }
}

/**
 * Get the current user's access token from Supabase session
 */
export async function getAccessToken() {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch (error) {
    console.error("❌ [AUTH] Failed to obtain auth token:", error);
    return null;
  }
}

/**
 * API client with common HTTP methods
 */
export const apiClient = {
  /**
   * Make a GET request
   * @param {string} url - The endpoint URL (e.g., "/api/items")
   * @returns {Promise<any>} - The response data
   */
  async get(url) {
    try {
      const fullUrl = `${API_BASE_URL}${url}`;
      console.log(`🌐 [GET] ${fullUrl}`);

      const token = await getAccessToken();
      const response = await fetchWithTimeout(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [GET] ${url} failed (${response.status}):`,
          errorText
        );
        throw new Error(`Request failed: ${errorText}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log(`✅ [GET] ${url} success`);
        return data;
      } else {
        // Server returned HTML or other non-JSON content
        const text = await response.text();
        console.error(
          `❌ [GET] ${url} returned non-JSON:`,
          text.substring(0, 200)
        );
        throw new Error(
          "Server returned HTML instead of JSON. Backend may be down or misconfigured."
        );
      }
    } catch (error) {
      console.error(`❌ [GET] ${url} error:`, error.message);

      // Provide helpful error messages
      if (error.message.includes("Network request failed")) {
        console.error("💡 [HELP] Network error - Check:");
        console.error(
          "   1. Is your backend running? (http://YOUR_IP:8000/health)"
        );
        console.error("   2. Is EXPO_PUBLIC_API_URL set correctly in .env?");
        console.error("   3. Are phone and computer on same WiFi?");
        console.error("   4. Is Windows Firewall blocking the connection?");
        console.error(`   5. Current API_BASE_URL: ${API_BASE_URL}`);
      }

      throw error;
    }
  },

  /**
   * Make a POST request with JSON body
   * @param {string} url - The endpoint URL
   * @param {object} data - The request body data
   * @returns {Promise<any>} - The response data
   */
  async post(url, data) {
    try {
      const fullUrl = `${API_BASE_URL}${url}`;
      console.log(`🌐 [POST] ${fullUrl}`);

      const token = await getAccessToken();
      const response = await fetchWithTimeout(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [POST] ${url} failed (${response.status}):`,
          errorText
        );
        throw new Error(`Request failed: ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`✅ [POST] ${url} success`);
      return responseData;
    } catch (error) {
      console.error(`❌ [POST] ${url} error:`, error.message);
      throw error;
    }
  },

  /**
   * Upload a file with multipart/form-data
   * @param {string} url - The endpoint URL
   * @param {FormData} formData - The form data with files
   * @returns {Promise<any>} - The response data
   */
  async postFormData(url, formData) {
    try {
      const fullUrl = `${API_BASE_URL}${url}`;
      console.log(`🌐 [POST FormData] ${fullUrl}`);

      const token = await getAccessToken();
      const response = await fetchWithTimeout(
        fullUrl,
        {
          method: "POST",
          headers: {
            // Don't set Content-Type for FormData - browser will set it with boundary
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        },
        UPLOAD_TIMEOUT // Use longer timeout for file uploads
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [POST FormData] ${url} failed (${response.status}):`,
          errorText
        );
        throw new Error(`Upload failed: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ [POST FormData] ${url} success`);
      return data;
    } catch (error) {
      console.error(`❌ [POST FormData] ${url} error:`, error.message);
      throw error;
    }
  },

  /**
   * Make a PUT request with JSON body
   * @param {string} url - The endpoint URL
   * @param {object} data - The request body data
   * @returns {Promise<any>} - The response data
   */
  async put(url, data) {
    try {
      const fullUrl = `${API_BASE_URL}${url}`;
      console.log(`🌐 [PUT] ${fullUrl}`);

      const token = await getAccessToken();
      const response = await fetchWithTimeout(fullUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [PUT] ${url} failed (${response.status}):`,
          errorText
        );
        throw new Error(`Request failed: ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`✅ [PUT] ${url} success`);
      return responseData;
    } catch (error) {
      console.error(`❌ [PUT] ${url} error:`, error.message);
      throw error;
    }
  },

  /**
   * Make a DELETE request
   * @param {string} url - The endpoint URL
   * @returns {Promise<any>} - The response data
   */
  async delete(url) {
    try {
      const fullUrl = `${API_BASE_URL}${url}`;
      console.log(`🌐 [DELETE] ${fullUrl}`);

      const token = await getAccessToken();
      const response = await fetchWithTimeout(fullUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [DELETE] ${url} failed (${response.status}):`,
          errorText
        );
        throw new Error(`Request failed: ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`✅ [DELETE] ${url} success`);
      return responseData;
    } catch (error) {
      console.error(`❌ [DELETE] ${url} error:`, error.message);
      throw error;
    }
  },
};

/**
 * Test API connection
 * Useful for debugging network issues
 */
export async function testApiConnection() {
  console.log("🔍 [TEST] Testing API connection...");
  console.log("🔍 [TEST] API_BASE_URL:", API_BASE_URL);

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ [TEST] API connection successful!");
      console.log("✅ [TEST] Response:", data);
      return { success: true, data };
    } else {
      console.error("❌ [TEST] API returned error:", response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error("❌ [TEST] API connection failed:", error.message);
    return { success: false, error: error.message };
  }
}
