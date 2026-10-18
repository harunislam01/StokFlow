import { Router } from 'express';
import { getDashboardStats, getDashboardCharts } from '../controllers/dashboard';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/stats', authenticateJWT, getDashboardStats);
router.get('/charts', authenticateJWT, getDashboardCharts);

export default router;
