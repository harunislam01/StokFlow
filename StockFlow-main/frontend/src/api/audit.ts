import { apiClient } from './client';

export interface AuditLog {
  id: number;
  userId: number | null;
  entityType: string;
  entityId: number | null;
  action: string;
  oldData: any | null;
  newData: any | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    username: string;
    role: string;
  } | null;
}

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  const response = await apiClient.get('/audit-logs');
  return response.data;
};
