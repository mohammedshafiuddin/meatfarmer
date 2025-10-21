import { Request, Response } from "express";
import { db } from "../db/db_index";
import { cartItems, productInfo, units, productSlots, deliverySlotInfo } from "../db/schema";
import { eq, and, sql, inArray, gt } from "drizzle-orm";
import { ApiError } from "../lib/api-error";
import { generateSignedUrlsFromS3Urls } from "../lib/s3-client";

/**
 * Get user's cart with product details
 */
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;

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

    return res.status(200).json({
      items: cartWithSignedUrls,
      totalItems: cartWithSignedUrls.length,
      totalAmount,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({ error: "Failed to fetch cart" });
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

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
    return await getCart(req, res);
  } catch (error) {
    console.error("Add to cart error:", error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to add item to cart" });
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      throw new ApiError("Positive quantity required", 400);
    }

    const [updatedItem] = await db.update(cartItems)
      .set({ quantity: quantity.toString() })
      .where(and(
        eq(cartItems.id, parseInt(itemId)),
        eq(cartItems.userId, userId)
      ))
      .returning();

    if (!updatedItem) {
      throw new ApiError("Cart item not found", 404);
    }

    // Return updated cart
    return await getCart(req, res);
  } catch (error) {
    console.error("Update cart item error:", error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to update cart item" });
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;

    const [deletedItem] = await db.delete(cartItems)
      .where(and(
        eq(cartItems.id, parseInt(itemId)),
        eq(cartItems.userId, userId)
      ))
      .returning();

    if (!deletedItem) {
      throw new ApiError("Cart item not found", 404);
    }

    // Return updated cart
    return await getCart(req, res);
  } catch (error) {
    console.error("Remove from cart error:", error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to remove item from cart" });
  }
};

/**
 * Clear entire cart
 */
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;

    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    return res.status(200).json({
      items: [],
      totalItems: 0,
      totalAmount: 0,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({ error: "Failed to clear cart" });
  }
};

/**
 * Get delivery slots for products in user's cart
 */
export const getCartSlots = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;

    // Get product IDs from user's cart
    const cartProductIds = await db
      .select({ productId: cartItems.productId })
      .from(cartItems)
      .where(eq(cartItems.userId, userId));

    if (cartProductIds.length === 0) {
      return res.status(200).json({});
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
        gt(deliverySlotInfo.freezeTime, new Date()),
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

    res.status(200).json(result);
  } catch (error) {
    console.error("Get cart slots error:", error);
    res.status(500).json({ error: "Failed to fetch cart slots" });
  }
};