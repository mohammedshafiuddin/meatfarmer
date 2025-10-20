import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/db_index';
import { users, userCreds } from '../db/schema';
import { ApiError } from '../lib/api-error';
import catchAsync from '../lib/catch-async';
import { jwtSecret } from 'src/lib/env-exporter';

interface LoginRequest {
  identifier: string; // email or mobile
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

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

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { identifier, password }: LoginRequest = req.body;

  if (!identifier || !password) {
    throw new ApiError('Email/mobile and password are required', 400);
  }

  // Find user by email or mobile
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, identifier))
    .limit(1);

  let foundUser = user;

  if (!foundUser) {
    // Try mobile if email didn't work
    const [userByMobile] = await db
      .select()
      .from(users)
      .where(eq(users.mobile, identifier))
      .limit(1);
    foundUser = userByMobile;
  }

  if (!foundUser) {
    throw new ApiError('Invalid credentials', 401);
  }
  
  // Get user credentials
  const [userCredentials] = await db
    .select()
    .from(userCreds)
    .where(eq(userCreds.userId, foundUser.id))
    .limit(1);

  if (!userCredentials) {
    throw new ApiError('Account setup incomplete. Please contact support.', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, userCredentials.userPassword);
  if (!isPasswordValid) {
    throw new ApiError('Invalid credentials', 401);
  }

  const token = generateToken(foundUser.id);

  const response: AuthResponse = {
    token,
    user: {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      mobile: foundUser.mobile,
    },
  };

  res.status(200).json({
    success: true,
    data: response,
  });
  console.log('sent response sucessfully')
  
});

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, mobile, password }: RegisterRequest = req.body;

  if (!name || !email || !mobile || !password) {
    throw new ApiError('All fields are required', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError('Invalid email format', 400);
  }

  // Validate mobile format (Indian mobile numbers)
  const cleanMobile = mobile.replace(/\D/g, '');
  if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
    throw new ApiError('Invalid mobile number', 400);
  }

  // Check if email already exists
  const [existingEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingEmail) {
    throw new ApiError('Email already registered', 409);
  }

  // Check if mobile already exists
  const [existingMobile] = await db
    .select()
    .from(users)
    .where(eq(users.mobile, cleanMobile))
    .limit(1);

  if (existingMobile) {
    throw new ApiError('Mobile number already registered', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user and credentials in a transaction
  const newUser = await db.transaction(async (tx) => {
    // Create user
    const [user] = await tx
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        mobile: cleanMobile,
      })
      .returning();

    // Create user credentials
    await tx
      .insert(userCreds)
      .values({
        userId: user.id,
        userPassword: hashedPassword,
      });

    return user;
  });

  const token = generateToken(newUser.id);

  const response: AuthResponse = {
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      mobile: newUser.mobile,
    },
  };

  res.status(201).json({
    success: true,
    data: response,
  });
});

export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // This will be used with auth middleware
  const userId = req.user?.userId;

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

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    },
  });
});