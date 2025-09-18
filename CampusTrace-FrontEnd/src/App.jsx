import React, { useState, useEffect } from 'react';
import { supabase } from './api/apiClient';
import LandingPage from './features/Pages/landingPage';
import LoginPage from './features/auth/LoginPage';
import DashboardLayout from './features/UserDashboard/DashboardLayout';
import UserProfilePage from './features/UserDashboard/userProfilePage';
import UserMainPage from './features/UserDashboard/userMainPage';
import AdminDashboardLayout from './features/AdminDashboard/adminDashboardLayout';



const mockUser = {
  id: 'dev-user-123',
  email: 'developer@isu.edu.ph',
};

// This is a flag to easily switch between development and normal mode
const DEV_MODE = true;


function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null)
  const [authPage, setAuthPage] = useState('landing');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (DEV_MODE) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);  
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async(_event, session) => {
      console.log("onAuthStateChange fired!");
      console.log("Event type:", _event);
      console.log("New session object:", session);
      
      setSession(session);

      if (!session) {
        setAuthPage('landing');
      }

      if (session) {
        // If a user is logged in, fetch their profile from the database.
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data); // Store the profile data in state
        }
      } else {
        // If the user logs out, clear the profile and go to the landing page.
        setProfile(null);
        setAuthPage('landing');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);



    if (DEV_MODE) {
    return (
      <DashboardLayout user1={mockUser}>
        {/* The {children} prop needs content. 
          Put a placeholder here to simulate a real page.
        */}

        <UserMainPage />

      </DashboardLayout>
    );
  }


  // if(DEV_MODE){
  //   return(
  //     <AdminDashboardLayout user={mockUser}>

  //     </AdminDashboardLayout>
  //   )
  // }



  const navigateToLogin = () => {
    setAuthPage('login');
  };


  if (isLoading) {

    return <div className="bg-slate-900 min-h-screen" />;
  }


    if (session && profile) {
    // If a session and profile exist, check the role.
    if (profile.role === 'admin') {
      // If the role is 'admin', show the AdminDashboardLayout.
      return (
        <AdminDashboardLayout user={session.user}>
          {/* You can put admin-specific page content here */}
          <div>Admin Content</div> 
        </AdminDashboardLayout>
      );
    } else {
      // Otherwise, show the regular DashboardLayout for 'members'.
      return (
        <DashboardLayout user={session.user}>
          <UserMainPage/>
        </DashboardLayout>
      );
    }
  } else {
    // If there's no session, show the public pages.
    return authPage === 'login' 
      ? <LoginPage /> 
      : <LandingPage onNavigateToLogin={navigateToLogin} />;
  }

}

export default App;

