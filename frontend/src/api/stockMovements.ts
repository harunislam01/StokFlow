import { apiClient } from './client';
import { db } from '../lib/db';
import type { StockMovement } from '../types';

const isOnline = () => navigator.onLine;

export const getStockMovements = async (productId: number): Promise<StockMovement[]> => {
  if (isOnline()) {
    try {
      const response = await apiClient.get(`/stock/${productId}/movements`);
      return response.data;
    } catch (error) {
      console.warn('Online stock movements fetch failed:', error);
    }
  }

  // Offline fallback - return empty or read from a local movements table if we had one.
  // Since we only maintain products locally, we return an empty array or basic simulation.
  return [];
};

export const addStockMovement = async (
  productId: number, 
  changeAmount: number, 
  _userName: string, 
  reason?: string,
  version?: number
): Promise<any> => {
  const absAmount = Math.abs(changeAmount);

  if (isOnline()) {
    const endpoint = changeAmount > 0 
      ? `/stock/${productId}/increase` 
      : `/stock/${productId}/decrease`;

    const response = await apiClient.post(endpoint, {
      changeAmount: absAmount,
      reason,
      version
    });

    // Update local product cache with returned updated product details
    const updatedProduct = response.data;
    await db.products.put({
      id: updatedProduct.id,
      categoryId: updatedProduct.categoryId,
      productCode: updatedProduct.productCode,
      materialCode: updatedProduct.materialCode,
      name: updatedProduct.name,
      description: updatedProduct.description,
      stockQuantity: updatedProduct.stockQuantity,
      minimumStock: updatedProduct.minimumStock,
      location: updatedProduct.location,
      attributes: updatedProduct.attributes,
      version: updatedProduct.version,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt
    });

    return response.data;
  }

  // Offline operation
  const product = await db.products.get(productId);
  if (!product) throw new Error('Ürün yerel veritabanında bulunamadı');

  const newStock = product.stockQuantity + changeAmount;
  if (newStock < 0) {
    throw new Error('Yetersiz stok. İşlem iptal edildi.');
  }

  // Update locally in IndexedDB
  await db.products.update(productId, {
    stockQuantity: newStock,
    version: product.version + 1
  });

  // Enqueue in sync queue
  await db.syncQueue.add({
    actionType: changeAmount > 0 ? 'STOCK_IN' : 'STOCK_OUT',
    payload: {
      productId,
      changeAmount: absAmount,
      reason,
      version: version || product.version // Use the stale version for THIS payload, so the server knows what version we started with
    },
    status: 'PENDING',
    createdAt: new Date().toISOString()
  });

  return {
    id: productId,
    stockQuantity: newStock,
    version: product.version // version remains same until synced and response increments it
  };
};
