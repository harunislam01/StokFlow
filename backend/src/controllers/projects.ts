import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

const productSelectFields = {
  id: true,
  name: true,
  productCode: true,
  stockQuantity: true,
  minimumStock: true,
  location: true,
  category: { select: { name: true, icon: true } }
};

// GET /api/projects
export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        products: {
          include: {
            product: { select: productSelectFields }
          },
          orderBy: { assignedAt: 'asc' }
        },
        createdBy: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Projeler yüklenirken hata oluştu' });
  }
};

// GET /api/projects/:id
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz proje ID' });

    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        products: {
          include: {
            product: { select: productSelectFields },
            assignedBy: { select: { username: true } }
          },
          orderBy: { assignedAt: 'asc' }
        },
        createdBy: { select: { username: true } }
      }
    });

    if (!project) return res.status(404).json({ error: 'Proje bulunamadı' });
    res.json(project);
  } catch (error) {
    console.error('Get project by id error:', error);
    res.status(500).json({ error: 'Proje yüklenirken hata oluştu' });
  }
};

// POST /api/projects
export const createProject = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, status, startDate, endDate, productIds } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Proje adı zorunludur' });
    }

    const productsData = Array.isArray(productIds) ? productIds : [];

    const project = await prisma.$transaction(async (tx) => {
      const newProj = await tx.project.create({
        data: {
          name: name.trim(),
          description: description || null,
          status: status || 'PLANNING',
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          createdById: authReq.user?.id || null,
          products: {
            create: productsData.map((p: { productId: number; quantity?: number; note?: string }) => ({
              productId: Number(p.productId),
              quantity: Number(p.quantity) || 1,
              note: p.note || null,
              assignedById: authReq.user?.id || null
            }))
          }
        },
        include: {
          products: {
            include: { product: { select: productSelectFields } }
          },
          createdBy: { select: { username: true } }
        }
      });

      // Automatic Stock Deduction & Stock Movement Logging for created products
      for (const p of productsData) {
        const pId = Number(p.productId);
        const qty = Number(p.quantity) || 1;
        if (!pId || qty <= 0) continue;

        // Decrement product stock
        await tx.product.update({
          where: { id: pId },
          data: { stockQuantity: { decrement: qty } }
        });

        // Record stock movement (OUT)
        if (authReq.user?.id) {
          await tx.stockMovement.create({
            data: {
              productId: pId,
              userId: authReq.user.id,
              changeAmount: -qty,
              movementType: 'OUT',
              reason: `Proje kullanımı: ${newProj.name}`
            }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: authReq.user?.id,
          entityType: 'PROJECT',
          entityId: newProj.id,
          action: 'CREATE',
          newData: newProj as any
        }
      });

      return newProj;
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Proje oluşturulurken hata oluştu' });
  }
};

// PUT /api/projects/:id
export const updateProject = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz proje ID' });

    const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: 'Proje bulunamadı' });

    const { name, description, status, startDate, endDate } = req.body;

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? description : existing.description,
        status: status !== undefined ? status : existing.status,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate
      },
      include: {
        products: { include: { product: { select: productSelectFields } } },
        createdBy: { select: { username: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'PROJECT',
        entityId: id,
        action: 'UPDATE',
        oldData: existing as any,
        newData: updated as any
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Proje güncellenirken hata oluştu' });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz proje ID' });

    const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: 'Proje bulunamadı' });

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'PROJECT',
        entityId: id,
        action: 'DELETE',
        oldData: existing as any
      }
    });

    res.json({ success: true, message: 'Proje başarıyla silindi' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Proje silinirken hata oluştu' });
  }
};

