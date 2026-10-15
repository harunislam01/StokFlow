import { db } from './db';
import { apiClient } from '../api/client';

let isSyncing = false;

export const syncOfflineData = async () => {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  // Retrieve pending items
  const queueItems = await db.syncQueue
    .where('status')
    .equals('PENDING')
    .sortBy('createdAt');

  if (queueItems.length === 0) return;

  isSyncing = true;
  console.log(`[SyncService]: Senkronizasyon başladı, ${queueItems.length} bekleyen işlem var.`);

  for (const item of queueItems) {
    try {
      if (item.actionType === 'STOCK_IN') {
        const { productId, changeAmount, reason, version } = item.payload;
        const response = await apiClient.post(`/stock/${productId}/increase`, {
          changeAmount,
          reason,
          version
        });
        const updated = response.data;
        await db.products.update(productId, { version: updated.version, stockQuantity: updated.stockQuantity });
      } 
      else if (item.actionType === 'STOCK_OUT') {
        const { productId, changeAmount, reason, version } = item.payload;
        const response = await apiClient.post(`/stock/${productId}/decrease`, {
          changeAmount,
          reason,
          version
        });
        const updated = response.data;
        await db.products.update(productId, { version: updated.version, stockQuantity: updated.stockQuantity });
      } 
      else if (item.actionType === 'CREATE') {
        const productData = { ...item.payload };
        const tempId = productData.id;
        delete productData.id; // Remove temp ID
        
        const response = await apiClient.post('/products', productData);
        const saved = response.data;
        
        // Replace temp ID in local DB
        await db.products.delete(tempId);
        await db.products.put({
          id: saved.id,
          categoryId: saved.categoryId,
          productCode: saved.productCode,
          materialCode: saved.materialCode,
          name: saved.name,
          description: saved.description,
          stockQuantity: saved.stockQuantity,
          minimumStock: saved.minimumStock,
          location: saved.location,
          attributes: saved.attributes,
          version: saved.version,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt
        });

        // Update other queued items
        const remainingQueue = await db.syncQueue.where('status').equals('PENDING').toArray();
        for (const rem of remainingQueue) {
          let updated = false;
          if (rem.payload.productId === tempId) {
            rem.payload.productId = saved.id;
            updated = true;
          }
          if (rem.payload.id === tempId) {
            rem.payload.id = saved.id;
            updated = true;
          }
          if (updated) {
            await db.syncQueue.put(rem);
          }
        }
      } 
      else if (item.actionType === 'UPDATE') {
        const { id, updates } = item.payload;
        const response = await apiClient.put(`/products/${id}`, updates);
        const saved = response.data;
        await db.products.put(saved);
      } 
      else if (item.actionType === 'DELETE') {
        const { id } = item.payload;
        await apiClient.delete(`/products/${id}`);
        await db.products.delete(id);
      }

      // If successful, remove from queue
      if (item.id) {
        await db.syncQueue.delete(item.id);
      }
      console.log(`[SyncService]: İşlem başarıyla senkronize edildi: ${item.actionType}`);
    } catch (error: any) {
      console.error(`[SyncService]: Senkronizasyon hatası (${item.actionType}):`, error);

      if (error.response?.status === 409) {
        // Race condition / Version conflict! Mark as CONFLICT and raise event.
        if (item.id) {
          await db.syncQueue.update(item.id, { status: 'CONFLICT' as any });

          let serverProduct = null;
          try {
            const prodId = item.payload.productId || item.payload.id;
            if (prodId) {
              const res = await apiClient.get(`/products/${prodId}`);
              serverProduct = res.data;
            }
          } catch (e) {
            console.error('Failed to fetch server product for conflict resolution', e);
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sync-conflict', {
              detail: {
                queueItemId: item.id,
                actionType: item.actionType,
                payload: item.payload,
                serverProduct
              }
            }));
          }
        }
      } else {
        // Network or server error, pause the queue processing
        break;
      }
    }
  }

  isSyncing = false;
  console.log('[SyncService]: Senkronizasyon tamamlandı.');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sync-completed'));
  }
};

// Initialize listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncService]: Cihaz tekrar çevrimiçi. Veriler senkronize ediliyor...');
    syncOfflineData();
  });

  // Periodically check every 30 seconds
  setInterval(syncOfflineData, 30000);
}
