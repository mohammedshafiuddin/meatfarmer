import { router } from '../trpc-index';
import { complaintRouter } from './complaint';
import { userCouponRouter } from './coupon';

export const userRouter = router({
  complaint: complaintRouter,
  coupon: userCouponRouter,
});

export type UserRouter = typeof userRouter;