// POST /api/projects/:id/products
export const addProductToProject = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const projectId = parseInt(req.params.id);
    const { productId, quantity, note } = req.body;
    const pId = parseInt(productId);
    const qty = parseInt(quantity) || 1;

    if (isNaN(projectId) || isNaN(pId)) {
      return res.status(400).json({ error: 'Geçersiz proje veya ürün ID' });
    }

    const pp = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findFirst({ where: { id: projectId, deletedAt: null } });
      if (!project) throw new Error('Proje bulunamadı');

      const product = await tx.product.findFirst({ where: { id: pId, deletedAt: null } });
      if (!product) throw new Error('Ürün bulunamadı');

      const existing = await tx.projectProduct.findUnique({
        where: { projectId_productId: { projectId, productId: pId } }
      });

      let updatedPP;
      if (existing) {
        updatedPP = await tx.projectProduct.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + qty },
          include: { product: { select: productSelectFields } }
        });
      } else {
        updatedPP = await tx.projectProduct.create({
          data: {
            projectId,
            productId: pId,
            quantity: qty,
            note: note || null,
            assignedById: authReq.user?.id || null
          },
          include: { product: { select: productSelectFields } }
        });
      }

      // Decrement product stock quantity
      await tx.product.update({
        where: { id: pId },
        data: { stockQuantity: { decrement: qty } }
      });

      // Record Stock Movement (OUT)
      if (authReq.user?.id) {
        await tx.stockMovement.create({
          data: {
            productId: pId,
            userId: authReq.user.id,
            changeAmount: -qty,
            movementType: 'OUT',
            reason: `Proje kullanımı: ${project.name}`
          }
        });
      }

      return updatedPP;
    });

    res.status(201).json(pp);
  } catch (error: any) {
    console.error('Add product to project error:', error);
    res.status(500).json({ error: error.message || 'Ürün projeye eklenirken hata oluştu' });
  }
};

// DELETE /api/projects/:id/products/:productId
export const removeProductFromProject = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const projectId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);

    if (isNaN(projectId) || isNaN(productId)) {
      return res.status(400).json({ error: 'Geçersiz ID' });
    }

    await prisma.$transaction(async (tx) => {
      const pp = await tx.projectProduct.findUnique({
        where: { projectId_productId: { projectId, productId } },
        include: { project: { select: { name: true } } }
      });

      if (!pp) throw new Error('Proje-ürün ilişkisi bulunamadı');

      // Delete project-product assignment
      await tx.projectProduct.delete({ where: { id: pp.id } });

      // Restore product stock quantity (Increment back)
      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: { increment: pp.quantity } }
      });

      // Record Stock Movement (IN)
      if (authReq.user?.id) {
        await tx.stockMovement.create({
          data: {
            productId,
            userId: authReq.user.id,
            changeAmount: pp.quantity,
            movementType: 'IN',
            reason: `Proje stok iadesi: ${pp.project.name}`
          }
        });
      }
    });

    res.json({ success: true, message: 'Ürün projeden çıkarıldı ve stoğa iade edildi' });
  } catch (error: any) {
    console.error('Remove product from project error:', error);
    res.status(500).json({ error: error.message || 'Ürün projeden çıkarılırken hata oluştu' });
  }
};

// PUT /api/projects/:id/products/:productId
export const updateProjectProduct = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const projectId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);
    const { quantity, note } = req.body;

    if (isNaN(projectId) || isNaN(productId)) {
      return res.status(400).json({ error: 'Geçersiz ID' });
    }

    const updatedPP = await prisma.$transaction(async (tx) => {
      const pp = await tx.projectProduct.findUnique({
        where: { projectId_productId: { projectId, productId } },
        include: { project: { select: { name: true } } }
      });

      if (!pp) throw new Error('Proje-ürün ilişkisi bulunamadı');

      const newQty = quantity !== undefined ? parseInt(quantity) : pp.quantity;
      const diff = newQty - pp.quantity; // positive means increased project usage, negative means reduced project usage

      const updated = await tx.projectProduct.update({
        where: { id: pp.id },
        data: {
          quantity: newQty,
          note: note !== undefined ? note : pp.note
        },
        include: { product: { select: productSelectFields } }
      });

      if (diff !== 0) {
        // Adjust product stock quantity (if diff > 0, decrement stock; if diff < 0, increment stock)
        await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: { decrement: diff } }
        });

        // Record stock movement
        if (authReq.user?.id) {
          await tx.stockMovement.create({
            data: {
              productId,
              userId: authReq.user.id,
              changeAmount: -diff,
              movementType: diff > 0 ? 'OUT' : 'IN',
              reason: `Proje malzeme miktar güncellemesi: ${pp.project.name}`
            }
          });
        }
      }

      return updated;
    });

    res.json(updatedPP);
  } catch (error: any) {
    console.error('Update project product error:', error);
    res.status(500).json({ error: error.message || 'Proje ürünü güncellenirken hata oluştu' });
  }
};
