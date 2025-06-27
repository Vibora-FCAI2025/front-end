import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient, User, UserRegister, UserLogin, OTPVerify } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("padel_user");
    const savedToken = localStorage.getItem("padel_token");
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setToken(savedToken);
      } catch (error) {
        localStorage.removeItem("padel_user");
        localStorage.removeItem("padel_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiClient.login({ email, password });
      
      // For now, create a mock user since the backend doesn't return user data
      const userData: User = {
        id: Date.now().toString(),
        email,
        name: email.split("@")[0],
        createdAt: new Date(),
      };
      
      setUser(userData);
      setToken(response.access_token);
      localStorage.setItem("padel_user", JSON.stringify(userData));
      localStorage.setItem("padel_token", response.access_token);
    } catch (error) {
      throw new Error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.register({ email, password, username });
      // Don't set user yet, wait for OTP verification
    } catch (error) {
      throw new Error("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email: string, otp: string): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.verifyOTP({ email, otp });
      
      // After successful OTP verification, create user session
      const userData: User = {
        id: Date.now().toString(),
        email,
        name: email.split("@")[0],
        createdAt: new Date(),
      };
      
      setUser(userData);
      localStorage.setItem("padel_user", JSON.stringify(userData));
    } catch (error) {
      throw new Error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("padel_user");
    localStorage.removeItem("padel_token");
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem("padel_user", JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    verifyOTP,
    logout,
    updateProfile,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};