import { Router } from 'express';
import { login, register, getProfile } from './auth.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', verifyToken, getProfile);

const authRouter = router;
export default authRouter;