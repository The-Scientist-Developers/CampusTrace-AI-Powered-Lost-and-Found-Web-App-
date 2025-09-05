import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/apiClient';

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
  };
  

  return (
    <div  className="bg-slate-900 text-gray-200 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-emerald-400">Welcome to Campus Trace</h1>
        <p className="mt-2 text-lg text-gray-400">
          You are now logged in as: <span className="font-semibold text-gray-200">{user ? user.email : 'Loading...'}</span>
        </p>
        <button
          onClick={handleLogout}
          className="mt-8 px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

