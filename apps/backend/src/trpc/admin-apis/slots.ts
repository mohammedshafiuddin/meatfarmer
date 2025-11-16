import { router, protectedProcedure } from "../trpc-index";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../../db/db_index";
import { deliverySlotInfo, productSlots } from "../../db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { ApiError } from "../../lib/api-error";

const createSlotSchema = z.object({
  deliveryTime: z.string(),
  freezeTime: z.string(),
  isActive: z.boolean().optional(),
});

const getSlotByIdSchema = z.object({
  id: z.string(),
});

const updateSlotSchema = z.object({
  id: z.number(),
  deliveryTime: z.string(),
  freezeTime: z.string(),
  isActive: z.boolean().optional(),
});

const deleteSlotSchema = z.object({
  id: z.number(),
});

const getDeliverySequenceSchema = z.object({
  id: z.string(),
});

const updateDeliverySequenceSchema = z.object({
  id: z.number(),
  deliverySequence: z.array(z.number()),
});

export const slotsRouter = router({
  // Exact replica of GET /av/slots
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.staffUser?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied" });
    }

    // const slots = await db.query.deliverySlotInfo.findMany({
    //   where: eq(deliverySlotInfo.isActive, true),
    // });
    const slots = await db.query.deliverySlotInfo
      .findMany({
        where: eq(deliverySlotInfo.isActive, true),
      })
      .then((slots) =>
        slots.map((slot) => ({
          ...slot,
          deliverySequence: slot.deliverySequence as number[],
        }))
      );

    return {
      slots,
      count: slots.length,
    };
  }),

  // Exact replica of POST /av/products/slots/product-ids
  getSlotsProductIds: protectedProcedure
    .input(z.object({ slotIds: z.array(z.number()) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied" });
      }

      const { slotIds } = input;

      if (!Array.isArray(slotIds)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "slotIds must be an array",
        });
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

      console.log({ associations });

      // Group by slotId
      const result = associations.reduce((acc, assoc) => {
        if (!acc[assoc.slotId]) {
          acc[assoc.slotId] = [];
        }
        acc[assoc.slotId].push(assoc.productId);
        return acc;
      }, {} as Record<number, number[]>);

      // Ensure all requested slots have entries (even if empty)
      slotIds.forEach((slotId) => {
        if (!result[slotId]) {
          result[slotId] = [];
        }
      });

      return result;
    }),

  // Exact replica of PUT /av/products/slots/:slotId/products
  updateSlotProducts: protectedProcedure
    .input(
      z.object({
        slotId: z.number(),
        productIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied" });
      }

      const { slotId, productIds } = input;

      if (!Array.isArray(productIds)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "productIds must be an array",
        });
      }

      // Get current associations
      const currentAssociations = await db.query.productSlots.findMany({
        where: eq(productSlots.slotId, slotId),
        columns: {
          productId: true,
        },
      });

      const currentProductIds = currentAssociations.map(
        (assoc) => assoc.productId
      );
      const newProductIds = productIds;

      // Find products to add and remove
      const productsToAdd = newProductIds.filter(
        (id) => !currentProductIds.includes(id)
      );
      const productsToRemove = currentProductIds.filter(
        (id) => !newProductIds.includes(id)
      );

      // Remove associations for products that are no longer selected
      if (productsToRemove.length > 0) {
        await db
          .delete(productSlots)
          .where(
            and(
              eq(productSlots.slotId, slotId),
              inArray(productSlots.productId, productsToRemove)
            )
          );
      }

      // Add associations for newly selected products
      if (productsToAdd.length > 0) {
        const newAssociations = productsToAdd.map((productId) => ({
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

  createSlot: protectedProcedure
    .input(createSlotSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied" });
      }

      const { deliveryTime, freezeTime, isActive } = input;

      // Validate required fields
      if (!deliveryTime || !freezeTime) {
        throw new ApiError("Delivery time and freeze time are required", 400);
      }

      // Create slot
      const [newSlot] = await db
        .insert(deliverySlotInfo)
        .values({
          deliveryTime: new Date(deliveryTime),
          freezeTime: new Date(freezeTime),
          isActive: isActive !== undefined ? isActive : true,
        })
        .returning();

      return {
        slot: newSlot,
        message: "Slot created successfully",
      };
    }),

  getSlots: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.staffUser?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied" });
    }

    const slots = await db.query.deliverySlotInfo.findMany({
      where: eq(deliverySlotInfo.isActive, true),
    });

    return {
      slots,
      count: slots.length,
    };
  }),

  getSlotById: protectedProcedure
    .input(getSlotByIdSchema)
    .query(async ({ input, ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied" });
      }

      const { id } = input;

      const slot = await db.query.deliverySlotInfo.findFirst({
        where: eq(deliverySlotInfo.id, parseInt(id)),
      });

      if (!slot) {
        throw new ApiError("Slot not found", 404);
      }

      return {
        slot,
      };
    }),

  updateSlot: protectedProcedure
    .input(updateSlotSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied" });
      }

      const { id, deliveryTime, freezeTime, isActive } = input;

      if (!deliveryTime || !freezeTime) {
        throw new ApiError("Delivery time and freeze time are required", 400);
      }

      const [updatedSlot] = await db
        .update(deliverySlotInfo)
        .set({
          deliveryTime: new Date(deliveryTime),
          freezeTime: new Date(freezeTime),
          isActive: isActive !== undefined ? isActive : true,
        })
        .where(eq(deliverySlotInfo.id, id))
        .returning();

      if (!updatedSlot) {
        throw new ApiError("Slot not found", 404);
      }

      return {
        slot: updatedSlot,
        message: "Slot updated successfully",
      };
    }),

  deleteSlot: protectedProcedure
    .input(deleteSlotSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied" });
      }

      const { id } = input;

      const [deletedSlot] = await db
        .update(deliverySlotInfo)
        .set({ isActive: false })
        .where(eq(deliverySlotInfo.id, id))
        .returning();

      if (!deletedSlot) {
        throw new ApiError("Slot not found", 404);
      }

      return {
        message: "Slot deleted successfully",
      };
    }),

  getDeliverySequence: protectedProcedure
    .input(getDeliverySequenceSchema)
    .query(async ({ input, ctx }) => {
      // if (!ctx.staffUser?.id) {
      //   throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Access denied' });
      // }

      const { id } = input;

      const slot = await db.query.deliverySlotInfo.findFirst({
        where: eq(deliverySlotInfo.id, parseInt(id)),
      });

      if (!slot) {
        throw new ApiError("Slot not found", 404);
      }

      return {
        deliverySequence: (slot.deliverySequence || []) as number[],
      };
    }),

  updateDeliverySequence: protectedProcedure
    .input(updateDeliverySequenceSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.staffUser?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Access denied" });
      }

      const { id, deliverySequence } = input;

      // Validate that deliverySequence is an array of numbers
      if (
        !Array.isArray(deliverySequence) ||
        !deliverySequence.every((id) => typeof id === "number")
      ) {
        throw new ApiError(
          "deliverySequence must be an array of order IDs",
          400
        );
      }

      const [updatedSlot] = await db
        .update(deliverySlotInfo)
        .set({ deliverySequence })
        .where(eq(deliverySlotInfo.id, id))
        .returning({
          id: deliverySlotInfo.id,
          deliverySequence: deliverySlotInfo.deliverySequence,
        });

      if (!updatedSlot) {
        throw new ApiError("Slot not found", 404);
      }

      return {
        slot: updatedSlot,
        message: "Delivery sequence updated successfully",
      };
    }),
});
