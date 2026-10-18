import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe load of user metadata from localStorage (non-sensitive)
  const getSavedUser = (): User | null => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const initialUser = getSavedUser();

  return {
    user: initialUser,
    accessToken: null, // Memory-only!
    isAuthenticated: !!initialUser,
    setAuth: (user, accessToken) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true });
    },
    setAccessToken: (accessToken) => {
      set({ accessToken });
    },
    clearAuth: () => {
      localStorage.removeItem('user');
      set({ user: null, accessToken: null, isAuthenticated: false });
    },
  };
});
