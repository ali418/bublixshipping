'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi } from '../lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  hubId?: string;
  language: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    if (token) adminApi.logout(token).catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('bblx_token');
    window.location.href = '/login';
  }, [token]);

  useEffect(() => {
    const stored = localStorage.getItem('bblx_token');
    if (stored) {
      setToken(stored);
      adminApi.me(stored)
        .then((res: any) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('bblx_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await adminApi.login(email, password);
    const { accessToken, user: u } = res.data;
    setToken(accessToken);
    setUser(u);
    localStorage.setItem('bblx_token', accessToken);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
