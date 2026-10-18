import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit';
import { authenticateJWT, requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, requireAdmin, getAuditLogs);

export default router;
