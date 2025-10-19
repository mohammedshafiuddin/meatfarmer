import { Request, Response } from "express";
import { db } from "../db/db_index";
import { cartItems, productInfo, units } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
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

    // Try to insert (will fail if already exists due to unique constraint)
    try {
      await db.insert(cartItems).values({
        userId,
        productId,
        quantity: quantity.toString(),
      });
    } catch (error: any) {
      // If unique constraint violation, update quantity instead
      if (error.code === '23505') { // PostgreSQL unique violation
        await db.update(cartItems)
          .set({
            quantity: sql`${cartItems.quantity} + ${quantity}`,
          })
          .where(and(
            eq(cartItems.userId, userId),
            eq(cartItems.productId, productId)
          ));
      } else {
        throw error;
      }
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