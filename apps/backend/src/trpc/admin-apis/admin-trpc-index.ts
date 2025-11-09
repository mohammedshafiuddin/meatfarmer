import { router } from '../trpc-index';
import { complaintRouter } from './complaint';
import { couponRouter } from './coupon';
import { cancelledOrdersRouter } from './cancelled-orders';
import { orderRouter } from './order';
import { vendorSnippetsRouter } from './vendor-snippets';
import { slotsRouter } from './slots';
import { productRouter } from './product';
import { staffUserRouter } from './staff-user';

export const adminRouter = router({
  complaint: complaintRouter,
  coupon: couponRouter,
  cancelledOrders: cancelledOrdersRouter,
  order: orderRouter,
  vendorSnippets: vendorSnippetsRouter,
  slots: slotsRouter,
  product: productRouter,
  staffUser: staffUserRouter,
});

export type AdminRouter = typeof adminRouter;