import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { userService, analyticsService, EVENT_TYPES } from "@/services";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData: { firstName: string; lastName: string },
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (session?.user) {
          setSupabaseUser(session.user);
          // Fetch user profile from our database
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setSupabaseUser(session.user);
          await loadUserProfile(session.user.id);

          // Track login event
          if (event === "SIGNED_IN") {
            await analyticsService.trackEvent({
              eventType: EVENT_TYPES.USER_LOGIN,
              userId: session.user.id,
              eventData: { method: "email" },
            });
          }
        } else {
          setSupabaseUser(null);
          setUser(null);

          // Track logout event
          if (event === "SIGNED_OUT") {
            await analyticsService.trackEvent({
              eventType: EVENT_TYPES.USER_LOGOUT,
              eventData: { timestamp: new Date().toISOString() },
            });
          }
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await userService.getUserById(userId);
      if (userProfile) {
        setUser(userProfile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: { firstName: string; lastName: string },
  ) => {
    try {
      setLoading(true);

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile in our database
        const userProfile = await userService.createUserProfile({
          id: data.user.id,
          email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });

        setUser(userProfile);
        setSupabaseUser(data.user);

        // Track signup event
        await analyticsService.trackEvent({
          eventType: EVENT_TYPES.USER_SIGNUP,
          userId: data.user.id,
          eventData: { method: "email", email },
        });
      }
    } catch (error: any) {
      console.error("Error signing up:", error);
      throw new Error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setSupabaseUser(data.user);
        await loadUserProfile(data.user.id);
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      throw new Error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSupabaseUser(null);
    } catch (error: any) {
      console.error("Error signing out:", error);
      throw new Error(error.message || "Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error("No user logged in");

      const updatedUser = await userService.updateUserProfile(user.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        phone: data.phone,
      });

      setUser(updatedUser);

      // Track profile update
      await analyticsService.trackEvent({
        eventType: EVENT_TYPES.PROFILE_UPDATE,
        userId: user.id,
        eventData: { fields_updated: Object.keys(data) },
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw new Error(error.message || "Failed to update profile");
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
