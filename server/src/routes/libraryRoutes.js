import express from 'express';
import {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createTeaItemFromTemplate,
  getMostUsedTemplates
} from '../controllers/libraryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes - client can read ingredient templates
router.get('/', getAllTemplates);
router.get('/popular', getMostUsedTemplates);
router.get('/:id', getTemplate);

// Protected routes - admin only for write operations
router.post('/', protect, createTemplate);
router.put('/:id', protect, updateTemplate);
router.delete('/:id', protect, deleteTemplate);
router.post('/:id/create', protect, createTeaItemFromTemplate);

export default router;
