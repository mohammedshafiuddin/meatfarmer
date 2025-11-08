import { router } from '../trpc-index';
import { complaintRouter } from './complaint';
import { couponRouter } from './coupon';
import { cancelledOrdersRouter } from './cancelled-orders';
import { orderRouter } from './order';
import { vendorSnippetsRouter } from './vendor-snippets';
import { slotsRouter } from './slots';

export const adminRouter = router({
  complaint: complaintRouter,
  coupon: couponRouter,
  cancelledOrders: cancelledOrdersRouter,
  order: orderRouter,
  vendorSnippets: vendorSnippetsRouter,
  slots: slotsRouter,
});

export type AdminRouter = typeof adminRouter;