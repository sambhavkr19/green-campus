import { Router } from 'express';
import {
  getInitiatives,
  createInitiative,
  joinInitiative,
  getLeaderboard,
} from '../controllers/initiativeController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', getInitiatives);
router.get('/leaderboard', getLeaderboard);
router.post('/', protect, createInitiative);
router.post('/:id/join', protect, joinInitiative);

export default router;
