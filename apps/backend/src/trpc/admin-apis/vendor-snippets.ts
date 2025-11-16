import { router, publicProcedure, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { vendorSnippets, deliverySlotInfo, productInfo, orders, orderItems, users } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { appUrl } from '../../lib/env-exporter';

const createSnippetSchema = z.object({
  snippetCode: z.string().min(1, "Snippet code is required"),
  slotId: z.number().int().positive("Valid slot ID is required"),
  productIds: z.array(z.number().int().positive()).min(1, "At least one product is required"),
  validTill: z.string().optional(),
});

const updateSnippetSchema = z.object({
  id: z.number().int().positive(),
  updates: createSnippetSchema.partial().extend({
    snippetCode: z.string().min(1).optional(),
    productIds: z.array(z.number().int().positive()).optional(),
  }),
});

export const vendorSnippetsRouter = router({
  create: protectedProcedure
    .input(createSnippetSchema)
    .mutation(async ({ input, ctx }) => {
      const { snippetCode, slotId, productIds, validTill } = input;

      // Get staff user ID from auth middleware
      const staffUserId = ctx.staffUser?.id;
      if (!staffUserId) {
        throw new Error("Unauthorized");
      }

      // Validate slot exists
      const slot = await db.query.deliverySlotInfo.findFirst({
        where: eq(deliverySlotInfo.id, slotId),
      });
      if (!slot) {
        throw new Error("Invalid slot ID");
      }

      // Validate products exist
      const products = await db.query.productInfo.findMany({
        where: inArray(productInfo.id, productIds),
      });
      if (products.length !== productIds.length) {
        throw new Error("One or more invalid product IDs");
      }

      // Check if snippet code already exists
      const existingSnippet = await db.query.vendorSnippets.findFirst({
        where: eq(vendorSnippets.snippetCode, snippetCode),
      });
      if (existingSnippet) {
        throw new Error("Snippet code already exists");
      }

      const result = await db.insert(vendorSnippets).values({
        snippetCode,
        slotId,
        productIds,
        validTill: validTill ? new Date(validTill) : undefined,
      }).returning();

      return result[0];
    }),

  getAll: protectedProcedure
    .query(async () => {
      console.log('from the vendor snipptes methods')

      try {

        const result = await db.query.vendorSnippets.findMany({
          with: {
            slot: true,
          },
          orderBy: (vendorSnippets, { desc }) => [desc(vendorSnippets.createdAt)],
        });
        return result.map(snippet => ({
          ...snippet,
          accessUrl: `${appUrl}/mf/admin-web/vendor-order-list?id=${snippet.snippetCode}`
        }));
      }
      catch(e) {
        console.log(e)
      }
      return [];
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const { id } = input;

      const result = await db.query.vendorSnippets.findFirst({
        where: eq(vendorSnippets.id, id),
        with: {
          slot: true,
        },
      });

      if (!result) {
        throw new Error("Vendor snippet not found");
      }

      return result;
    }),

  update: protectedProcedure
    .input(updateSnippetSchema)
    .mutation(async ({ input }) => {
      const { id, updates } = input;

      // Check if snippet exists
      const existingSnippet = await db.query.vendorSnippets.findFirst({
        where: eq(vendorSnippets.id, id),
      });
      if (!existingSnippet) {
        throw new Error("Vendor snippet not found");
      }

      // Validate slot if being updated
      if (updates.slotId) {
        const slot = await db.query.deliverySlotInfo.findFirst({
          where: eq(deliverySlotInfo.id, updates.slotId),
        });
        if (!slot) {
          throw new Error("Invalid slot ID");
        }
      }

      // Validate products if being updated
      if (updates.productIds) {
        const products = await db.query.productInfo.findMany({
          where: inArray(productInfo.id, updates.productIds),
        });
        if (products.length !== updates.productIds.length) {
          throw new Error("One or more invalid product IDs");
        }
      }

      // Check snippet code uniqueness if being updated
      if (updates.snippetCode && updates.snippetCode !== existingSnippet.snippetCode) {
        const duplicateSnippet = await db.query.vendorSnippets.findFirst({
          where: eq(vendorSnippets.snippetCode, updates.snippetCode),
        });
        if (duplicateSnippet) {
          throw new Error("Snippet code already exists");
        }
      }

      const updateData: any = { ...updates };
      if (updates.validTill !== undefined) {
        updateData.validTill = updates.validTill ? new Date(updates.validTill) : null;
      }

      const result = await db.update(vendorSnippets)
        .set(updateData)
        .where(eq(vendorSnippets.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("Failed to update vendor snippet");
      }

      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const result = await db.delete(vendorSnippets)
        .where(eq(vendorSnippets.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("Vendor snippet not found");
      }

      return { message: "Vendor snippet deleted successfully" };
    }),

  getOrdersBySnippet: protectedProcedure
    .input(z.object({
      snippetCode: z.string().min(1, "Snippet code is required")
    }))
    .query(async ({ input }) => {
      const { snippetCode } = input;

      // Find the snippet
      const snippet = await db.query.vendorSnippets.findFirst({
        where: eq(vendorSnippets.snippetCode, snippetCode),
      });

      if (!snippet) {
        throw new Error("Vendor snippet not found");
      }

      // Check if snippet is still valid
      if (snippet.validTill && new Date(snippet.validTill) < new Date()) {
        throw new Error("Vendor snippet has expired");
      }

      // Query orders that match the snippet criteria
      const matchingOrders = await db.query.orders.findMany({
        where: and(
          eq(orders.slotId, snippet.slotId),
          // We'll filter by products in the application logic
        ),
        with: {
          orderItems: {
            with: {
              product: {
                with: {
                  unit: true,
                },
              },
            },
          },
          user: true,
          slot: true,
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });

      // Filter orders that contain at least one of the snippet's products
      const filteredOrders = matchingOrders.filter(order => {
        const orderProductIds = order.orderItems.map(item => item.productId);
        return snippet.productIds.some(productId => orderProductIds.includes(productId));
      });

      // Format the response
      const formattedOrders = filteredOrders.map(order => {
        // Filter orderItems to only include products attached to the snippet
        const attachedOrderItems = order.orderItems.filter(item =>
          snippet.productIds.includes(item.productId)
        );

        const products = attachedOrderItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price.toString()),
          unit: item.product.unit?.shortNotation || 'unit',
          subtotal: parseFloat(item.price.toString()) * parseFloat(item.quantity),
        }));

        return {
          orderId: `ORD${order.readableId.toString().padStart(3, '0')}`,
          orderDate: order.createdAt.toISOString(),
          customerName: order.user.name,
          totalAmount: order.totalAmount,
          slotInfo: order.slot ? {
            time: order.slot.deliveryTime.toISOString(),
            sequence: order.slot.deliverySequence,
          } : null,
          products,
          matchedProducts: snippet.productIds, // All snippet products are considered matched
          snippetCode: snippet.snippetCode,
        };
      });

      return {
        success: true,
        data: formattedOrders,
        snippet: {
          id: snippet.id,
          snippetCode: snippet.snippetCode,
          slotId: snippet.slotId,
          productIds: snippet.productIds,
          validTill: snippet.validTill?.toISOString(),
          createdAt: snippet.createdAt.toISOString(),
        },
      };
    }),

  getVendorOrders: protectedProcedure
    .query(async () => {
      const vendorOrders = await db.query.orders.findMany({
        with: {
          user: true,
          orderItems: {
            with: {
              product: {
                with: {
                  unit: true,
                },
              },
            },
          },
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });

      return vendorOrders.map(order => ({
        id: order.id,
        status: 'pending', // Default status since orders table may not have status field
        orderDate: order.createdAt.toISOString(),
        totalQuantity: order.orderItems.reduce((sum, item) => sum + parseFloat(item.quantity || '0'), 0),
        products: order.orderItems.map(item => ({
          name: item.product.name,
          quantity: parseFloat(item.quantity || '0'),
          unit: item.product.unit?.shortNotation || 'unit',
        })),
      }));
    }),
});