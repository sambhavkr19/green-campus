import { Router } from 'express';
import { getMlAnalytics, predictConsumption } from '../controllers/mlController.js';

const router = Router();

router.get('/analytics', getMlAnalytics);
router.post('/predict', predictConsumption);

export default router;
