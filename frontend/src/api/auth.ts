import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';

export const login = async (username: string, password?: string, rememberMe?: boolean) => {
  const response = await apiClient.post('/login', { username, password, rememberMe });
  const { user, accessToken } = response.data;
  
  // Set Zustand auth state (access token in memory, user in localStorage)
  useAuthStore.getState().setAuth(user, accessToken);
  
  return user;
};

export const logout = async () => {
  try {
    await apiClient.post('/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    useAuthStore.getState().clearAuth();
  }
};
