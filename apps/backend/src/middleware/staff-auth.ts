import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/db_index';
import { staffUsers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../lib/api-error';

// Extend Request interface to include staffUser
declare global {
  namespace Express {
    interface Request {
      staffUser?: {
        id: number;
        name: string;
      };
    }
  }
}

/**
 * Verify JWT token and extract payload
 */
const verifyStaffToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  } catch (error) {
    throw new ApiError('Invalid staff token', 401);
  }
};

/**
 * Middleware to authenticate staff users and attach staffUser to request
 */
export const authenticateStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Staff authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError('Staff authentication token missing', 401);
    }

    // Verify token and extract payload
    const decoded = verifyStaffToken(token) as any;

    // Verify staffId exists in token
    if (!decoded.staffId) {
      throw new ApiError('Invalid staff token format', 401);
    }

    // Fetch staff user from database
    const staff = await db.query.staffUsers.findFirst({
      where: eq(staffUsers.id, decoded.staffId),
    });

    if (!staff) {
      throw new ApiError('Staff user not found', 401);
    }

    // Attach staff user to request
    req.staffUser = {
      id: staff.id,
      name: staff.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};