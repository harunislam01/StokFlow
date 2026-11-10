import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const monthRange = (year: number, month: number) => ({
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1)
});

// Builds the report data for a given month without persisting anything.
const buildMonthlyReport = async (year: number, month: number) => {
    const { start, end } = monthRange(year, month);

    const [monthlyIn, monthlyOut, movements] = await Promise.all([
        prisma.stockMovement.aggregate({
            where: { movementType: 'IN', createdAt: { gte: start, lt: end } },
            _sum: { changeAmount: true }
        }),
        prisma.stockMovement.aggregate({
            where: { movementType: 'OUT', createdAt: { gte: start, lt: end } },
            _sum: { changeAmount: true }
        }),
        prisma.stockMovement.findMany({
            where: { createdAt: { gte: start, lt: end } },
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { name: true, productCode: true } },
                user: { select: { username: true } }
            }
        })
    ]);

    return {
        totalIn: monthlyIn._sum.changeAmount || 0,
        totalOut: Math.abs(monthlyOut._sum.changeAmount || 0),
        movements
    };
};

// Persists (or refreshes) the snapshot of a month so it never gets lost.
const archiveMonth = async (year: number, month: number) => {
    const report = await buildMonthlyReport(year, month);

    // JSON columns cannot hold Date objects, so normalize timestamps first.
    const snapshot = {
        movements: report.movements.map((movement) => ({
            ...movement,
            createdAt: movement.createdAt.toISOString()
        })),
        generatedAt: new Date().toISOString()
    };

    const data = {
        totalIn: report.totalIn,
        totalOut: report.totalOut,
        movementCount: report.movements.length,
        data: snapshot
    };

    return prisma.monthlyReport.upsert({
        where: { year_month: { year, month } },
        create: { year, month, ...data },
        update: data
    });
};

// Called whenever reports are read: the previous month is archived automatically
// once, which covers the "end of month" requirement without a separate cron job.
const ensurePreviousMonthArchived = async () => {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = previous.getFullYear();
    const month = previous.getMonth() + 1;

    const existing = await prisma.monthlyReport.findUnique({
        where: { year_month: { year, month } }
    });
    if (existing) return;

    const report = await buildMonthlyReport(year, month);
    if (report.movements.length === 0) return;

    await archiveMonth(year, month);
};

export const getMonthlyReport = async (req: Request, res: Response) => {
    try {
        await ensurePreviousMonthArchived().catch((error) => {
            console.error('Auto archive previous month error:', error);
        });

        const now = new Date();
        const report = await buildMonthlyReport(now.getFullYear(), now.getMonth() + 1);

        res.json(report);
    } catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({ error: 'Rapor verileri getirilemedi' });
    }
};

// GET /api/reports/archives
export const getReportArchives = async (req: Request, res: Response) => {
    try {
        await ensurePreviousMonthArchived().catch((error) => {
            console.error('Auto archive previous month error:', error);
        });

        const reports = await prisma.monthlyReport.findMany({
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            select: {
                id: true,
                year: true,
                month: true,
                totalIn: true,
                totalOut: true,
                movementCount: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(reports);
    } catch (error) {
        console.error('Get report archives error:', error);
        res.status(500).json({ error: 'Geçmiş raporlar getirilemedi' });
    }
};

// POST /api/reports/archives
export const createReportArchive = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const year = req.body?.year !== undefined ? Number(req.body.year) : now.getFullYear();
        const month = req.body?.month !== undefined ? Number(req.body.month) : now.getMonth() + 1;

        if (!Number.isInteger(year) || year < 2000 || year > 2100) {
            return res.status(400).json({ error: 'Geçersiz yıl' });
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return res.status(400).json({ error: 'Geçersiz ay' });
        }

        // Do not create an empty archive when the month has no stock movements.
        const report = await buildMonthlyReport(year, month);
        if (report.movements.length === 0) {
            return res.status(400).json({ error: 'Bu ay için arşivlenecek stok hareketi bulunmuyor' });
        }

        const saved = await archiveMonth(year, month);

        res.status(201).json({
            id: saved.id,
            year: saved.year,
            month: saved.month,
            totalIn: saved.totalIn,
            totalOut: saved.totalOut,
            movementCount: saved.movementCount,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt
        });
    } catch (error) {
        console.error('Archive report error:', error);
        res.status(500).json({ error: 'Rapor arşivlenirken hata oluştu' });
    }
};

// GET /api/reports/archives/:id
export const getReportArchiveById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Geçersiz rapor ID' });
        }

        const report = await prisma.monthlyReport.findUnique({ where: { id } });
        if (!report) {
            return res.status(404).json({ error: 'Rapor bulunamadı' });
        }

        res.json(report);
    } catch (error) {
        console.error('Get report archive error:', error);
        res.status(500).json({ error: 'Rapor getirilemedi' });
    }
};
