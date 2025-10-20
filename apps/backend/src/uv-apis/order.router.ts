import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { placeOrder } from './order.controller';

const router = Router();

router.use(verifyToken);
router.post('/', placeOrder);

export default router;