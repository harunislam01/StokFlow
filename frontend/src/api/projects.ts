import { apiClient } from './client';

export interface ProjectProduct {
  id: number;
  projectId: number;
  productId: number;
  quantity: number;
  note?: string | null;
  assignedAt: string;
  product: {
    id: number;
    name: string;
    productCode: string;
    stockQuantity: number;
    minimumStock: number;
    location?: string | null;
    category: { name: string; icon?: string | null };
  };
  assignedBy?: { username: string };
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdBy?: { username: string } | null;
  products: ProjectProduct[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  productIds?: Array<{ productId: number; quantity: number; note?: string }>;
}

export const getProjects = async (): Promise<Project[]> => {
  const res = await apiClient.get('/projects');
  return res.data;
};

export const getProjectById = async (id: number): Promise<Project> => {
  const res = await apiClient.get(`/projects/${id}`);
  return res.data;
};

export const createProject = async (data: CreateProjectPayload): Promise<Project> => {
  const res = await apiClient.post('/projects', data);
  return res.data;
};

export const updateProject = async (id: number, data: Partial<CreateProjectPayload>): Promise<Project> => {
  const res = await apiClient.put(`/projects/${id}`, data);
  return res.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await apiClient.delete(`/projects/${id}`);
};

export const addProductToProject = async (
  projectId: number,
  productId: number,
  quantity: number = 1,
  note?: string
): Promise<ProjectProduct> => {
  const res = await apiClient.post(`/projects/${projectId}/products`, {
    productId,
    quantity,
    note
  });
  return res.data;
};

export const removeProductFromProject = async (
  projectId: number,
  productId: number
): Promise<void> => {
  await apiClient.delete(`/projects/${projectId}/products/${productId}`);
};

export const updateProjectProduct = async (
  projectId: number,
  productId: number,
  data: { quantity?: number; note?: string }
): Promise<ProjectProduct> => {
  const res = await apiClient.put(`/projects/${projectId}/products/${productId}`, data);
  return res.data;
};
