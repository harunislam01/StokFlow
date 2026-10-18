import React, { createContext, useContext } from 'react';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useAuthStore();

  const login = (newUser: User) => {
    // The accessToken is set inside the api helper, but just in case, we support the standard call here
    // user is persisted to localStorage inside setAuth (without tokens)
    store.setAuth(newUser, store.accessToken || '');
  };

  const logout = () => {
    store.clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user: store.user, login, logout, isAuthenticated: store.isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
