import { apiClient } from './client';

export interface ReportArchiveSummary {
    id: number;
    year: number;
    month: number;
    totalIn: number;
    totalOut: number;
    movementCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ReportArchive extends ReportArchiveSummary {
    data: {
        movements: any[];
        generatedAt?: string;
    };
}

export const getMonthlyReport = async () => {
    const response = await apiClient.get('/reports/monthly');
    return response.data;
};

export const getReportArchives = async (): Promise<ReportArchiveSummary[]> => {
    const response = await apiClient.get('/reports/archives');
    return response.data;
};

export const createReportArchive = async (payload?: { year?: number; month?: number }): Promise<ReportArchiveSummary> => {
    const response = await apiClient.post('/reports/archives', payload || {});
    return response.data;
};

export const getReportArchiveById = async (id: number): Promise<ReportArchive> => {
    const response = await apiClient.get(`/reports/archives/${id}`);
    return response.data;
};
