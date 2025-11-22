import { router, publicProcedure } from '../trpc-index';
import { db } from '../../db/db_index';
import { productInfo, units, productSlots, deliverySlotInfo, storeInfo, productTags, productTagInfo } from '../../db/schema';
import { eq, gt, and, sql, inArray } from 'drizzle-orm';
import { generateSignedUrlsFromS3Urls, generateSignedUrlFromS3Url } from '../../lib/s3-client';
import { z } from 'zod';

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





export const commonRouter = router({
  getDashboardTags: publicProcedure
    .query(async () => {
      const tags = await db
        .select()
        .from(productTagInfo)
        .where(eq(productTagInfo.isDashboardTag, true))
        .orderBy(productTagInfo.tagName);

      // Generate signed URLs for tag images
      const tagsWithSignedUrls = await Promise.all(
        tags.map(async (tag) => ({
          ...tag,
          imageUrl: tag.imageUrl ? await generateSignedUrlFromS3Url(tag.imageUrl) : null,
        }))
      );

      return {
        tags: tagsWithSignedUrls,
      };
    }),

  getAllProductsSummary: publicProcedure
    .input(z.object({
      searchQuery: z.string().optional(),
      tagId: z.number().optional()
    }))
    .query(async ({ input }) => {
      const { searchQuery, tagId } = input;

      let productIds: number[] | null = null;

      // If tagId is provided, get products that have this tag
      if (tagId) {
        const taggedProducts = await db
          .select({ productId: productTags.productId })
          .from(productTags)
          .where(eq(productTags.tagId, tagId));

        productIds = taggedProducts.map(tp => tp.productId);
      }

      let whereConditions = [];

      // Add tag filtering
      if (productIds && productIds.length > 0) {
        whereConditions.push(inArray(productInfo.id, productIds));
      } else if (tagId) {
        // If tagId was provided but no products found, return empty array
        return {
          products: [],
          count: 0,
        };
      }

      // Add search filtering
      if (searchQuery) {
        whereConditions.push(sql`LOWER(${productInfo.name}) LIKE LOWER(${ '%' + searchQuery + '%' })`);
      }

      const whereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

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
        .innerJoin(units, eq(productInfo.unitId, units.id))
        .where(whereCondition);

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

      return {
        products: formattedProducts,
        count: formattedProducts.length,
      };
    }),

  getStoresSummary: publicProcedure
    .query(async () => {
      const stores = await db.query.storeInfo.findMany({
        columns: {
          id: true,
          name: true,
          description: true,
        },
      });

      return {
        stores,
      };
    }),
});