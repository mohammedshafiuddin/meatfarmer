import { router } from '../trpc-index';
import { addressRouter } from './address';
import { authRouter } from './auth';
import { cartRouter } from './cart';
import { complaintRouter } from './complaint';
import { orderRouter } from './order';
import { productRouter } from './product';
import { slotsRouter } from './slots';
import { userRouter as userDataRouter } from './user';
import { userCouponRouter } from './coupon';

export const userRouter = router({
  address: addressRouter,
  auth: authRouter,
  cart: cartRouter,
  complaint: complaintRouter,
  order: orderRouter,
  product: productRouter,
  slots: slotsRouter,
  user: userDataRouter,
  coupon: userCouponRouter,
});

export type UserRouter = typeof userRouter;