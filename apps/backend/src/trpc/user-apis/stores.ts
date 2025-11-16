import { router, publicProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { storeInfo, productInfo, units } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { generateSignedUrlsFromS3Urls } from '../../lib/s3-client';
import { ApiError } from '../../lib/api-error';

export const storesRouter = router({
  getStoreWithProducts: publicProcedure
    .input(z.object({
      storeId: z.number(),
    }))
    .query(async ({ input }) => {
      const { storeId } = input;

      // Fetch store info
      const storeData = await db.query.storeInfo.findFirst({
        where: eq(storeInfo.id, storeId),
        columns: {
          id: true,
          name: true,
          description: true,
        },
      });

      if (!storeData) {
        throw new ApiError('Store not found', 404);
      }

      // Fetch products for this store
      const productsData = await db
        .select({
          id: productInfo.id,
          name: productInfo.name,
          shortDescription: productInfo.shortDescription,
          price: productInfo.price,
          marketPrice: productInfo.marketPrice,
          images: productInfo.images,
          isOutOfStock: productInfo.isOutOfStock,
          unitShortNotation: units.shortNotation,
        })
        .from(productInfo)
        .innerJoin(units, eq(productInfo.unitId, units.id))
        .where(eq(productInfo.storeId, storeId));

      // Generate signed URLs for product images
      const productsWithSignedUrls = await Promise.all(
        productsData.map(async (product) => ({
          id: product.id,
          name: product.name,
          shortDescription: product.shortDescription,
          price: product.price,
          marketPrice: product.marketPrice,
          unit: product.unitShortNotation,
          images: await generateSignedUrlsFromS3Urls((product.images as string[]) || []),
          isOutOfStock: product.isOutOfStock,
        }))
      );

      return {
        store: {
          id: storeData.id,
          name: storeData.name,
          description: storeData.description,
        },
        products: productsWithSignedUrls,
      };
    }),
});