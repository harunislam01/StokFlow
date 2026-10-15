import { apiClient } from './client';

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  lowStockCount: number;
  totalStock: number;
  todayIn: number;
  todayOut: number;
  mostUsedProduct: {
    name: string;
    quantity: number;
  } | null;
}

export interface CategoryDistributionItem {
  categoryName: string;
  color: string;
  productCount: number;
  totalStock: number;
}

export interface RecentMovementItem {
  id: number;
  productId: number;
  userId: number;
  changeAmount: number;
  movementType: 'IN' | 'OUT';
  reason: string | null;
  createdAt: string;
  product: {
    name: string;
    productCode: string;
  };
  user: {
    username: string;
  };
}

export interface CriticalStockItem {
  id: number;
  name: string;
  productCode: string;
  stockQuantity: number;
  minimumStock: number;
  percentage: number;
}

export interface DashboardChartsData {
  categoryDistribution: CategoryDistributionItem[];
  recentMovements: RecentMovementItem[];
  recentProducts: any[];
  criticalStocks: CriticalStockItem[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

export const getDashboardCharts = async (): Promise<DashboardChartsData> => {
  const response = await apiClient.get('/dashboard/charts');
  return response.data;
};
