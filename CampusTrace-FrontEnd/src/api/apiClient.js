  import { createClient } from '@supabase/supabase-js';

  const API_BASE_URL = 'http://localhost:8000';



  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;


  export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


  export const apiClient = {
    /**
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
    },


    async getRecentActivity(){
      const response = await fetch(`${API_BASE_URL}/recent-activity`);
    if (!response.ok) {
      throw new Error('Failed to fetch recent activity.');
    }
    return response.json();
    }

  };



