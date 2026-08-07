import { Router } from 'express';
import {
  submitDeposit,
  getDeposits,
  getAnalytics,
} from '../controllers/recyclingController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', getDeposits);
router.get('/analytics', getAnalytics);
router.post('/', protect, submitDeposit);

export default router;
