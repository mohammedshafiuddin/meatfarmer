import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { cartItems, productInfo, units, productSlots, deliverySlotInfo } from '../../db/schema';
import { eq, and, sql, inArray, gt } from 'drizzle-orm';
import { ApiError } from '../../lib/api-error';
import { generateSignedUrlsFromS3Urls } from '../../lib/s3-client';

interface CartResponse {
  items: any[];
  totalItems: number;
  totalAmount: number;
}

const getCartData = async (userId: number): Promise<CartResponse> => {
  const cartItemsWithProducts = await db
    .select({
      cartId: cartItems.id,
      productId: productInfo.id,
      productName: productInfo.name,
      productPrice: productInfo.price,
      productImages: productInfo.images,
      isOutOfStock: productInfo.isOutOfStock,
      unitShortNotation: units.shortNotation,
      quantity: cartItems.quantity,
      addedAt: cartItems.addedAt,
    })
    .from(cartItems)
    .innerJoin(productInfo, eq(cartItems.productId, productInfo.id))
    .innerJoin(units, eq(productInfo.unitId, units.id))
    .where(eq(cartItems.userId, userId));

  // Generate signed URLs for images
  const cartWithSignedUrls = await Promise.all(
    cartItemsWithProducts.map(async (item) => ({
      id: item.cartId,
      productId: item.productId,
      quantity: parseFloat(item.quantity),
      addedAt: item.addedAt,
      product: {
        id: item.productId,
        name: item.productName,
        price: item.productPrice,
        unit: item.unitShortNotation,
        isOutOfStock: item.isOutOfStock,
        images: await generateSignedUrlsFromS3Urls((item.productImages as string[]) || []),
      },
      subtotal: parseFloat(item.productPrice.toString()) * parseFloat(item.quantity),
    }))
  );

  const totalAmount = cartWithSignedUrls.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    items: cartWithSignedUrls,
    totalItems: cartWithSignedUrls.length,
    totalAmount,
  };
};

export const cartRouter = router({
  getCart: protectedProcedure
    .query(async ({ ctx }): Promise<CartResponse> => {
      const userId = ctx.user.userId;
      return await getCartData(userId);
    }),

  addToCart: protectedProcedure
    .input(z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }): Promise<CartResponse> => {
      const userId = ctx.user.userId;
      const { productId, quantity } = input;

      // Validate input
      if (!productId || !quantity || quantity <= 0) {
        throw new ApiError("Product ID and positive quantity required", 400);
      }

      // Check if product exists
      const product = await db.query.productInfo.findFirst({
        where: eq(productInfo.id, productId),
      });

      if (!product) {
        throw new ApiError("Product not found", 404);
      }

      // Check if item already exists in cart
      const existingItem = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)),
      });

      if (existingItem) {
        // Update quantity
        await db.update(cartItems)
          .set({
            quantity: sql`${cartItems.quantity} + ${quantity}`,
          })
          .where(eq(cartItems.id, existingItem.id));
      } else {
        // Insert new item
        await db.insert(cartItems).values({
          userId,
          productId,
          quantity: quantity.toString(),
        });
      }

      // Return updated cart
      return await getCartData(userId);
    }),

  updateCartItem: protectedProcedure
    .input(z.object({
      itemId: z.number().int().positive(),
      quantity: z.number().int().min(0),
    }))
    .mutation(async ({ input, ctx }): Promise<CartResponse> => {
      const userId = ctx.user.userId;
      const { itemId, quantity } = input;

      if (!quantity || quantity <= 0) {
        throw new ApiError("Positive quantity required", 400);
      }

      const [updatedItem] = await db.update(cartItems)
        .set({ quantity: quantity.toString() })
        .where(and(
          eq(cartItems.id, itemId),
          eq(cartItems.userId, userId)
        ))
        .returning();

      if (!updatedItem) {
        throw new ApiError("Cart item not found", 404);
      }

      // Return updated cart
      return await getCartData(userId);
    }),

  removeFromCart: protectedProcedure
    .input(z.object({
      itemId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }): Promise<CartResponse> => {
      const userId = ctx.user.userId;
      const { itemId } = input;

      const [deletedItem] = await db.delete(cartItems)
        .where(and(
          eq(cartItems.id, itemId),
          eq(cartItems.userId, userId)
        ))
        .returning();

      if (!deletedItem) {
        throw new ApiError("Cart item not found", 404);
      }

      // Return updated cart
      return await getCartData(userId);
    }),

  clearCart: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user.userId;

      await db.delete(cartItems).where(eq(cartItems.userId, userId));

      return {
        items: [],
        totalItems: 0,
        totalAmount: 0,
        message: "Cart cleared successfully",
      };
    }),

  getCartSlots: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.userId;

      // Get product IDs from user's cart
      const cartProductIds = await db
        .select({ productId: cartItems.productId })
        .from(cartItems)
        .where(eq(cartItems.userId, userId));

      if (cartProductIds.length === 0) {
        return {};
      }

      const productIds = cartProductIds.map(item => item.productId);

      // Get slots for these products where freeze time is after current time
      const slotsData = await db
        .select({
          productId: productSlots.productId,
          slotId: deliverySlotInfo.id,
          deliveryTime: deliverySlotInfo.deliveryTime,
          freezeTime: deliverySlotInfo.freezeTime,
          isActive: deliverySlotInfo.isActive,
        })
        .from(productSlots)
        .innerJoin(deliverySlotInfo, eq(productSlots.slotId, deliverySlotInfo.id))
        .where(and(
          inArray(productSlots.productId, productIds),
          gt(deliverySlotInfo.freezeTime, sql`NOW()`),
          eq(deliverySlotInfo.isActive, true)
        ));

      // Group by productId
      const result: Record<number, any[]> = {};
      slotsData.forEach(slot => {
        if (!result[slot.productId]) {
          result[slot.productId] = [];
        }
        result[slot.productId].push({
          id: slot.slotId,
          deliveryTime: slot.deliveryTime,
          freezeTime: slot.freezeTime,
        });
      });

      return result;
    }),
});