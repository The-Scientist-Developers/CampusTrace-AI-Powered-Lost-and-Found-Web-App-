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

// const DEV_MODE = true;


function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null)
  const [authPage, setAuthPage] = useState('landing');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // if (DEV_MODE) return;
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
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data); 
        }
      } else {
        setProfile(null);
        setAuthPage('landing');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);


{/* Gamitin niyo to pag gusto niyong i edit lang yung specific page, para hindi makadami ng send kay supabase */}

  //   if (DEV_MODE) {
  //   return (
  //     <DashboardLayout user1={mockUser}>
  //       {/* The {children} prop needs content. 
  //         Put a placeholder here to simulate a real page.
  //       */}

  //       <UserMainPage />

  //     </DashboardLayout>
  //   );
  // }


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
    if (profile.role === 'admin') {
      return (
        <AdminDashboardLayout user={session.user}>
          <div>Admin Content</div> 
        </AdminDashboardLayout>
      );
    } else {
      return (
        <DashboardLayout user={session.user}>
          <UserMainPage/>
          {/* <UserProfilePage/> */}
        </DashboardLayout>
      );
    }
  } else {
    
    return authPage === 'login' 
      ? <LoginPage /> 
      : <LandingPage onNavigateToLogin={navigateToLogin} />;
  }

}

export default App;

