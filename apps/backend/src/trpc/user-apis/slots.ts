import { router, publicProcedure } from '../trpc-index';
import { db } from '../../db/db_index';
import { deliverySlotInfo } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const slotsRouter = router({
  getSlots: publicProcedure
    .query(async () => {
      const slots = await db.query.deliverySlotInfo.findMany({
        where: eq(deliverySlotInfo.isActive, true),
      });
      return {
        slots,
        count: slots.length,
      };
    }),
});