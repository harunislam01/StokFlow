import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            products: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } }
          }
        }
      }
    });

    // Map categories to include productCount
    const mappedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      icon: cat.icon,
      color: cat.color,
      formSchema: cat.formSchema,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      productCount: cat._count.products,
      subcategoriesCount: cat._count.children
    }));

    res.json(mappedCategories);
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Kategoriler yüklenirken hata oluştu' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz kategori ID' });
    }

    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        products: { where: { deletedAt: null } },
        children: { where: { deletedAt: null } }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    res.json({
      ...category,
      productCount: category.products.length,
      subcategoriesCount: category.children.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Kategori yüklenirken hata oluştu' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parentId, icon, color, formSchema } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Kategori adı zorunludur' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        parentId: parentId ? parseInt(parentId) : null,
        icon: icon || null,
        color: color || null,
        formSchema: formSchema || []
      }
    });

    // Log the action
    const authReq = req as AuthenticatedRequest;
    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'CATEGORY',
        entityId: category.id,
        action: 'CREATE',
        newData: category as any
      }
    });

    res.status(201).json(category);
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Kategori eklenirken hata oluştu' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, parentId, icon, color, formSchema } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz kategori ID' });
    }

    const existingCategory = await prisma.category.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingCategory.name,
        parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : existingCategory.parentId,
        icon: icon !== undefined ? icon : existingCategory.icon,
        color: color !== undefined ? color : existingCategory.color,
        formSchema: formSchema !== undefined ? formSchema : existingCategory.formSchema
      }
    });

    // Log the action
    const authReq = req as AuthenticatedRequest;
    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'CATEGORY',
        entityId: id,
        action: 'UPDATE',
        oldData: existingCategory as any,
        newData: updatedCategory as any
      }
    });

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: 'Kategori güncellenirken hata oluştu' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz kategori ID' });
    }

    // Check if category exists
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        children: { where: { deletedAt: null } },
        products: { where: { deletedAt: null } }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    // SILME KURALI: Alt kategori içeriyorsa veya içinde ürün bulunuyorsa SİLİNEMEZ!
    if (category.children.length > 0) {
      return res.status(400).json({ error: 'Bu kategori alt kategoriler içerdiği için silinemez' });
    }

    if (category.products.length > 0) {
      return res.status(400).json({ error: 'Bu kategoriye ait ürünler olduğu için silinemez' });
    }

    // Soft delete
    const deletedCategory = await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Log the action
    const authReq = req as AuthenticatedRequest;
    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'CATEGORY',
        entityId: id,
        action: 'DELETE',
        oldData: category as any
      }
    });

    res.json({ success: true, message: 'Kategori başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Kategori silinirken hata oluştu' });
  }
};
