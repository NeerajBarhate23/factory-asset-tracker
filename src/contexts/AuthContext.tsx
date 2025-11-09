import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api-client';
import type { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isSetupComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(true); // Always true now - using backend

  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      // Check for stored access token
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          // Verify token is valid by fetching current user
          const userData = await authApi.getCurrentUser();
          setUser(userData as User);
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const userData = await authApi.login(email, password);
      setUser(userData);
      // Tokens are automatically stored by api-client
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isSetupComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
