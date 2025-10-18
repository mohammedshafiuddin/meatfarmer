import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../lib/api-error';

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Access denied. No token provided', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError('Access denied. Invalid token format', 401);
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError('Authentication required', 401);
      }
      
      // Check if user has any of the required roles
      const userRoles = req.user.roles || [];
      const hasPermission = roles.some(role => userRoles.includes(role));
      
      if (!hasPermission) {
        throw new ApiError('Access denied. Insufficient permissions', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
