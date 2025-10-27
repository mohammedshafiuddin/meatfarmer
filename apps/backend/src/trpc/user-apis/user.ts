import { router, protectedProcedure } from '../trpc-index';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../db/db_index';
import { users } from '../../db/schema';
import { ApiError } from '../../lib/api-error';
import { jwtSecret } from 'src/lib/env-exporter';

interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string | null;
    mobile: string | null;
  };
}

const generateToken = (userId: number): string => {
  const secret = jwtSecret;
  if (!secret) {
    throw new ApiError('JWT secret not configured', 500);
  }

  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export const userRouter = router({
  getSelfData: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.userId;

      if (!userId) {
        throw new ApiError('User not authenticated', 401);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new ApiError('User not found', 404);
      }


      const response: Omit<AuthResponse, 'token'> = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
        },
      };

      return {
        success: true,
        data: response,
      };
    }),
});