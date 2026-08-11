import { Router } from 'express';
import { registerUser, loginUser, getMe, getUsers } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', getUsers);

export default router;
