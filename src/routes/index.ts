import { Router } from 'express';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import initiativeRoutes from './initiativeRoutes.js';
import recyclingRoutes from './recyclingRoutes.js';
import auditRoutes from './auditRoutes.js';
import complaintRoutes from './complaintRoutes.js';
import mlRoutes from './mlRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/initiatives', initiativeRoutes);
apiRouter.use('/recycling', recyclingRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/complaints', complaintRoutes);
apiRouter.use('/ml', mlRoutes);

export default apiRouter;

