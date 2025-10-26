import { router } from '../trpc-index';
import { complaintRouter } from './complaint';
import { couponRouter } from './coupon';

export const adminRouter = router({
  complaint: complaintRouter,
  coupon: couponRouter,
});

export type AdminRouter = typeof adminRouter;