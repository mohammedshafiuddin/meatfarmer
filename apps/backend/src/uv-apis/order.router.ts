import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { placeOrder, getOrders, cancelOrder } from './order.controller';

const router = Router();

router.use(verifyToken);
router.post('/', placeOrder);
router.get('/', getOrders);
router.post('/:id/cancel', cancelOrder);

export default router;