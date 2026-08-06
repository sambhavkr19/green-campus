import { Router } from 'express';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import initiativeRoutes from './initiativeRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/initiatives', initiativeRoutes);

export default apiRouter;
