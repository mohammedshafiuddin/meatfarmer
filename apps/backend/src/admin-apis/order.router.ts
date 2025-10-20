import { Router } from 'express';
import { getTodaysOrders, getSlotOrders, updatePackaged, updateDelivered } from './order.controller';

const router = Router();

router.get('/today', getTodaysOrders);
router.get('/slot/:slotId', getSlotOrders);
router.put('/:orderId/packaged', updatePackaged);
router.put('/:orderId/delivered', updateDelivered);

export default router;