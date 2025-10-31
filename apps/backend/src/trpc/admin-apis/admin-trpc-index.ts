import { router } from '../trpc-index';
import { complaintRouter } from './complaint';
import { couponRouter } from './coupon';
import { cancelledOrdersRouter } from './cancelled-orders';
import { orderRouter } from './order';

export const adminRouter = router({
  complaint: complaintRouter,
  coupon: couponRouter,
  cancelledOrders: cancelledOrdersRouter,
  order: orderRouter,
});

export type AdminRouter = typeof adminRouter;