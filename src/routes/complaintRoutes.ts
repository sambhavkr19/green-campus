import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  upvoteComplaint,
  updateComplaintStatus,
} from '../controllers/complaintController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', getComplaints);
router.post('/', protect, createComplaint);
router.post('/:id/upvote', protect, upvoteComplaint);
router.patch('/:id/status', protect, updateComplaintStatus);

export default router;
