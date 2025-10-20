import { Router } from 'express';
import { getTodaysOrders } from './order.controller';

const router = Router();

router.get('/today', getTodaysOrders);

export default router;