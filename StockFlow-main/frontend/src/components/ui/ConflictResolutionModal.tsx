import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Server, Smartphone } from 'lucide-react';
import { db } from '../../lib/db';
import { syncOfflineData } from '../../lib/syncService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Button } from './button';
import { useTheme } from '../../context/ThemeProvider';

export const ConflictResolutionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [resolving, setResolving] = useState(false);
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleConflict = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setConflictData(detail);
      setIsOpen(true);
    };

    window.addEventListener('sync-conflict', handleConflict);
    return () => window.removeEventListener('sync-conflict', handleConflict);
  }, []);

  if (!conflictData) return null;

  const { queueItemId, actionType, payload, serverProduct } = conflictData;
  const productCode = serverProduct?.productCode || 'Bilinmeyen Ürün';
  const productName = serverProduct?.name || '';

  // 1. Accept Server Version (Discard local changes, sync with server)
  const handleAcceptServer = async () => {
    setResolving(true);
    try {
      // Delete conflicting item from offline queue
      await db.syncQueue.delete(queueItemId);

      // Overwrite local product cache with the fresh server product details
      if (serverProduct) {
        await db.products.put(serverProduct);
      }

      // Refresh react-query views
      queryClient.invalidateQueries();
      setIsOpen(false);
      setConflictData(null);
    } catch (err) {
      console.error('Failed to resolve conflict by accepting server version:', err);
    } finally {
      setResolving(false);
    }
  };

  // 2. Overwrite / Force Push (Fetch current server version, update payload version, and retry)
  const handleForceOverwrite = async () => {
    setResolving(true);
    try {
      if (!serverProduct) {
        alert('Sunucu sürüm detayları alınamadığı için zorla gönderme yapılamıyor.');
        return;
      }

      // Fetch the conflicting item from database queue
      const item = await db.syncQueue.get(queueItemId);
      if (!item) return;

      // Construct a new payload with the matching server version to bypass 409
      const updatedPayload = { ...item.payload };
      if (actionType === 'STOCK_IN' || actionType === 'STOCK_OUT') {
        updatedPayload.version = serverProduct.version;
      } else if (actionType === 'UPDATE') {
        updatedPayload.updates.version = serverProduct.version;
      }

      // Re-enqueue the sync item with updated version and set status back to PENDING
      await db.syncQueue.put({
        ...item,
        payload: updatedPayload,
        status: 'PENDING'
      });

      setIsOpen(false);
      setConflictData(null);

      // Trigger synchronization immediately
      setTimeout(() => syncOfflineData(), 300);
    } catch (err) {
      console.error('Failed to resolve conflict by forcing overwrite:', err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={`max-w-md rounded-xl p-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>
        <DialogHeader className="items-center text-center pb-2">
          <div className="bg-amber-500/10 p-3.5 rounded-full mb-2">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <DialogTitle className="text-lg font-bold">
            Veri Çakışması Algılandı
          </DialogTitle>
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <strong>{productCode}</strong> ({productName}) ürünü üzerinde yaptığınız çevrimdışı değişiklikler, sunucudaki başka bir güncelleme ile çakıştı.
          </p>
        </DialogHeader>

        {/* Conflict Details Panel */}
        <div className={`p-4 rounded-lg border space-y-3.5 text-xs font-mono
          ${isDark ? 'bg-slate-800/40 border-white/[0.05] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
            <span className="font-semibold">Eylem:</span>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
              {actionType === 'STOCK_IN' && 'Stok Girişi'}
              {actionType === 'STOCK_OUT' && 'Stok Çıkışı'}
              {actionType === 'UPDATE' && 'Ürün Güncelleme'}
              {actionType === 'DELETE' && 'Ürün Silme'}
              {actionType === 'CREATE' && 'Yeni Ürün Ekleme'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 font-bold text-red-500">
                <Smartphone className="h-3.5 w-3.5" /> Sizin İşleminiz
              </span>
              <p className="mt-1 text-[11px] leading-tight">
                {actionType === 'STOCK_IN' && `+${payload.changeAmount} adet ekleme`}
                {actionType === 'STOCK_OUT' && `-${payload.changeAmount} adet çıkarma`}
                {actionType === 'UPDATE' && 'Ürün alanlarını değiştirme'}
              </p>
              <p className="text-[10px] text-slate-500">Sürüm: {payload.version || payload.updates?.version || 1}</p>
            </div>
            
            <div className="space-y-1 border-l pl-4 border-slate-300 dark:border-slate-700">
              <span className="flex items-center gap-1.5 font-bold text-emerald-500">
                <Server className="h-3.5 w-3.5" /> Sunucu Sürümü
              </span>
              <p className="mt-1 text-[11px] leading-tight">
                Stok: <strong>{serverProduct?.stockQuantity} adet</strong>
              </p>
              <p className="text-[10px] text-slate-500">Sürüm: {serverProduct?.version || 1}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3">
          <Button
            variant="outline"
            onClick={handleAcceptServer}
            disabled={resolving}
            className="flex-1 h-11 text-xs btn-tactile"
          >
            Sunucuyu Kabul Et
          </Button>
          <Button
            onClick={handleForceOverwrite}
            disabled={resolving}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-11 text-xs btn-tactile font-semibold"
          >
            Benimkini Zorla Gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
