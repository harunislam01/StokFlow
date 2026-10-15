import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/users';
import { authenticateJWT, requireAdmin } from '../middlewares/auth';

const router = Router();

// Protect all user routes for Admin only
router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
