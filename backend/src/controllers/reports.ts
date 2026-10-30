import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getMonthlyReport = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        // İçinde bulunduğumuz ayın ilk günü
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Bu ayki toplam giriş ve çıkışlar
        const monthlyIn = await prisma.stockMovement.aggregate({
            where: { movementType: 'IN', createdAt: { gte: firstDayOfMonth } },
            _sum: { changeAmount: true }
        });

        const monthlyOut = await prisma.stockMovement.aggregate({
            where: { movementType: 'OUT', createdAt: { gte: firstDayOfMonth } },
            _sum: { changeAmount: true }
        });

        // Bu ayki tüm hareketlerin detaylı listesi (Tablo için)
        const movements = await prisma.stockMovement.findMany({
            where: { createdAt: { gte: firstDayOfMonth } },
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { name: true, productCode: true } },
                user: { select: { username: true } }
            }
        });

        res.json({
            totalIn: monthlyIn._sum.changeAmount || 0,
            totalOut: Math.abs(monthlyOut._sum.changeAmount || 0),
            movements
        });
    } catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({ error: 'Rapor verileri getirilemedi' });
    }
};