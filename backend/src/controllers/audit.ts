import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true, role: true }
        }
      }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Denetim kayıtları yüklenirken hata oluştu' });
  }
};
