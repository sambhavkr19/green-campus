import { Router } from 'express';
import {
  analyzeAudit,
  getAudits,
  getDepartmentRankings,
} from '../controllers/auditController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', getAudits);
router.get('/rankings', getDepartmentRankings);
router.post('/analyze', protect, analyzeAudit);

export default router;
