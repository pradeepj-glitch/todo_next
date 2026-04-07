"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export type ThemeColor = 'indigo' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink';

export interface ThemeConfig {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  gradient: string;
  boxShadow: string;
}

export const THEME_COLORS: Record<ThemeColor, ThemeConfig> = {
  indigo: {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
  },
  blue: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
  },
  green: {
    primary: '#22c55e',
    primaryLight: '#4ade80',
    primaryDark: '#16a34a',
    gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
    boxShadow: '0 8px 25px rgba(34, 197, 94, 0.3)',
  },
  purple: {
    primary: '#a855f7',
    primaryLight: '#c084fc',
    primaryDark: '#9333ea',
    gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
    boxShadow: '0 8px 25px rgba(168, 85, 247, 0.3)',
  },
  orange: {
    primary: '#f97316',
    primaryLight: '#fb923c',
    primaryDark: '#ea580c',
    gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
    boxShadow: '0 8px 25px rgba(249, 115, 22, 0.3)',
  },
  red: {
    primary: '#ef4444',
    primaryLight: '#f87171',
    primaryDark: '#dc2626',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
  },
  pink: {
    primary: '#ec4899',
    primaryLight: '#f472b6',
    primaryDark: '#db2777',
    gradient: 'linear-gradient(135deg, #ec4899, #a855f7)',
    boxShadow: '0 8px 25px rgba(236, 72, 153, 0.3)',
  },
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeColor, setThemeColorState] = useState<ThemeColor>('indigo');
  const [darkMode, setDarkModeState] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Load saved theme color from localStorage (user-specific key)
        const savedTheme = localStorage.getItem(`themeColor_${data.user.id}`) as ThemeColor;
        if (savedTheme && THEME_COLORS[savedTheme]) {
          setThemeColorState(savedTheme);
        }
        // Load dark mode preference (user-specific key)
        const savedDarkMode = localStorage.getItem(`darkMode_${data.user.id}`);
        if (savedDarkMode === 'true') {
          setDarkModeState(true);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const setThemeColor = useCallback((color: ThemeColor) => {
    setThemeColorState(color);
    // Store per-user
    if (user) {
      localStorage.setItem(`themeColor_${user.id}`, color);
    }
  }, [user]);

  const toggleDarkMode = useCallback(() => {
    setDarkModeState((prev) => {
      const newValue = !prev;
      // Store per-user
      if (user) {
        localStorage.setItem(`darkMode_${user.id}`, String(newValue));
      }
      return newValue;
    });
  }, [user]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      themeColor, 
      setThemeColor,
      darkMode,
      toggleDarkMode, 
      login, 
      register, 
      logout, 
      checkAuth,
      updateUser
    }}>
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