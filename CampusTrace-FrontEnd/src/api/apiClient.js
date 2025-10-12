import { createClient } from "@supabase/supabase-js";

const API_BASE_URL = "http://localhost:8000";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


async function getAccessToken() {
  try {
    if (supabase.auth?.getSession) {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || null;
    }

    if (supabase.auth?.session) {
      const session = supabase.auth.session();
      return session?.access_token || null;
    }
  } catch (error) {
    console.error("Failed to obtain auth token", error);
  }

  return null;
}

export const apiClient = {
  /**
   * @param {string} email - The user's email address.
   * @returns {Promise<object>} - The JSON response from the server.
   */
  async signInWithMagicLink(email) {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "An unknown error occurred.");
    }

    return response.json();
  },

  async getRecentActivity() {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/items/recent-activity`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch recent activity.");
    }
    return response.json();
  },

  async banUser(userId, isBanned = true) {
    if (!userId) throw new Error("userId is required");

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

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Failed to ban user: ${response.status} ${text}`);
    }

    return response.json();
  },

  async changeUserRole(userId, newRole) {
    if (!userId) throw new Error("userId is required");
    if (!newRole) throw new Error("newRole is required");

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

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Failed to change user role: ${response.status} ${text}`);
    }

    return response.json();
  },

  async postStatusUpdate(itemId, status) {
    if (!itemId) throw new Error("itemId is required");
    if (!status) throw new Error("status is required");

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

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to post status update: ${response.status} ${text}`
      );
    }

    return response.json();
  },

  async updateProfile({ fullName, avatarFile }) {
    const token = await getAccessToken();

    const formData = new FormData();
    if (typeof fullName === "string") {
      formData.append("full_name", fullName);
    }
    if (avatarFile instanceof File) {
      formData.append("avatar", avatarFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/profile/`, {
      method: "PUT",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Failed to update profile: ${response.status} ${text}`);
    }

    return response.json();
  },
};
