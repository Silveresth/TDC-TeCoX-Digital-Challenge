'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (loginInput: string, passwordInput: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isJury: boolean;
  isParticipant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('tdc_access_token');
      const storedUser = localStorage.getItem('tdc_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Error parsing stored user', e);
          }
        }
        try {
          const res = await api.get('/auth/me/');
          setUser(res.data);
          localStorage.setItem('tdc_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Could not refresh profile on mount');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (loginInput: string, passwordInput: string) => {
    try {
      const res = await api.post('/auth/login/', {
        login: loginInput.trim(),
        password: passwordInput,
      });

      const { access, refresh, user: loggedUser } = res.data;
      localStorage.setItem('tdc_access_token', access);
      localStorage.setItem('tdc_refresh_token', refresh);
      localStorage.setItem('tdc_user', JSON.stringify(loggedUser));

      setToken(access);
      setUser(loggedUser);

      return { success: true, role: loggedUser.role };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Identifiant ou mot de passe incorrect.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('tdc_access_token');
    localStorage.removeItem('tdc_refresh_token');
    localStorage.removeItem('tdc_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me/');
      setUser(res.data);
      localStorage.setItem('tdc_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isJury = user?.role === 'JURY' || isAdmin;
  const isParticipant = user?.role === 'PARTICIPANT';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshProfile,
        isAdmin,
        isJury,
        isParticipant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
