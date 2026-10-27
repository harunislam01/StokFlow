import { apiClient } from './client';

export interface Supplier {
    id: number;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    _count?: { products: number };
}

export const getSuppliers = async (): Promise<Supplier[]> => {
    const response = await apiClient.get('/suppliers');
    return response.data;
};

export const createSupplier = async (data: Omit<Supplier, 'id' | '_count'>): Promise<Supplier> => {
    const response = await apiClient.post('/suppliers', data);
    return response.data;
};

export const updateSupplier = async (id: number, data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.put(`/suppliers/${id}`, data);
    return response.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
};