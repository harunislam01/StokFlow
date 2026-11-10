import { Router } from 'express';
import {
    getMonthlyReport,
    getReportArchives,
    createReportArchive,
    getReportArchiveById
} from '../controllers/reports';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/monthly', authenticateJWT, getMonthlyReport);
router.get('/archives', authenticateJWT, getReportArchives);
router.post('/archives', authenticateJWT, createReportArchive);
router.get('/archives/:id', authenticateJWT, getReportArchiveById);

export default router;
