import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { raiseComplaint } from './complaint.controller';

const router = Router();

router.use(verifyToken);
router.post('/', raiseComplaint);

export default router;