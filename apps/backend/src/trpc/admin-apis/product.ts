import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { productInfo, units, specialDeals, productSlots, productTags, productReviews, users } from '../../db/schema';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';
import { ApiError } from '../../lib/api-error';
import { imageUploadS3, generateSignedUrlsFromS3Urls, getOriginalUrlFromSignedUrl, claimUploadUrl } from '../../lib/s3-client';
import { deleteS3Image } from '../../lib/delete-image';
import type { SpecialDeal } from '../../db/types';

type CreateDeal = {
  quantity: number;
  price: number;
  validTill: string;
};

export const productRouter = router({
  getProducts: protectedProcedure
    .query(async ({ ctx }) => {
      const products = await db.query.productInfo.findMany({
        with: {
          unit: true,
        },
      });

      // Generate signed URLs for all product images
      const productsWithSignedUrls = await Promise.all(
        products.map(async (product) => ({
          ...product,
          images: await generateSignedUrlsFromS3Urls((product.images as string[]) || []),
        }))
      );

      return {
        products: productsWithSignedUrls,
        count: productsWithSignedUrls.length,
      };
    }),

  getProductById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const product = await db.query.productInfo.findFirst({
        where: eq(productInfo.id, id),
        with: {
          unit: true,
        },
      });

      if (!product) {
        throw new ApiError("Product not found", 404);
      }

      // Fetch special deals for this product
      const deals = await db.query.specialDeals.findMany({
        where: eq(specialDeals.productId, id),
        orderBy: specialDeals.quantity,
      });

      // Fetch associated tags for this product
      const productTagsData = await db.query.productTags.findMany({
        where: eq(productTags.productId, id),
        with: {
          tag: true,
        },
      });

      // Generate signed URLs for product images
      const productWithSignedUrls = {
        ...product,
        images: await generateSignedUrlsFromS3Urls((product.images as string[]) || []),
        deals,
        tags: productTagsData.map(pt => pt.tag),
      };

      return {
        product: productWithSignedUrls,
      };
    }),

  deleteProduct: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const [deletedProduct] = await db
        .delete(productInfo)
        .where(eq(productInfo.id, id))
        .returning();

      if (!deletedProduct) {
        throw new ApiError("Product not found", 404);
      }

      return {
        message: "Product deleted successfully",
      };
    }),

  toggleOutOfStock: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const product = await db.query.productInfo.findFirst({
        where: eq(productInfo.id, id),
      });

      if (!product) {
        throw new ApiError("Product not found", 404);
      }

      const [updatedProduct] = await db
        .update(productInfo)
        .set({
          isOutOfStock: !product.isOutOfStock,
        })
        .where(eq(productInfo.id, id))
        .returning();

      return {
        product: updatedProduct,
        message: `Product marked as ${updatedProduct.isOutOfStock ? 'out of stock' : 'in stock'}`,
      };
    }),

  updateSlotProducts: protectedProcedure
    .input(z.object({
      slotId: z.string(),
      productIds: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const { slotId, productIds } = input;

      if (!Array.isArray(productIds)) {
        throw new ApiError("productIds must be an array", 400);
      }

      // Get current associations
      const currentAssociations = await db.query.productSlots.findMany({
        where: eq(productSlots.slotId, parseInt(slotId)),
        columns: {
          productId: true,
        },
      });

      const currentProductIds = currentAssociations.map(assoc => assoc.productId);
      const newProductIds = productIds.map((id: string) => parseInt(id));

      // Find products to add and remove
      const productsToAdd = newProductIds.filter(id => !currentProductIds.includes(id));
      const productsToRemove = currentProductIds.filter(id => !newProductIds.includes(id));

      // Remove associations for products that are no longer selected
      if (productsToRemove.length > 0) {
        await db.delete(productSlots).where(
          and(
            eq(productSlots.slotId, parseInt(slotId)),
            inArray(productSlots.productId, productsToRemove)
          )
        );
      }

      // Add associations for newly selected products
      if (productsToAdd.length > 0) {
        const newAssociations = productsToAdd.map(productId => ({
          productId,
          slotId: parseInt(slotId),
        }));

        await db.insert(productSlots).values(newAssociations);
      }

      return {
        message: "Slot products updated successfully",
        added: productsToAdd.length,
        removed: productsToRemove.length,
      };
    }),

  getSlotProductIds: protectedProcedure
    .input(z.object({
      slotId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { slotId } = input;

      const associations = await db.query.productSlots.findMany({
        where: eq(productSlots.slotId, parseInt(slotId)),
        columns: {
          productId: true,
        },
      });

      const productIds = associations.map(assoc => assoc.productId);

      return {
        productIds,
      };
    }),

  getSlotsProductIds: protectedProcedure
    .input(z.object({
      slotIds: z.array(z.number()),
    }))
    .query(async ({ input, ctx }) => {
      const { slotIds } = input;

      if (!Array.isArray(slotIds)) {
        throw new ApiError("slotIds must be an array", 400);
      }

      if (slotIds.length === 0) {
        return {};
      }

      // Fetch all associations for the requested slots
      const associations = await db.query.productSlots.findMany({
        where: inArray(productSlots.slotId, slotIds),
        columns: {
          slotId: true,
          productId: true,
        },
      });

      // Group by slotId
      const result = associations.reduce((acc, assoc) => {
        if (!acc[assoc.slotId]) {
          acc[assoc.slotId] = [];
        }
        acc[assoc.slotId].push(assoc.productId);
        return acc;
      }, {} as Record<number, number[]>);

      // Ensure all requested slots have entries (even if empty)
      slotIds.forEach(slotId => {
        if (!result[slotId]) {
          result[slotId] = [];
        }
      });

      return result;
    }),

  getProductReviews: protectedProcedure
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
          adminResponse: productReviews.adminResponse,
          adminResponseImages: productReviews.adminResponseImages,
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
          signedAdminImageUrls: await generateSignedUrlsFromS3Urls((review.adminResponseImages as string[]) || []),
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

  respondToReview: protectedProcedure
    .input(z.object({
      reviewId: z.number().int().positive(),
      adminResponse: z.string().optional(),
      adminResponseImages: z.array(z.string()).optional().default([]),
      uploadUrls: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ input }) => {
      const { reviewId, adminResponse, adminResponseImages, uploadUrls } = input;

      console.log({adminResponseImages, uploadUrls, adminResponse})
      
      const [updatedReview] = await db
        .update(productReviews)
        .set({
          adminResponse,
          adminResponseImages,
        })
        .where(eq(productReviews.id, reviewId))
        .returning();

      if (!updatedReview) {
        throw new ApiError('Review not found', 404);
      }

      // Claim upload URLs
      if (uploadUrls && uploadUrls.length > 0) {
        // const { claimUploadUrl } = await import('../../lib/s3-client');
        await Promise.all(uploadUrls.map(url => claimUploadUrl(url)));
      }

      return { success: true, review: updatedReview };
    }),
});