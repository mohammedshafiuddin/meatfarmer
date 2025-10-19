import { Request, Response } from "express";
import { db } from "src/db/db_index";
import { productInfo, units, productSlots, deliverySlotInfo, specialDeals } from "src/db/schema";
import { generateSignedUrlsFromS3Urls } from "src/lib/s3-client";
import { eq, and, gt, sql } from "drizzle-orm";

/**
 * Get detailed product information for user view
 */
export const getProductDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Fetch product with unit information
    const productData = await db
      .select({
        id: productInfo.id,
        name: productInfo.name,
        shortDescription: productInfo.shortDescription,
        longDescription: productInfo.longDescription,
        price: productInfo.price,
        images: productInfo.images,
        unitShortNotation: units.shortNotation,
      })
      .from(productInfo)
      .innerJoin(units, eq(productInfo.unitId, units.id))
      .where(eq(productInfo.id, productId))
      .limit(1);

    if (productData.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productData[0];

    // Fetch delivery slots for this product
    const deliverySlotsData = await db
      .select({
        deliveryTime: deliverySlotInfo.deliveryTime,
        freezeTime: deliverySlotInfo.freezeTime,
      })
      .from(productSlots)
      .innerJoin(deliverySlotInfo, eq(productSlots.slotId, deliverySlotInfo.id))
      .where(
        and(
          eq(productSlots.productId, productId),
          eq(deliverySlotInfo.isActive, true),
          gt(deliverySlotInfo.deliveryTime, sql`NOW()`)
        )
      )
      .orderBy(deliverySlotInfo.deliveryTime);

    // Fetch special deals for this product
    const specialDealsData = await db
      .select({
        quantity: specialDeals.quantity,
        price: specialDeals.price,
        validTill: specialDeals.validTill,
      })
      .from(specialDeals)
      .where(
        and(
          eq(specialDeals.productId, productId),
          gt(specialDeals.validTill, sql`NOW()`)
        )
      )
      .orderBy(specialDeals.quantity);

    // Generate signed URLs for images
    const signedImages = await generateSignedUrlsFromS3Urls((product.images as string[]) || []);

    const response = {
      id: product.id,
      name: product.name,
      shortDescription: product.shortDescription,
      longDescription: product.longDescription,
      price: product.price,
      unit: product.unitShortNotation,
      images: signedImages,
      deliverySlots: deliverySlotsData,
      specialPackageDeals: specialDealsData,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get product details error:", error);
    return res.status(500).json({ error: "Failed to fetch product details" });
  }
};