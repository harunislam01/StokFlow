import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getLowStockProducts } from '../controllers/products';
import { authenticateJWT, requireAdmin } from '../middlewares/auth';

const router = Router();

// Low stock endpoint (place before dynamic /:id to prevent routing issues)
router.get('/low-stock', authenticateJWT, getLowStockProducts);

// Everyone logged in can view
router.get('/', authenticateJWT, getProducts);
router.get('/:id', authenticateJWT, getProductById);

// Admin only CRUD
router.post('/', authenticateJWT, requireAdmin, createProduct);
router.put('/:id', authenticateJWT, requireAdmin, updateProduct);
router.delete('/:id', authenticateJWT, requireAdmin, deleteProduct);

export default router;
