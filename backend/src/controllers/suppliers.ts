import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tüm tedarikçileri getir
export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: { name: 'asc' }
        });
        res.json(suppliers);
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Tedarikçiler getirilemedi' });
    }
};

// Yeni tedarikçi ekle
export const createSupplier = async (req: Request, res: Response) => {
    try {
        const { name, contactName, phone, email, address } = req.body;
        if (!name) return res.status(400).json({ error: 'Firma adı zorunludur' });

        const supplier = await prisma.supplier.create({
            data: { name, contactName, phone, email, address }
        });
        res.status(201).json(supplier);
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Tedarikçi eklenemedi' });
    }
};

// Tedarikçi güncelle
export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, contactName, phone, email, address } = req.body;

        const supplier = await prisma.supplier.update({
            where: { id: Number(id) },
            data: { name, contactName, phone, email, address }
        });
        res.json(supplier);
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Tedarikçi güncellenemedi' });
    }
};

// Tedarikçi sil
export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.supplier.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Tedarikçi silinemedi. (Bağlı ürünler olabilir)' });
    }
};