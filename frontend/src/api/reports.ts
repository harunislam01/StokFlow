import { apiClient } from './client';

export const getMonthlyReport = async () => {
    const response = await apiClient.get('/reports/monthly');
    return response.data;
};