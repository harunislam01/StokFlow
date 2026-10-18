import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { name: true, productCode: true }
        }
      }
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Bildirimler yüklenirken hata oluştu' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz bildirim ID' });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Bildirim güncellenirken hata oluştu' });
  }
};

export const subscribePush = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Geçersiz abonelik detayları' });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        keys: keys as any
      },
      create: {
        userId,
        endpoint,
        keys: keys as any
      }
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Push subscribe controller error:', error);
    res.status(500).json({ error: 'Push aboneliği kaydedilemedi' });
  }
};
