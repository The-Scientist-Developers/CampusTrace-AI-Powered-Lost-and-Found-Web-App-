import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../api/apiClient";

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial profile with university name
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile with university name in one query
        const { data, error } = await supabase
          .from("profiles")
          .select("*, universities(name)")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // Extract university name and add it to profile
        const profileWithUniversity = {
          ...data,
          universityName: data.universities?.name || "CampusTrace",
        };

        setCurrentProfile(profileWithUniversity);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Set up real-time subscription for profile updates
  useEffect(() => {
    if (!currentProfile?.id) return;

    const channel = supabase
      .channel(`profile-${currentProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${currentProfile.id}`,
        },
        (payload) => {
          console.log("Profile updated in real-time:", payload.new);
          setCurrentProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfile?.id]);

  const updateProfile = (updates) => {
    setCurrentProfile((prev) => ({ ...prev, ...updates }));
  };

  const refreshProfile = async () => {
    if (!currentProfile?.id) return;

    try {
      // Fetch profile with university name
      const { data, error } = await supabase
        .from("profiles")
        .select("*, universities(name)")
        .eq("id", currentProfile.id)
        .single();

      if (error) throw error;

      // Extract university name and add it to profile
      const profileWithUniversity = {
        ...data,
        universityName: data.universities?.name || "CampusTrace",
      };

      setCurrentProfile(profileWithUniversity);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile: currentProfile,
        loading,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
