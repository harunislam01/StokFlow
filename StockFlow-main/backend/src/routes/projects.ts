import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProductToProject,
  removeProductFromProject,
  updateProjectProduct
} from '../controllers/projects';

const router = Router();

router.get('/', authenticateJWT, getProjects);
router.get('/:id', authenticateJWT, getProjectById);
router.post('/', authenticateJWT, createProject);
router.put('/:id', authenticateJWT, updateProject);
router.delete('/:id', authenticateJWT, deleteProject);

// Project products
router.post('/:id/products', authenticateJWT, addProductToProject);
router.delete('/:id/products/:productId', authenticateJWT, removeProductFromProject);
router.put('/:id/products/:productId', authenticateJWT, updateProjectProduct);

export default router;
