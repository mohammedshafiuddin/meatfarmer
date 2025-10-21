import { eq, gt, and, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db/db_index";
import { productInfo, units, productSlots, deliverySlotInfo } from "../db/schema";
import { generateSignedUrlsFromS3Urls } from "../lib/s3-client";

/**
 * Get next delivery date for a product
 */
const getNextDeliveryDate = async (productId: number): Promise<Date | null> => {
  const result = await db
    .select({ deliveryTime: deliverySlotInfo.deliveryTime })
    .from(productSlots)
    .innerJoin(deliverySlotInfo, eq(productSlots.slotId, deliverySlotInfo.id))
    .where(
      and(
        eq(productSlots.productId, productId),
        eq(deliverySlotInfo.isActive, true),
        gt(deliverySlotInfo.deliveryTime, sql`NOW()`)
      )
    )
    .orderBy(deliverySlotInfo.deliveryTime)
    .limit(1);
  
  
  return result[0]?.deliveryTime || null;
};

/**
 * Get all products summary for dropdown
 */
export const getAllProductsSummary = async (req: Request, res: Response) => {

  try {
    const productsWithUnits = await db
      .select({
        id: productInfo.id,
        name: productInfo.name,
        shortDescription: productInfo.shortDescription,
        price: productInfo.price,
        images: productInfo.images,
        isOutOfStock: productInfo.isOutOfStock,
        unitShortNotation: units.shortNotation,
      })
      .from(productInfo)
      .innerJoin(units, eq(productInfo.unitId, units.id));

    // Generate signed URLs for product images
    const formattedProducts = await Promise.all(
      productsWithUnits.map(async (product) => {
        const nextDeliveryDate = await getNextDeliveryDate(product.id);
        return {
          id: product.id,
          name: product.name,
          shortDescription: product.shortDescription,
          price: product.price,
          unit: product.unitShortNotation,
          isOutOfStock: product.isOutOfStock,
          nextDeliveryDate: nextDeliveryDate ? nextDeliveryDate.toISOString() : null,
          images: await generateSignedUrlsFromS3Urls((product.images as string[]) || []),
        };
      })
    );

    return res.status(200).json({
      products: formattedProducts,
      count: formattedProducts.length,
    });
  } catch (error) {
    console.error("Get products summary error:", error);
    return res.status(500).json({ error: "Failed to fetch products summary" });
  }
};
