import { router } from '../trpc-index';
import { complaintRouter } from './complaint';
import { couponRouter } from './coupon';
import { cancelledOrdersRouter } from './cancelled-orders';
import { orderRouter } from './order';
import { vendorSnippetsRouter } from './vendor-snippets';
import { slotsRouter } from './slots';
import { productRouter } from './product';
import { staffUserRouter } from './staff-user';
import { storeRouter } from './store';
import { adminPaymentsRouter } from './payments';
import addressRouter from './address';

export const adminRouter = router({
  complaint: complaintRouter,
  coupon: couponRouter,
  cancelledOrders: cancelledOrdersRouter,
  order: orderRouter,
  vendorSnippets: vendorSnippetsRouter,
  slots: slotsRouter,
  product: productRouter,
  staffUser: staffUserRouter,
  store: storeRouter,
  payments: adminPaymentsRouter,
  address: addressRouter,
});

export type AdminRouter = typeof adminRouter;