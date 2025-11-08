import { router, publicProcedure } from '../trpc-index';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { deliverySlotInfo, productSlots } from '../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';

export const slotsRouter = router({
  // Exact replica of GET /av/slots
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Access denied' });
      }

      const slots = await db.query.deliverySlotInfo.findMany({
        where: eq(deliverySlotInfo.isActive, true),
      });


      return {
        slots,
        count: slots.length,
      };
    }),

  // Exact replica of POST /av/products/slots/product-ids
  getSlotsProductIds: publicProcedure
    .input(z.object({ slotIds: z.array(z.number()) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Access denied' });
      }

      const { slotIds } = input;

      if (!Array.isArray(slotIds)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'slotIds must be an array' });
      }

      if (slotIds.length === 0) {
        return {};
      }

      // Fetch all associations for the requested slots
      const associations = await db.query.productSlots.findMany({
        where: inArray(productSlots.slotId, slotIds),
        columns: {
          slotId: true,
          productId: true,
        },
      });

      console.log({associations})
      

      // Group by slotId
      const result = associations.reduce((acc, assoc) => {
        if (!acc[assoc.slotId]) {
          acc[assoc.slotId] = [];
        }
        acc[assoc.slotId].push(assoc.productId);
        return acc;
      }, {} as Record<number, number[]>);

      // Ensure all requested slots have entries (even if empty)
      slotIds.forEach(slotId => {
        if (!result[slotId]) {
          result[slotId] = [];
        }
      });

      return result;
    }),

  // Exact replica of PUT /av/products/slots/:slotId/products
  updateSlotProducts: publicProcedure
    .input(z.object({
      slotId: z.number(),
      productIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Access denied' });
      }

      const { slotId, productIds } = input;

      if (!Array.isArray(productIds)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'productIds must be an array' });
      }

      // Get current associations
      const currentAssociations = await db.query.productSlots.findMany({
        where: eq(productSlots.slotId, slotId),
        columns: {
          productId: true,
        },
      });

      const currentProductIds = currentAssociations.map(assoc => assoc.productId);
      const newProductIds = productIds;

      // Find products to add and remove
      const productsToAdd = newProductIds.filter(id => !currentProductIds.includes(id));
      const productsToRemove = currentProductIds.filter(id => !newProductIds.includes(id));

      // Remove associations for products that are no longer selected
      if (productsToRemove.length > 0) {
        await db.delete(productSlots).where(
          and(
            eq(productSlots.slotId, slotId),
            inArray(productSlots.productId, productsToRemove)
          )
        );
      }

      // Add associations for newly selected products
      if (productsToAdd.length > 0) {
        const newAssociations = productsToAdd.map(productId => ({
          productId,
          slotId,
        }));

        await db.insert(productSlots).values(newAssociations);
      }

      return {
        message: "Slot products updated successfully",
        added: productsToAdd.length,
        removed: productsToRemove.length,
      };
    }),
});