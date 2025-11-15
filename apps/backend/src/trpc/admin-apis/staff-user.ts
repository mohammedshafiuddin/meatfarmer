import { router, publicProcedure, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { db } from '../../db/db_index';
import { staffUsers } from '../../db/schema';
import { eq } from 'drizzle-orm';
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
});