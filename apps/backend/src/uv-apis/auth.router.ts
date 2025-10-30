import { Router } from 'express';
import { login, register, getProfile, updateProfile } from './auth.controller';
import { verifyToken } from '../middleware/auth';
import uploadHandler from '../lib/upload-handler';

const router = Router();

router.post('/login', login);
router.post('/register', uploadHandler.single('profileImage'), register);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, uploadHandler.single('profileImage'), updateProfile);

const authRouter = router;
export default authRouter;