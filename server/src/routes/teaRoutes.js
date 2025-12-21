import express from 'express';
import {
  getAllTeaItems,
  getTeaItem,
  createTeaItem,
  updateTeaItem,
  deleteTeaItem,
  toggleTeaItemAvailability,
  getTeaItemsByCategory
} from '../controllers/teaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllTeaItems);
router.get('/category/:category', getTeaItemsByCategory);
router.get('/:id', getTeaItem);

// Protected routes (admin only)
router.post('/', protect, createTeaItem);
router.put('/:id', protect, updateTeaItem);
router.delete('/:id', protect, deleteTeaItem);
router.patch('/:id/availability', protect, toggleTeaItemAvailability);

export default router;
