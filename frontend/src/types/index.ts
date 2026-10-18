export interface Category {
  id: number;
  name: string;
  icon?: string | null;
  color?: string | null;
  parentId?: number | null;
  formSchema?: any;
  productCount?: number;
}

export interface Product {
  id: number;
  categoryId: number;
  productCode: string;
  materialCode?: string | null;
  name: string;
  description?: string | null;
  stockQuantity: number;
  minimumStock: number;
  location?: string | null;
  attributes: any;
  version: number;
  createdAt: string;
  updatedAt: string;
  projects?: ProjectProduct[];
}

export interface StockMovement {
  id: number;
  productId: number;
  userId: number;
  changeAmount: number;
  movementType: 'IN' | 'OUT';
  reason: string | null;
  userName?: string;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
}

export interface Notification {
  id: number;
  productId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  product?: {
    name: string;
    productCode: string;
  };
}

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
  project?: {
    id: number;
    name: string;
    status: string;
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

