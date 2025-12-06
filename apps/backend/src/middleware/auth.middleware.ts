import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/db_index';
import { staffUsers, userDetails } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../lib/api-error';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    name?: string;
    email?: string;
    mobile?: string;
  };
  staffUser?: {
    id: number;
    name: string;
  };
}

export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError('Authorization token required', 401);
    }

    const token = authHeader.substring(7);
    console.log(req.headers)
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Check if this is a staff token (has staffId)
    if (decoded.staffId) {
      // This is a staff token, verify staff exists
      const staff = await db.query.staffUsers.findFirst({
        where: eq(staffUsers.id, decoded.staffId),
      });

      if (!staff) {
        throw new ApiError('Invalid staff token', 401);
      }

      req.staffUser = {
        id: staff.id,
        name: staff.name,
      };
    } else {
      // This is a regular user token
      req.user = decoded;

      // Check if user is suspended
      const details = await db.query.userDetails.findFirst({
        where: eq(userDetails.userId, decoded.userId),
      });

      if (details?.isSuspended) {
        throw new ApiError('Account suspended', 403);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};