import { router, publicProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { productInfo, units, productSlots, deliverySlotInfo, specialDeals, storeInfo } from '../../db/schema';
import { generateSignedUrlsFromS3Urls } from '../../lib/s3-client';
import { eq, and, gt, sql } from 'drizzle-orm';

export const productRouter = router({
  getProductDetails: publicProcedure
    .input(z.object({
      id: z.string().regex(/^\d+$/, 'Invalid product ID'),
    }))
    .query(async ({ input }) => {
      const { id } = input;
      const productId = parseInt(id);

      if (isNaN(productId)) {
        throw new Error('Invalid product ID');
      }

      // Fetch product with unit information
      const productData = await db
        .select({
          id: productInfo.id,
          name: productInfo.name,
          shortDescription: productInfo.shortDescription,
          longDescription: productInfo.longDescription,
          price: productInfo.price,
          marketPrice: productInfo.marketPrice,
          images: productInfo.images,
          isOutOfStock: productInfo.isOutOfStock,
          storeId: productInfo.storeId,
          unitShortNotation: units.shortNotation,
        })
        .from(productInfo)
        .innerJoin(units, eq(productInfo.unitId, units.id))
        .where(eq(productInfo.id, productId))
        .limit(1);

      if (productData.length === 0) {
        throw new Error('Product not found');
      }

      const product = productData[0];

      // Fetch store info for this product
      const storeData = product.storeId ? await db.query.storeInfo.findFirst({
        where: eq(storeInfo.id, product.storeId),
        columns: { id: true, name: true, description: true },
      }) : null;

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
        marketPrice: product.marketPrice,
        unit: product.unitShortNotation,
        images: signedImages,
        isOutOfStock: product.isOutOfStock,
        store: storeData ? {
          id: storeData.id,
          name: storeData.name,
          description: storeData.description,
        } : null,
        deliverySlots: deliverySlotsData,
        specialPackageDeals: specialDealsData,
      };

      return response;
    }),
});