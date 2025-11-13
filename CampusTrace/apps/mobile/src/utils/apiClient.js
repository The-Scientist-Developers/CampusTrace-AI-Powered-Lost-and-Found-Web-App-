import { getSupabaseClient, API_BASE_URL } from "@campustrace/core";

// Timeout configuration (in milliseconds)
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const UPLOAD_TIMEOUT = 60000; // 60 seconds for file uploads

/**
 * Fetch with timeout
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
 * Get the current user's access token
 */
export async function getAccessToken() {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch (error) {
    console.error("Failed to obtain auth token", error);
    return null;
  }
}

/**
 * API client with common HTTP methods
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  async get(url) {
    try {
      const token = await getAccessToken();
      const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch: ${errorText}`);
      }
      return response.json();
    } catch (error) {
      console.error(`GET ${url} failed:`, error.message);
      throw error;
    }
  },

  /**
   * Make a POST request
   */
  async post(url, data) {
    try {
      const token = await getAccessToken();
      const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to post: ${errorText}`);
      }
      return response.json();
    } catch (error) {
      console.error(`POST ${url} failed:`, error.message);
      throw error;
    }
  },

  /**
   * Upload a file with multipart/form-data
   */
  async postFormData(url, formData) {
    try {
      const token = await getAccessToken();
      const response = await fetchWithTimeout(
        `${API_BASE_URL}${url}`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        },
        UPLOAD_TIMEOUT // Use longer timeout for uploads
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload: ${errorText}`);
      }
      return response.json();
    } catch (error) {
      console.error(`POST FormData ${url} failed:`, error.message);
      throw error;
    }
  },
};
