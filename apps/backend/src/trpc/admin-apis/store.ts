import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { storeInfo } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../../lib/api-error';
 import { extractKeyFromPresignedUrl, deleteImageUtil, generateSignedUrlFromS3Url } from '../../lib/s3-client';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const storeRouter = router({
  getStores: protectedProcedure
    .query(async ({ ctx }) => {
      const stores = await db.query.storeInfo.findMany({
        with: {
          owner: true,
        },
      });

      Promise.all(stores.map(async store => {
        if(store.imageUrl)
          store.imageUrl = await generateSignedUrlFromS3Url(store.imageUrl)
      })).catch((e) => {
        throw new ApiError("Unable to find store image urls")
      }
      )
      return {
        stores,
        count: stores.length,
      };
    }),

  getStoreById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const store = await db.query.storeInfo.findFirst({
        where: eq(storeInfo.id, id),
        with: {
          owner: true,
        },
      });

      if (!store) {
        throw new ApiError("Store not found", 404);
      }
      store.imageUrl = await generateSignedUrlFromS3Url(store.imageUrl);
      return {
        store,
      };
    }),

  createStore: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      owner: z.number().min(1, "Owner is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { name, description, imageUrl, owner } = input;

      const imageKey = imageUrl ? extractKeyFromPresignedUrl(imageUrl) : undefined;

      const [newStore] = await db
        .insert(storeInfo)
        .values({
          name,
          description,
          imageUrl: imageKey,
          owner,
        })
        .returning();

      return {
        store: newStore,
        message: "Store created successfully",
      };
    }),

   updateStore: protectedProcedure
     .input(z.object({
       id: z.number(),
       name: z.string().min(1, "Name is required"),
       description: z.string().optional(),
       imageUrl: z.string().optional(),
       owner: z.number().min(1, "Owner is required"),
     }))
     .mutation(async ({ input, ctx }) => {
       const { id, name, description, imageUrl, owner } = input;

       const existingStore = await db.query.storeInfo.findFirst({
         where: eq(storeInfo.id, id),
       });

       if (!existingStore) {
         throw new ApiError("Store not found", 404);
       }

        const oldImageKey = existingStore.imageUrl;
        const newImageKey = imageUrl ? extractKeyFromPresignedUrl(imageUrl) : oldImageKey;

        // Delete old image only if:
        // 1. New image provided and keys are different, OR
        // 2. No new image but old exists (clearing the image)
        if (oldImageKey && (
          (newImageKey && newImageKey !== oldImageKey) ||
          (!newImageKey)
        )) {
          try {
            await deleteImageUtil({keys: [oldImageKey]});
          } catch (error) {
            console.error('Failed to delete old image:', error);
            // Continue with update even if deletion fails
          }
        }

        const [updatedStore] = await db
          .update(storeInfo)
          .set({
            name,
            description,
            imageUrl: newImageKey,
            owner,
          })
          .where(eq(storeInfo.id, id))
          .returning();

       if (!updatedStore) {
         throw new ApiError("Store not found", 404);
       }

       return {
         store: updatedStore,
         message: "Store updated successfully",
       };
     }),

  deleteStore: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const [deletedStore] = await db
        .delete(storeInfo)
        .where(eq(storeInfo.id, id))
        .returning();

      if (!deletedStore) {
        throw new ApiError("Store not found", 404);
      }

      return {
        message: "Store deleted successfully",
      };
    }),
});