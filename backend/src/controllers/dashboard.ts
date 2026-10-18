import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalProducts,
      totalCategories,
      totalStockRes,
      lowStockRes,
      todayIn,
      todayOut,
      mostMovedGroup
    ] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.category.count({ where: { deletedAt: null } }),
      prisma.$queryRaw<[{ sum: number }]>`
        SELECT COALESCE(SUM(stock_quantity), 0)::int as sum FROM products WHERE deleted_at IS NULL
      `,
      prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int as count FROM products WHERE deleted_at IS NULL AND stock_quantity <= minimum_stock
      `,
      prisma.stockMovement.aggregate({
        where: { movementType: 'IN', createdAt: { gte: today } },
        _sum: { changeAmount: true }
      }),
      prisma.stockMovement.aggregate({
        where: { movementType: 'OUT', createdAt: { gte: today } },
        _sum: { changeAmount: true }
      }),
      prisma.stockMovement.groupBy({
        by: ['productId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1
      })
    ]);

    const totalStock = totalStockRes[0]?.sum || 0;
    const lowStockCount = lowStockRes[0]?.count || 0;

    let mostUsedProduct: { name: string; quantity: number } | null = null;
    if (mostMovedGroup.length > 0) {
      const prod = await prisma.product.findUnique({
        where: { id: mostMovedGroup[0].productId },
        select: { name: true, stockQuantity: true }
      });
      if (prod) {
        mostUsedProduct = { name: prod.name, quantity: prod.stockQuantity };
      }
    }

    res.json({
      totalProducts,
      totalCategories,
      lowStockCount,
      totalStock,
      todayIn: todayIn._sum.changeAmount || 0,
      todayOut: Math.abs(todayOut._sum.changeAmount || 0),
      mostUsedProduct
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Dashboard istatistikleri yüklenirken hata oluştu' });
  }
};

export const getDashboardCharts = async (req: Request, res: Response) => {
  try {
    // 1. Single SQL query to get aggregated stock & product count per category
    const catStats = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      color: string | null;
      parent_id: number | null;
      productCount: number;
      totalStock: number;
    }>>`
      SELECT 
        c.id, 
        c.name, 
        c.color, 
        c.parent_id,
        COALESCE(COUNT(p.id), 0)::int as "productCount",
        COALESCE(SUM(p.stock_quantity), 0)::int as "totalStock"
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name, c.color, c.parent_id
    `;

    // Map parent categories and sum child stats
    const parentCats = catStats.filter(c => c.parent_id === null);
    const categoryDistribution = parentCats.map(cat => {
      let productCount = Number(cat.productCount);
      let totalStock = Number(cat.totalStock);

      const children = catStats.filter(c => c.parent_id === cat.id);
      children.forEach(sub => {
        productCount += Number(sub.productCount);
        totalStock += Number(sub.totalStock);
      });

      return {
        categoryName: cat.name,
        color: cat.color || 'slate-500',
        productCount,
        totalStock
      };
    });

    // 2. Son stok hareketleri (10 adet)
    const recentMovements = await prisma.stockMovement.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, productCode: true } },
        user: { select: { username: true } }
      }
    });

    // 3. Son eklenen ürünler (5 adet)
    const recentProducts = await prisma.product.findMany({
      take: 5,
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true } } }
    });

    // 4. Kritik stoklar (SQL ile filtresiz direk ilk 5)
    const rawCritical = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      productCode: string;
      stockQuantity: number;
      minimumStock: number;
    }>>`
      SELECT 
        id, 
        name, 
        product_code as "productCode", 
        stock_quantity as "stockQuantity", 
        minimum_stock as "minimumStock"
      FROM products
      WHERE deleted_at IS NULL AND stock_quantity <= minimum_stock
      ORDER BY stock_quantity ASC
      LIMIT 5
    `;

    const criticalStocks = rawCritical.map(p => ({
      id: p.id,
      name: p.name,
      productCode: p.productCode,
      stockQuantity: p.stockQuantity,
      minimumStock: p.minimumStock,
      percentage: p.minimumStock > 0
        ? Math.round((p.stockQuantity / p.minimumStock) * 100)
        : 0
    }));

    res.json({
      categoryDistribution,
      recentMovements,
      recentProducts,
      criticalStocks
    });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    res.status(500).json({ error: 'Grafik verileri yüklenirken hata oluştu' });
  }
};

