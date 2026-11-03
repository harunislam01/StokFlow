import { Router } from 'express';
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
} from '../controllers/suppliers';
import { authenticateJWT, requireAdmin } from '../middlewares/auth';

const router = Router();

// Everyone logged in can view
router.get('/', authenticateJWT, getSuppliers);

// Admin only CRUD
router.post('/', authenticateJWT, requireAdmin, createSupplier);
router.put('/:id', authenticateJWT, requireAdmin, updateSupplier);
router.delete('/:id', authenticateJWT, requireAdmin, deleteSupplier);

export default router;