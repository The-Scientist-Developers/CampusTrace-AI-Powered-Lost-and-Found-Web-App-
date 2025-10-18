import { createClient } from "@supabase/supabase-js";

const API_BASE_URL = "http://localhost:8000";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", SUPABASE_URL);
console.log("Supabase Anon Key:", SUPABASE_ANON_KEY ? "Loaded" : "NOT LOADED");
// ---------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch (error) {
    console.error("Failed to obtain auth token", error);
    return null;
  }
}

export const apiClient = {
  async signInWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin,
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

  async updateProfile({ fullName, avatarFile }) {
    const token = await getAccessToken();
    const formData = new FormData();
    if (typeof fullName === "string") formData.append("full_name", fullName);
    if (avatarFile instanceof File) formData.append("avatar", avatarFile);

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
