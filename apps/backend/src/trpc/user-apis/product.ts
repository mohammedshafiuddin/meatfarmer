import { router, publicProcedure, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { productInfo, units, productSlots, deliverySlotInfo, specialDeals, storeInfo, productTagInfo, productTags, productReviews, users } from '../../db/schema';
import { generateSignedUrlsFromS3Urls, generateSignedUrlFromS3Url, generateUploadUrl, claimUploadUrl, extractKeyFromPresignedUrl } from '../../lib/s3-client';
import { ApiError } from '../../lib/api-error';
import { eq, and, gt, sql, inArray, desc } from 'drizzle-orm';

export const productRouter = router({
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

  getProductReviews: publicProcedure
    .input(z.object({
      productId: z.number().int().positive(),
      limit: z.number().int().min(1).max(50).optional().default(10),
      offset: z.number().int().min(0).optional().default(0),
    }))
    .query(async ({ input }) => {
      const { productId, limit, offset } = input;

      const reviews = await db
        .select({
          id: productReviews.id,
          reviewBody: productReviews.reviewBody,
          ratings: productReviews.ratings,
          imageUrls: productReviews.imageUrls,
          reviewTime: productReviews.reviewTime,
          userName: users.name,
        })
        .from(productReviews)
        .innerJoin(users, eq(productReviews.userId, users.id))
        .where(eq(productReviews.productId, productId))
        .orderBy(desc(productReviews.reviewTime))
        .limit(limit)
        .offset(offset);

      // Generate signed URLs for images
      const reviewsWithSignedUrls = await Promise.all(
        reviews.map(async (review) => ({
          ...review,
          signedImageUrls: await generateSignedUrlsFromS3Urls((review.imageUrls as string[]) || []),
        }))
      );

      // Check if more reviews exist
      const totalCountResult = await db
        .select({ count: sql`count(*)` })
        .from(productReviews)
        .where(eq(productReviews.productId, productId));

      const totalCount = Number(totalCountResult[0].count);
      const hasMore = offset + limit < totalCount;

      return { reviews: reviewsWithSignedUrls, hasMore };
    }),

  createReview: protectedProcedure
    .input(z.object({
      productId: z.number().int().positive(),
      reviewBody: z.string().min(1, 'Review body is required'),
      ratings: z.number().int().min(1).max(5),
      imageUrls: z.array(z.string()).optional().default([]),
      uploadUrls: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ input, ctx }) => {
      const { productId, reviewBody, ratings, imageUrls, uploadUrls } = input;
      const userId = ctx.user.userId;

      // Optional: Check if product exists
      const product = await db.query.productInfo.findFirst({
        where: eq(productInfo.id, productId),
      });
      if (!product) {
        throw new ApiError('Product not found', 404);
      }

      // Insert review
      const [newReview] = await db.insert(productReviews).values({
        userId,
        productId,
        reviewBody,
        ratings,
        imageUrls: uploadUrls.map(item => extractKeyFromPresignedUrl(item)),
      }).returning();

      // Claim upload URLs
      if (uploadUrls && uploadUrls.length > 0) {
        try {
          await Promise.all(uploadUrls.map(url => claimUploadUrl(url)));
        } catch (error) {
          console.error('Error claiming upload URLs:', error);
          // Don't fail the review creation
        }
      }

      return { success: true, review: newReview };
    }),
});