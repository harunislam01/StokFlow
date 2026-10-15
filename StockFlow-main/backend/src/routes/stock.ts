import { Router } from 'express';
import { increaseStock, decreaseStock, getProductMovements } from '../controllers/stock';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// All logged in users can perform stock movements (increase/decrease) and view them
router.post('/:id/increase', authenticateJWT, increaseStock);
router.post('/:id/decrease', authenticateJWT, decreaseStock);
router.get('/:id/movements', authenticateJWT, getProductMovements);

export default router;
