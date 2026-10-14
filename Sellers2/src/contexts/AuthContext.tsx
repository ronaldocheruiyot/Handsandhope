import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'seller' | 'teacher' | 'student' | 'school' | 'admin' | 'super-admin' | 'caregiver';
  businessName?: string;
  school?: string;
  teacher?: string;
  address?: string;
  location?: string;
  profilePhoto?: string;
  bio?: string;
  skills?: string[];
  hobbies?: string[];
  disabilityId?: string;
  disabilityType?: string;
  specialization?: string;
  department?: string;
  accreditation?: string;
  joinDate?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse initial saved user:', e);
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('token') || localStorage.getItem('token') || null;
  });

  // Clean up localStorage and synchronize per-tab sessionStorage
  useEffect(() => {
    const savedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (savedToken && savedUser) {
      sessionStorage.setItem('token', savedToken);
      sessionStorage.setItem('user', savedUser);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    const handleUserUpdate = () => {
      const latestUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      const latestToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (latestUser && latestToken) {
        try {
          setUser(JSON.parse(latestUser));
          setToken(latestToken);
        } catch (e) {
          console.error('Failed to parse updated user event:', e);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener('auth_user_updated', handleUserUpdate);

    return () => {
      window.removeEventListener('auth_user_updated', handleUserUpdate);
    };
  }, []);

  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(newUser));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth_user_updated'));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth_user_updated'));
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updatedData };
      sessionStorage.setItem('user', JSON.stringify(nextUser));
      window.dispatchEvent(new Event('auth_user_updated'));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
