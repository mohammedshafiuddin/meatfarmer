import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { addresses, orders, orderStatus, deliverySlotInfo } from '../../db/schema';
import { eq, and, gte } from 'drizzle-orm';
import dayjs from 'dayjs';

export const addressRouter = router({
  getUserAddresses: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.userId;
      const userAddresses = await db.select().from(addresses).where(eq(addresses.userId, userId));
      return { success: true, data: userAddresses };
    }),

  createAddress: protectedProcedure
    .input(z.object({
      name: z.string().min(1, 'Name is required'),
      phone: z.string().min(1, 'Phone is required'),
      addressLine1: z.string().min(1, 'Address line 1 is required'),
      addressLine2: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      pincode: z.string().min(1, 'Pincode is required'),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = input;

      // Validate required fields
      if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
        throw new Error('Missing required fields');
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
      }

      const [newAddress] = await db.insert(addresses).values({
        userId,
        name,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        isDefault: isDefault || false,
      }).returning();

      return { success: true, data: newAddress };
    }),

  updateAddress: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1, 'Name is required'),
      phone: z.string().min(1, 'Phone is required'),
      addressLine1: z.string().min(1, 'Address line 1 is required'),
      addressLine2: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      pincode: z.string().min(1, 'Pincode is required'),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { id, name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = input;

      // Check if address exists and belongs to user
      const existingAddress = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).limit(1);
      if (existingAddress.length === 0) {
        throw new Error('Address not found');
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
      }

      const [updatedAddress] = await db.update(addresses).set({
        name,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        isDefault: isDefault || false,
      }).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).returning();

       return { success: true, data: updatedAddress };
     }),

  deleteAddress: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { id } = input;

      // Check if address exists and belongs to user
      const existingAddress = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).limit(1);
      if (existingAddress.length === 0) {
        throw new Error('Address not found or does not belong to user');
      }

      // Check if address is attached to any ongoing orders using joins
      const ongoingOrders = await db.select({
        order: orders,
        status: orderStatus,
        slot: deliverySlotInfo
      })
        .from(orders)
        .innerJoin(orderStatus, eq(orders.id, orderStatus.orderId))
        .innerJoin(deliverySlotInfo, eq(orders.slotId, deliverySlotInfo.id))
        .where(and(
          eq(orders.addressId, id),
          eq(orderStatus.isCancelled, false),
          gte(deliverySlotInfo.deliveryTime, new Date())
        ))
        .limit(1);

      if (ongoingOrders.length > 0) {
        throw new Error('Address is attached to an ongoing order. Please cancel the order first.');
      }

      // Prevent deletion of default address
      if (existingAddress[0].isDefault) {
        throw new Error('Cannot delete default address. Please set another address as default first.');
      }

      // Delete the address
      await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));

      return { success: true, message: 'Address deleted successfully' };
    }),
});