import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar yüklenirken hata oluştu' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Kullanıcı adı, şifre ve rol zorunludur' });
    }

    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      if (existing.deletedAt === null) {
        return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış' });
      } else {
        // Recycle the deleted user
        const passwordHash = bcrypt.hashSync(password, 10);
        const recycled = await prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            role: role as any,
            isActive: true,
            deletedAt: null
          }
        });
        return res.status(201).json({
          id: recycled.id,
          username: recycled.username,
          role: recycled.role,
          isActive: recycled.isActive
        });
      }
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role as any,
        isActive: true
      }
    });

    // Log action
    const authReq = req as AuthenticatedRequest;
    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'USER',
        entityId: newUser.id,
        action: 'CREATE',
        newData: { username: newUser.username, role: newUser.role } as any
      }
    });

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      isActive: newUser.isActive
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Kullanıcı eklenirken hata oluştu' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { username, password, role, isActive } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
    }

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const dataToUpdate: any = {};
    if (username !== undefined) dataToUpdate.username = username;
    if (role !== undefined) dataToUpdate.role = role as any;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;
    if (password) {
      dataToUpdate.passwordHash = bcrypt.hashSync(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    // Log action
    const authReq = req as AuthenticatedRequest;
    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'USER',
        entityId: id,
        action: 'UPDATE',
        oldData: { username: user.username, role: user.role, isActive: user.isActive } as any,
        newData: { username: updated.username, role: updated.role, isActive: updated.isActive } as any
      }
    });

    res.json({
      id: updated.id,
      username: updated.username,
      role: updated.role,
      isActive: updated.isActive
    });
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı güncellenirken hata oluştu' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
    }

    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.id === id) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
    }

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Soft delete user and deactivate account
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: authReq.user?.id,
        entityType: 'USER',
        entityId: id,
        action: 'DELETE',
        oldData: { username: user.username, role: user.role } as any
      }
    });

    res.json({ success: true, message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Kullanıcı silinirken hata oluştu' });
  }
};

