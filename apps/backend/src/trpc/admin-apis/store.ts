import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { storeInfo } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../../lib/api-error';

export const storeRouter = router({
  getStores: protectedProcedure
    .query(async ({ ctx }) => {
      const stores = await db.query.storeInfo.findMany({
        with: {
          owner: true,
        },
      });

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

      return {
        store,
      };
    }),

  createStore: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      owner: z.number().min(1, "Owner is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { name, description, owner } = input;

      const [newStore] = await db
        .insert(storeInfo)
        .values({
          name,
          description,
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
      owner: z.number().min(1, "Owner is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, name, description, owner } = input;

      const [updatedStore] = await db
        .update(storeInfo)
        .set({
          name,
          description,
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