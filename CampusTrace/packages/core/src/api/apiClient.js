import { createClient } from "@supabase/supabase-js";

// Platform-agnostic API configuration
// These will be provided by the platform-specific environment setup
let API_BASE_URL = "http://localhost:8000";
let SUPABASE_URL = "";
let SUPABASE_ANON_KEY = "";
let supabaseClient = null;

/**
 * Initialize the API configuration
 * Call this from your platform-specific entry point (web or mobile)
 */
export function initializeApiConfig(config) {
  API_BASE_URL = config.apiBaseUrl || API_BASE_URL;
  SUPABASE_URL = config.supabaseUrl;
  SUPABASE_ANON_KEY = config.supabaseAnonKey;

  // Guard: Only create Supabase client if both URL and anon key are provided.
  // This prevents runtime errors in environments (like Expo Go initial load)
  // where values may be placeholders or undefined.
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn("Supabase client initialization failed:", e?.message || e);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
}

/**
 * Get the Supabase client instance
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    console.warn(
      "Supabase client not initialized (missing URL or key). Auth-dependent features will be disabled."
    );
    return null;
  }
  return supabaseClient;
}

/**
 * Get access token from Supabase auth session
 */
export async function getAccessToken() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch (error) {
    console.error("Failed to obtain auth token", error);
    return null;
  }
}

/**
 * Platform-agnostic API client
 * Works on both web (fetch) and React Native
 */
export const apiClient = {
  /**
   * Sign in with magic link (OTP)
   */
  async signInWithMagicLink(email, redirectUrl) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error(
        "Authentication service unavailable (Supabase not configured)."
      );
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new Error(
        error.message ||
          "An unknown error occurred while sending the magic link."
      );
    }

    return {
      message: "Login link sent successfully. Please check your email.",
    };
  },

  /**
   * Get recent activity from the API
   */
  async getRecentActivity() {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/items/recent-activity`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error("Failed to fetch recent activity.");
    return response.json();
  },

  /**
   * Get browse items with optional filter
   * NOTE: This endpoint doesn't exist in backend yet, screens use Supabase directly
   * @param {string} itemType - Optional filter: 'lost' or 'found'
   */
  async getBrowseItems(itemType) {
    // Backend doesn't have this endpoint yet
    // Mobile screens fetch directly from Supabase
    return [];
  },

  /**
   * Get user conversations/messages
   * NOTE: Backend only has POST /api/conversations/, no GET endpoint yet
   */
  async getMessages() {
    // Backend doesn't have this endpoint yet
    // Mobile screens fetch directly from Supabase
    return [];
  },

  /**
   * Get leaderboard top users
   * Backend endpoint: /api/items/leaderboard
   */
  async getLeaderboard() {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/items/leaderboard`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error("Failed to fetch leaderboard.");
    return response.json();
  },

  /**
   * Get user notifications
   * NOTE: Backend has notification_router but no GET endpoint defined yet
   */
  async getNotifications() {
    // Backend doesn't have this endpoint yet
    // Mobile screens fetch directly from Supabase
    return [];
  },

  /**
   * Ban or unban a user (admin only)
   */
  async banUser(userId, isBanned = true) {
    const token = await getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}/ban`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_banned: !!isBanned }),
      }
    );
    if (!response.ok)
      throw new Error(`Failed to ban user: ${await response.text()}`);
    return response.json();
  },

  /**
   * Change user role (admin only)
   */
  async changeUserRole(userId, newRole) {
    const token = await getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}/role`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      }
    );
    if (!response.ok)
      throw new Error(`Failed to change role: ${await response.text()}`);
    return response.json();
  },

  /**
   * Update post status (admin only)
   */
  async postStatusUpdate(itemId, status) {
    const token = await getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/items/${encodeURIComponent(itemId)}/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ moderation_status: status }),
      }
    );
    if (!response.ok)
      throw new Error(`Failed to update status: ${await response.text()}`);
    return response.json();
  },

  /**
   * Update user profile
   * Note: For file uploads, platform-specific FormData handling may be needed
   */
  async updateProfile({ fullName, avatarFile }) {
    const token = await getAccessToken();
    const formData = new FormData();
    if (typeof fullName === "string") formData.append("full_name", fullName);
    if (avatarFile) formData.append("avatar", avatarFile);

    const response = await fetch(`${API_BASE_URL}/api/profile/`, {
      method: "PUT",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok)
      throw new Error(`Failed to update profile: ${await response.text()}`);
    return response.json();
  },
};

// Re-export for convenience
export { API_BASE_URL };
