import { Router } from 'express';
import { register, updateProfile } from './auth.controller';
import { verifyToken } from '../middleware/auth';
import uploadHandler from '../lib/upload-handler';

const router = Router();

router.post('/register', uploadHandler.single('profileImage'), register);
router.put('/profile', verifyToken, uploadHandler.single('profileImage'), updateProfile);

const authRouter = router;
export default authRouter;