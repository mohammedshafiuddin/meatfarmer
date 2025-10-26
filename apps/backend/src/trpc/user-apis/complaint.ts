import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { complaints } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const complaintRouter = router({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.userId;

      const userComplaints = await db
        .select({
          id: complaints.id,
          complaintBody: complaints.complaintBody,
          response: complaints.response,
          isResolved: complaints.isResolved,
          createdAt: complaints.createdAt,
          orderId: complaints.orderId,
        })
        .from(complaints)
        .where(eq(complaints.userId, userId))
        .orderBy(complaints.createdAt);

      return {
        complaints: userComplaints.map(c => ({
          id: c.id,
          complaintBody: c.complaintBody,
          response: c.response,
          isResolved: c.isResolved,
          createdAt: c.createdAt,
          orderId: c.orderId,
        })),
      };
    }),

  raise: protectedProcedure
    .input(z.object({
      orderId: z.string().optional(),
      complaintBody: z.string().min(1, 'Complaint body is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;
      const { orderId, complaintBody } = input;
      console.log({userId, orderId, complaintBody})

      let orderIdNum: number | null = null;

      if (orderId) {
        const readableIdMatch = orderId.match(/^ORD(\d+)$/);
        if (readableIdMatch) {
          orderIdNum = parseInt(readableIdMatch[1]);
        }
      }

      await db.insert(complaints).values({
        userId,
        orderId: orderIdNum,
        complaintBody: complaintBody.trim(),
      });

      return { success: true, message: 'Complaint raised successfully' };
    }),
});