import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { User, AuthResponse } from '@/types/auth';
import type { ApiResponse } from '@postcommander/shared';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get<ApiResponse<{ user: User }>>(`${API_URL}/auth/me`, {
        withCredentials: true,
      });

      if (data.success && data.data) {
        setUser(data.data.user);
        return;
      }
      setUser(null);
    } catch {
      if (import.meta.env.DEV) {
        try {
          const { data } = await axios.post<ApiResponse<{ user: User }>>(
            `${API_URL}/auth/dev-login`,
            {},
            { withCredentials: true },
          );
          if (data.success && data.data) {
            setUser(data.data.user);
            return;
          }
        } catch {
          // Dev auto-login disabled (DEV_AUTO_LOGIN_EMAIL not set) — fall through.
        }
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
      email,
      password,
    }, {
      withCredentials: true,
    });

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/register`, {
      email,
      password,
      name,
    }, {
      withCredentials: true,
    });

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Registration failed');
    }

    setUser(data.data.user);
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
