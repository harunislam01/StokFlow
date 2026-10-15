import { apiClient } from './client';
import type { User } from '../types';

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get('/users');
  return response.data;
};

export const createUser = async (user: Omit<User, 'id' | 'isActive'> & { password?: string }): Promise<User> => {
  const response = await apiClient.post('/users', user);
  return response.data;
};

export const updateUser = async (id: number, updates: Partial<User> & { password?: string }): Promise<User> => {
  const response = await apiClient.put(`/users/${id}`, updates);
  return response.data;
};

export const deleteUser = async (id: number): Promise<boolean> => {
  await apiClient.delete(`/users/${id}`);
  return true;
};
