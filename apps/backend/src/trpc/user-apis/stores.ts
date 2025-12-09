import { router, publicProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { storeInfo, productInfo, units } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateSignedUrlsFromS3Urls, generateSignedUrlFromS3Url } from '../../lib/s3-client';
import { ApiError } from '../../lib/api-error';

export const storesRouter = router({
  getStores: publicProcedure
    .query(async () => {
      const storesData = await db
        .select({
          id: storeInfo.id,
          name: storeInfo.name,
          description: storeInfo.description,
          imageUrl: storeInfo.imageUrl,
          productCount: sql<number>`count(${productInfo.id})`.as('productCount'),
        })
        .from(storeInfo)
        .leftJoin(
          productInfo,
          and(eq(productInfo.storeId, storeInfo.id), eq(productInfo.isSuspended, false))
        )
        .groupBy(storeInfo.id);

      // Generate signed URLs for store images and fetch sample products
      const storesWithDetails = await Promise.all(
        storesData.map(async (store) => {
          const signedImageUrl = store.imageUrl ? await generateSignedUrlFromS3Url(store.imageUrl) : null;

          // Fetch up to 3 products for this store
          const sampleProducts = await db
            .select({
              id: productInfo.id,
              name: productInfo.name,
              images: productInfo.images,
            })
            .from(productInfo)
            .where(and(eq(productInfo.storeId, store.id), eq(productInfo.isSuspended, false)))
            .limit(3);

          // Generate signed URLs for product images
          const productsWithSignedUrls = await Promise.all(
            sampleProducts.map(async (product) => {
              const images = product.images as string[];
              return {
                id: product.id,
                name: product.name,
                signedImageUrl: (images && images.length > 0) ? await generateSignedUrlFromS3Url(images[0]) : null,
              };
            })
          );

          return {
            id: store.id,
            name: store.name,
            description: store.description,
            signedImageUrl,
            productCount: store.productCount,
            sampleProducts: productsWithSignedUrls,
          };
        })
      );

      return {
        stores: storesWithDetails,
      };
    }),

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
          imageUrl: true,
        },
      });

      if (!storeData) {
        throw new ApiError('Store not found', 404);
      }

      // Generate signed URL for store image
      const signedImageUrl = storeData.imageUrl ? await generateSignedUrlFromS3Url(storeData.imageUrl) : null;

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
        .where(and(eq(productInfo.storeId, storeId), eq(productInfo.isSuspended, false)));

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
          signedImageUrl,
        },
        products: productsWithSignedUrls,
      };
    }),
});