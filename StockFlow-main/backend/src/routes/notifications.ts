import { Router } from 'express';
import { getNotifications, markAsRead, subscribePush } from '../controllers/notifications';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, getNotifications);
router.put('/:id', authenticateJWT, markAsRead);
router.post('/subscribe', authenticateJWT, subscribePush);

export default router;
