import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendPushNotification } from '../lib/push';

export const increaseStock = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { changeAmount, reason, version } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz ürün ID' });
    }

    if (!changeAmount || changeAmount <= 0) {
      return res.status(400).json({ error: 'Artış miktarı 0\'dan büyük olmalıdır' });
    }

    if (version === undefined) {
      return res.status(400).json({ error: 'Ürün versiyonu (version) belirtilmelidir' });
    }

    // Use a transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id, deletedAt: null }
      });

      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      if (product.version !== parseInt(version)) {
        throw new Error('VERSION_CONFLICT');
      }

      const newStock = product.stockQuantity + parseInt(changeAmount);

      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          stockQuantity: newStock,
          version: product.version + 1
        }
      });

      // Create Stock Movement
      await tx.stockMovement.create({
        data: {
          productId: id,
          userId: authReq.user?.id || 1,
          changeAmount: parseInt(changeAmount),
          movementType: 'IN',
          reason: reason || 'Stok girişi'
        }
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: authReq.user?.id,
          entityType: 'PRODUCT',
          entityId: id,
          action: 'STOCK_INCREASE',
          oldData: product as any,
          newData: updatedProduct as any
        }
      });

      return updatedProduct;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Increase stock error:', error);
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }
    if (error.message === 'VERSION_CONFLICT') {
      return res.status(409).json({ error: 'Çakışma oluştu. Ürün bilgileri başka bir işlem tarafından güncellenmiş.' });
    }
    res.status(500).json({ error: 'Stok artırılırken sunucu hatası oluştu' });
  }
};

export const decreaseStock = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { changeAmount, reason, version } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz ürün ID' });
    }

    if (!changeAmount || changeAmount <= 0) {
      return res.status(400).json({ error: 'Azalış miktarı 0\'dan büyük olmalıdır' });
    }

    if (version === undefined) {
      return res.status(400).json({ error: 'Ürün versiyonu (version) belirtilmelidir' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id, deletedAt: null }
      });

      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      if (product.version !== parseInt(version)) {
        throw new Error('VERSION_CONFLICT');
      }

      const newStock = product.stockQuantity - parseInt(changeAmount);

      // NEGATIF STOK KONTROLU
      if (newStock < 0) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          stockQuantity: newStock,
          version: product.version + 1
        }
      });

      // Create Stock Movement
      await tx.stockMovement.create({
        data: {
          productId: id,
          userId: authReq.user?.id || 1,
          changeAmount: -parseInt(changeAmount),
          movementType: 'OUT',
          reason: reason || 'Stok çıkışı'
        }
      });

      // DÜŞÜK STOK SİSTEMİ BİLDİRİMİ
      if (newStock <= product.minimumStock) {
        await tx.notification.create({
          data: {
            productId: id,
            message: `Kritik Stok Uyarısı: ${product.productCode} (${product.name}) stok miktarı minimum seviyenin (${product.minimumStock}) altına düşerek ${newStock} adet olmuştur.`
          }
        });
      }

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: authReq.user?.id,
          entityType: 'PRODUCT',
          entityId: id,
          action: 'STOCK_DECREASE',
          oldData: product as any,
          newData: updatedProduct as any
        }
      });

      return updatedProduct;
    });

    // Send Web Push notification out of transaction if stock is critical
    if (result.stockQuantity <= (result.minimumStock || 0)) {
      sendPushNotification(
        'Kritik Stok Uyarısı ⚠️',
        `${result.productCode} (${result.name}) stok seviyesi minimum sınırın altına düşerek ${result.stockQuantity} adet oldu!`,
        `/product/${result.id}`
      ).catch(err => console.error('Push notification failed to send:', err));
    }

    res.json(result);
  } catch (error: any) {
    console.error('Decrease stock error:', error);
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }
    if (error.message === 'VERSION_CONFLICT') {
      return res.status(409).json({ error: 'Çakışma oluştu. Ürün bilgileri başka bir işlem tarafından güncellenmiş.' });
    }
    if (error.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ error: 'Yetersiz stok. Stok miktarı negatif olamaz.' });
    }
    res.status(500).json({ error: 'Stok azaltılırken sunucu hatası oluştu' });
  }
};

export const getProductMovements = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz ürün ID' });
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Stok hareketleri yüklenirken hata oluştu' });
  }
};
