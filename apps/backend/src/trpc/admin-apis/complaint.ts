import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { complaints, users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const complaintRouter = router({
  getAll: protectedProcedure
    .input(z.object({
      page: z.number().optional().default(1),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      const page = input.page;
      const limit = input.limit;
      const offset = (page - 1) * limit;

      const [complaintsData, totalCountResult] = await Promise.all([
        db
          .select({
            id: complaints.id,
            complaintBody: complaints.complaintBody,
            userId: complaints.userId,
            orderId: complaints.orderId,
            isResolved: complaints.isResolved,
            createdAt: complaints.createdAt,
            userName: users.name,
          })
          .from(complaints)
          .leftJoin(users, eq(complaints.userId, users.id))
          .orderBy(complaints.createdAt)
          .limit(limit)
          .offset(offset),
        db
          .select({ count: db.$count(complaints) })
          .from(complaints),
      ]);

      const totalCount = totalCountResult[0].count;

      return {
        complaints: complaintsData.map(c => ({
          id: c.id,
          text: c.complaintBody,
          userId: c.userId,
          userName: c.userName,
          orderId: c.orderId,
          status: c.isResolved ? 'resolved' : 'pending',
          createdAt: c.createdAt,
        })),
        totalCount,
      };
    }),

  resolve: protectedProcedure
    .input(z.object({ id: z.string(), response: z.string().optional() }))
    .mutation(async ({ input }) => {
      await db
        .update(complaints)
        .set({ isResolved: true, response: input.response })
        .where(eq(complaints.id, parseInt(input.id)));

      return { message: 'Complaint resolved successfully' };
    }),
});