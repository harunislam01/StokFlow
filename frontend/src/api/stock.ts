import { apiClient } from './client';

export const getAllStock = async () => {
    const response = await apiClient.get('/stock');
    return response.data;
};