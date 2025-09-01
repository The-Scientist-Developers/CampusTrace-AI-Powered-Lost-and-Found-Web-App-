import { createClient } from '@supabase/supabase-js';

// The base URL of your FastAPI backend
const API_BASE_URL = 'http://localhost:8000';



// --- Configuration ---
// Replace with your actual Supabase credentials from your project's API settings
const SUPABASE_URL = 'https://cvcxqsdwtcvwgdftsdtp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y3hxc2R3dGN2d2dkZnRzZHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2OTQ2NTAsImV4cCI6MjA3MjI3MDY1MH0.QDiwFK_CqhCyyB7XeCYLJKcNoYVflVVCgDod6IIyOPA';

/**
 * A client for making API calls to the Campus Trace backend.
 * 
 */ 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/**
 * A client for making API calls to the Campus Trace backend.
 */
export const apiClient = {
  /**
   * Sends a sign-in request to the backend to trigger a magic link.
   * @param {string} email - The user's email address.
   * @returns {Promise<object>} - The JSON response from the server.
   */
  async signInWithMagicLink(email) {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'An unknown error occurred.');
    }

    return response.json();
  }
};

