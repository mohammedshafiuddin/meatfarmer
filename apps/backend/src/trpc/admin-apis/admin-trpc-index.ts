import { router } from '../trpc-index';
import { complaintRouter } from './complaint';
import { couponRouter } from './coupon';
import { cancelledOrdersRouter } from './cancelled-orders';
import { orderRouter } from './order';
import { vendorSnippetsRouter } from './vendor-snippets';

export const adminRouter = router({
  complaint: complaintRouter,
  coupon: couponRouter,
  cancelledOrders: cancelledOrdersRouter,
  order: orderRouter,
  vendorSnippets: vendorSnippetsRouter,
});

export type AdminRouter = typeof adminRouter;