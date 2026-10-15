import { Router } from 'express';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../controllers/categories';
import { authenticateJWT, requireAdmin } from '../middlewares/auth';

const router = Router();

// Everyone logged in can view categories
router.get('/', authenticateJWT, getCategories);
router.get('/:id', authenticateJWT, getCategoryById);

// Admin only operations
router.post('/', authenticateJWT, requireAdmin, createCategory);
router.put('/:id', authenticateJWT, requireAdmin, updateCategory);
router.delete('/:id', authenticateJWT, requireAdmin, deleteCategory);

export default router;
