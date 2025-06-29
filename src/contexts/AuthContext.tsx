import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient, User, UserRegister, UserLogin, OTPVerify } from "../lib/api";
import { isTokenExpired, getTimeUntilExpiration } from "../lib/utils";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  token: string | null;
  isTokenExpired: () => boolean;
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

  // Function to handle logout (for token expiration)
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("padel_user");
    localStorage.removeItem("padel_token");
  };

  // Function to check if current token is expired
  const checkTokenExpiration = (): boolean => {
    return isTokenExpired(token);
  };

  // Function to set up automatic token expiration checking
  const setupTokenExpirationCheck = (tokenValue: string) => {
    // Clear any existing timeouts
    const timeUntilExpiration = getTimeUntilExpiration(tokenValue);
    
    if (timeUntilExpiration > 0) {
      // Set timeout to logout when token expires
      // Add a small buffer (1 minute) before actual expiration for better UX
      const bufferTime = Math.max(0, timeUntilExpiration - 60000); // 1 minute buffer
      
      setTimeout(() => {
        if (isTokenExpired(tokenValue)) {
          console.log('Token expired, logging out user');
          handleLogout();
        }
      }, bufferTime);
    }
  };

  useEffect(() => {
    // Set up the API client callback for token expiration
    apiClient.setTokenExpiredCallback(handleLogout);
    
    // Check for existing session
    const savedUser = localStorage.getItem("padel_user");
    const savedToken = localStorage.getItem("padel_token");
    
    if (savedUser && savedToken) {
      try {
        // First check if the saved token is expired
        if (isTokenExpired(savedToken)) {
          console.log('Saved token is expired, clearing session');
          localStorage.removeItem("padel_user");
          localStorage.removeItem("padel_token");
        } else {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setToken(savedToken);
          
          // Set up expiration checking for the existing token
          setupTokenExpirationCheck(savedToken);
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem("padel_user");
        localStorage.removeItem("padel_token");
      }
    }
    setLoading(false);
  }, []);

  // Periodic token validation (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (token && isTokenExpired(token)) {
        console.log('Token expired during periodic check, logging out user');
        handleLogout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [token]);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiClient.login({ email, password });
      
      // Check if the new token is already expired (shouldn't happen, but good to check)
      if (isTokenExpired(response.access_token)) {
        throw new Error("Received expired token from server");
      }
      
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
      
      // Set up expiration checking for the new token
      setupTokenExpirationCheck(response.access_token);
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
    handleLogout();
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
    isTokenExpired: checkTokenExpiration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};