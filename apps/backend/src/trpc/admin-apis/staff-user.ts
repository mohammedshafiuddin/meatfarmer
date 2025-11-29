import { router, publicProcedure, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { staffUsers, users, userDetails, orders } from '../../db/schema';
import { eq, or, ilike, and, lt, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../lib/api-error';

export const staffUserRouter = router({
  login: publicProcedure
    .input(z.object({
      name: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { name, password } = input;

      if (!name || !password) {
        throw new ApiError('Name and password are required', 400);
      }

      const staff = await db.query.staffUsers.findFirst({
        where: eq(staffUsers.name, name),
      });

      if (!staff) {
        throw new ApiError('Invalid credentials', 401);
      }

      const isPasswordValid = await bcrypt.compare(password, staff.password);
      if (!isPasswordValid) {
        throw new ApiError('Invalid credentials', 401);
      }

      const token = jwt.sign(
        { staffId: staff.id, name: staff.name },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      return {
        message: 'Login successful',
        token,
        staff: { id: staff.id, name: staff.name },
      };
    }),

  getStaff: protectedProcedure
    .query(async ({ ctx }) => {
      const staff = await db.query.staffUsers.findMany({
        columns: {
          id: true,
          name: true,
        },
      });

      return {
        staff,
      };
    }),

  getUsers: protectedProcedure
    .input(z.object({
      cursor: z.number().optional(),
      limit: z.number().default(20),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { cursor, limit, search } = input;

      let whereCondition = undefined;

      if (search) {
        whereCondition = or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.mobile, `%${search}%`)
        );
      }

      if (cursor) {
        const cursorCondition = lt(users.id, cursor);
        whereCondition = whereCondition ? and(whereCondition, cursorCondition) : cursorCondition;
      }

      const allUsers = await db.query.users.findMany({
        where: whereCondition,
        with: {
          userDetails: true,
        },
        orderBy: desc(users.id),
        limit: limit + 1, // fetch one extra to check if there's more
      });

      const hasMore = allUsers.length > limit;
      const usersToReturn = hasMore ? allUsers.slice(0, limit) : allUsers;

      const formattedUsers = usersToReturn.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        image: user.userDetails?.profileImage || null,
      }));

      return {
        users: formattedUsers,
        nextCursor: hasMore ? usersToReturn[usersToReturn.length - 1].id : undefined,
      };
    }),

  getUserDetails: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const { userId } = input;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
          userDetails: true,
          orders: {
            orderBy: desc(orders.createdAt),
            limit: 1,
          },
        },
      });

      if (!user) {
        throw new ApiError("User not found", 404);
      }

      const lastOrder = user.orders[0];

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        addedOn: user.createdAt,
        lastOrdered: lastOrder?.createdAt || null,
        isSuspended: user.userDetails?.isSuspended || false,
      };
    }),

  updateUserSuspension: protectedProcedure
    .input(z.object({ userId: z.number(), isSuspended: z.boolean() }))
    .mutation(async ({ input }) => {
      const { userId, isSuspended } = input;

      await db
        .insert(userDetails)
        .values({ userId, isSuspended })
        .onConflictDoUpdate({
          target: userDetails.userId,
          set: { isSuspended },
        });

      return { success: true };
    }),
});