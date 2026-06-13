import React, { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, tokenStorageKey } from "@/lib/apiClient";
import { User } from "@/lib/types";

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: null;
  loading: boolean;
  isLoading: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const token = localStorage.getItem(tokenStorageKey);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await apiRequest<User>("/users/me");
        setUser(profile);
      } catch (error) {
        console.warn("Stored session is no longer valid:", error);
        localStorage.removeItem(tokenStorageKey);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData: { firstName: string; lastName: string },
  ) => {
    try {
      setLoading(true);
      const response = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          firstName: userData.firstName,
          lastName: userData.lastName,
        }),
      });

      localStorage.setItem(tokenStorageKey, response.token);
      setUser(response.user);
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
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem(tokenStorageKey, response.token);
      setUser(response.user);
    } catch (error: any) {
      console.error("Error signing in:", error);
      throw new Error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem(tokenStorageKey);
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error("No user logged in");

      const updatedUser = await apiRequest<User>("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          avatar: data.avatar,
          phone: data.phone,
        }),
      });

      setUser(updatedUser);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw new Error(error.message || "Failed to update profile");
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser: null,
    loading,
    isLoading: loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
