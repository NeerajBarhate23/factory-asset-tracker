import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
      // Check for existing Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile from public.users table
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUser(profile as User);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profile) {
          setUser(profile as User);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
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
