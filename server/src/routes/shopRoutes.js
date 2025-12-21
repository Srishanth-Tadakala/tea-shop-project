import express from 'express';
import {
  getShopStatus,
  getShopLocation,
  updateShopStatus,
  toggleShopStatus
} from '../controllers/shopController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.get('/status', getShopStatus);
router.get('/location', getShopLocation);

// Protected routes (admin only)
router.put('/status', protect, updateShopStatus);
router.post('/status/toggle', protect, toggleShopStatus);

export default router;
