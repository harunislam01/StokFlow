import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendPushNotification } from '../lib/push';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { categoryId, search, lowStock, location } = req.query;

    const whereClause: any = {
      deletedAt: null
    };

    if (categoryId) {
      const catId = parseInt(categoryId as string);
      
      // Tüm alt kategorileri özyinelemeli (recursive) olarak bul
      const allCategories = await prisma.category.findMany({
        where: { deletedAt: null },
        select: { id: true, parentId: true }
      });

      const getChildIds = (id: number): number[] => {
        const direct = allCategories.filter(c => c.parentId === id).map(c => c.id);
        const nested = direct.flatMap(childId => getChildIds(childId));
        return [id, ...direct, ...nested];
      };

      const categoryIds = Array.from(new Set(getChildIds(catId)));

      whereClause.categoryId = {
        in: categoryIds
      };
    }

    if (location) {
      whereClause.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }

    if (search && (search as string).trim() !== '') {
      const s = (search as string).trim();
      whereClause.OR = [
        { productCode: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
        { materialCode: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { location: { contains: s, mode: 'insensitive' } }
      ];
    }

    let products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      },
      orderBy: {
        productCode: 'asc'
      }
    });

    if (lowStock === 'true') {
      products = products.filter(p => p.stockQuantity <= p.minimumStock);
    }

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Ürünler yüklenirken hata oluştu' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz ürün ID' });
    }

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { username: true }
            }
          }
        },
        images: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Ürün yüklenirken hata oluştu' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { categoryId, productCode, materialCode, name, description, stockQuantity, minimumStock, location, attributes } = req.body;

    if (!categoryId || !productCode || !name || stockQuantity === undefined) {
      return res.status(400).json({ error: 'Kategori, ürün kodu, isim ve stok miktarı zorunludur' });
    }

    // Check unique product code
    const existing = await prisma.product.findFirst({
      where: { productCode, deletedAt: null }
    });

    if (existing) {
      return res.status(400).json({ error: 'Bu ürün kodu zaten kullanımda' });
    }

    const product = await prisma.product.create({
      data: {
        categoryId: parseInt(categoryId),
        productCode,
        materialCode: materialCode || null,
        name,
        description: description || null,
        stockQuantity: parseInt(stockQuantity),
        minimumStock: minimumStock !== undefined ? parseInt(minimumStock) : 10,
        location: location || null,
        attributes: attributes || {},
        version: 1
      }
    });

    // Create initial stock movement if quantity > 0
    const authReq = req as AuthenticatedRequest;
    if (product.stockQuantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          userId: authReq.user?.id || 1,
          changeAmount: product.stockQuantity,
          movementType: 'IN',
          reason: 'İlk stok girişi (Ürün oluşturma)'
        }
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'PRODUCT',
        entityId: product.id,
        action: 'CREATE',
        newData: product as any
      }
    });

    // Send push notification if initial stock is low
    if (product.stockQuantity <= (product.minimumStock || 0)) {
      sendPushNotification(
        'Kritik Stok Uyarısı ⚠️',
        `${product.productCode} (${product.name}) stok seviyesi minimum sınırın altında: ${product.stockQuantity} adet!`,
        `/product/${product.id}`
      ).catch(err => console.error('Push notification failed to send:', err));
    }

    res.status(201).json(product);
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Ürün eklenirken hata oluştu' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { categoryId, productCode, materialCode, name, description, minimumStock, location, attributes, version } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz ürün ID' });
    }

    if (version === undefined) {
      return res.status(400).json({ error: 'Ürün versiyonu (version) belirtilmelidir' });
    }

    const existingProduct = await prisma.product.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    // RACE CONDITION ENGELLEME (Optimistic Locking)
    if (existingProduct.version !== parseInt(version)) {
      return res.status(409).json({ error: 'Çakışma oluştu. Ürün başka bir kullanıcı tarafından güncellenmiş. Lütfen sayfayı yenileyin.' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        categoryId: categoryId !== undefined ? parseInt(categoryId) : existingProduct.categoryId,
        productCode: productCode !== undefined ? productCode : existingProduct.productCode,
        materialCode: materialCode !== undefined ? materialCode : existingProduct.materialCode,
        name: name !== undefined ? name : existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        minimumStock: minimumStock !== undefined ? parseInt(minimumStock) : existingProduct.minimumStock,
        location: location !== undefined ? location : existingProduct.location,
        attributes: attributes !== undefined ? attributes : existingProduct.attributes,
        version: existingProduct.version + 1 // Increment version
      }
    });

    // Log the action
    const authReq = req as AuthenticatedRequest;
    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'PRODUCT',
        entityId: id,
        action: 'UPDATE',
        oldData: existingProduct as any,
        newData: updatedProduct as any
      }
    });

    // Send push notification if updated stock is low
    if (updatedProduct.stockQuantity <= (updatedProduct.minimumStock || 0)) {
      sendPushNotification(
        'Kritik Stok Uyarısı ⚠️',
        `${updatedProduct.productCode} (${updatedProduct.name}) stok seviyesi minimum sınırın altında: ${updatedProduct.stockQuantity} adet!`,
        `/product/${updatedProduct.id}`
      ).catch(err => console.error('Push notification failed to send:', err));
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Ürün güncellenirken hata oluştu' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz ürün ID' });
    }

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null }
    });

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    // Soft delete
    const deletedProduct = await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Log the action
    const authReq = req as AuthenticatedRequest;
    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'PRODUCT',
        entityId: id,
        action: 'DELETE',
        oldData: product as any
      }
    });

    res.json({ success: true, message: 'Ürün başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Ürün silinirken hata oluştu' });
  }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const lowStockProducts = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.category_id as "categoryId",
        p.product_code as "productCode",
        p.material_code as "materialCode",
        p.name,
        p.description,
        p.stock_quantity as "stockQuantity",
        p.minimum_stock as "minimumStock",
        p.location,
        p.attributes,
        p.version,
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        json_build_object('name', c.name, 'color', c.color) as category
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.deleted_at IS NULL AND p.stock_quantity <= p.minimum_stock
      ORDER BY p.stock_quantity ASC
    `;

    res.json(lowStockProducts);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Düşük stoklu ürünler yüklenirken hata oluştu' });
  }
};
