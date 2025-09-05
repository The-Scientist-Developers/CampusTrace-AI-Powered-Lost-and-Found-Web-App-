import React, { useState, useEffect } from 'react';
import { supabase } from './api/apiClient';
import LandingPage from './features/Pages/landingPage';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';

function App() {
  const [session, setSession] = useState(null);

  const [authPage, setAuthPage] = useState('landing');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (!session) {
        setAuthPage('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const navigateToLogin = () => {
    setAuthPage('login');
  };


  if (isLoading) {

    return <div className="bg-slate-900 min-h-screen" />;
  }

  if (session) {

    return <DashboardPage />;
  } else {

    return authPage === 'login' 
      ? <LoginPage /> 
      : <LandingPage onNavigateToLogin={navigateToLogin} />;
  }
}

export default App;

