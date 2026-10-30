import { Router } from 'express';
import { getMonthlyReport } from '../controllers/reports';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/monthly', authenticateJWT, getMonthlyReport);

export default router;