import { router, publicProcedure } from '../trpc-index';
import { db } from '../../db/db_index';
import { deliverySlotInfo, productSlots, productInfo, units } from '../../db/schema';
import { eq, and, gt, asc } from 'drizzle-orm';
import { generateSignedUrlsFromS3Urls } from '../../lib/s3-client';

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

  getSlotsWithProducts: publicProcedure
    .query(async () => {
      const now = new Date();

      // Fetch active delivery slots with future delivery times
      const slots = await db.query.deliverySlotInfo.findMany({
        where: and(
          eq(deliverySlotInfo.isActive, true),
          gt(deliverySlotInfo.deliveryTime, now) // Only future slots
        ),
        with: {
          productSlots: {
            with: {
              product: {
                with: {
                  unit: true,
                },
              },
            },
          },
        },
        orderBy: asc(deliverySlotInfo.deliveryTime),
      });

      // Transform data for frontend
      const slotsWithProducts = await Promise.all(
        slots.map(async (slot) => ({
          id: slot.id,
          deliveryTime: slot.deliveryTime,
          freezeTime: slot.freezeTime,
          isActive: slot.isActive,
          products: await Promise.all(
            slot.productSlots.map(async (productSlot) => ({
              id: productSlot.product.id,
              name: productSlot.product.name,
              shortDescription: productSlot.product.shortDescription,
              price: productSlot.product.price,
              marketPrice: productSlot.product.marketPrice,
              unit: productSlot.product.unit?.shortNotation,
              images: await generateSignedUrlsFromS3Urls(
                (productSlot.product.images as string[]) || []
              ),
              isOutOfStock: productSlot.product.isOutOfStock,
            }))
          ),
        }))
      );

      return {
        slots: slotsWithProducts,
        count: slotsWithProducts.length,
      };
    }),
});