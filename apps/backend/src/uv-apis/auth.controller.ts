import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/db_index';
import { users, userCreds, userDetails } from '../db/schema';
import { ApiError } from '../lib/api-error';
import catchAsync from '../lib/catch-async';
import { jwtSecret } from 'src/lib/env-exporter';
import uploadHandler from '../lib/upload-handler';
import { imageUploadS3, generateSignedUrlFromS3Url } from '../lib/s3-client';

interface RegisterRequest {
  name: string;
  email: string;
  mobile: string;
  password: string;
  profileImage?: string;
}

interface UpdateProfileRequest {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string | null;
    email: string | null;
    mobile: string | null;
    profileImage?: string | null;
    bio?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    occupation?: string | null;
  };
}

const generateToken = (userId: number): string => {
  const secret = jwtSecret;
  if (!secret) {
    throw new ApiError('JWT secret not configured', 500);
  }

  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, mobile, password }: RegisterRequest = req.body;

  // Handle profile image upload
  let profileImageUrl: string | undefined;
  if (req.file) {
    const key = `profile-images/${Date.now()}-${req.file.originalname}`;
    profileImageUrl = await imageUploadS3(req.file.buffer, req.file.mimetype, key);
  }

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

    // Create user details with profile image
    await tx
      .insert(userDetails)
      .values({
        userId: user.id,
        profileImage: profileImageUrl,
      });

    return user;
  });

  const token = generateToken(newUser.id);

  // Generate signed URL for profile image if it was uploaded
  const profileImageSignedUrl = profileImageUrl
    ? await generateSignedUrlFromS3Url(profileImageUrl)
    : null;

  const response: AuthResponse = {
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      mobile: newUser.mobile,
      profileImage: profileImageSignedUrl,
      bio: null,
      dateOfBirth: null,
      gender: null,
      occupation: null,
    },
  };

  res.status(201).json({
    success: true,
    data: response,
  });
});

export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError('User not authenticated', 401);
  }

  const { name, email, mobile, password, bio, dateOfBirth, gender, occupation }: UpdateProfileRequest = req.body;

  // Handle profile image upload
  let profileImageUrl: string | undefined;
  if (req.file) {
    const key = `profile-images/${Date.now()}-${req.file.originalname}`;
    profileImageUrl = await imageUploadS3(req.file.buffer, req.file.mimetype, key);
  }

  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError('Invalid email format', 400);
    }
  }

  // Validate mobile format if provided
  if (mobile) {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
      throw new ApiError('Invalid mobile number', 400);
    }
  }

  // Check if email already exists (if changing email)
  if (email) {
    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingEmail && existingEmail.id !== userId) {
      throw new ApiError('Email already registered', 409);
    }
  }

  // Check if mobile already exists (if changing mobile)
  if (mobile) {
    const cleanMobile = mobile.replace(/\D/g, '');
    const [existingMobile] = await db
      .select()
      .from(users)
      .where(eq(users.mobile, cleanMobile))
      .limit(1);

    if (existingMobile && existingMobile.id !== userId) {
      throw new ApiError('Mobile number already registered', 409);
    }
  }

  // Update user and user details in a transaction
  const updatedUser = await db.transaction(async (tx) => {
    // Update user table
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (mobile) updateData.mobile = mobile.replace(/\D/g, '');

    if (Object.keys(updateData).length > 0) {
      await tx
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));
    }

    // Update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await tx
        .update(userCreds)
        .set({ userPassword: hashedPassword })
        .where(eq(userCreds.userId, userId));
    }

    // Update or insert user details
    const userDetailsUpdate: any = {};
    if (bio !== undefined) userDetailsUpdate.bio = bio;
    if (dateOfBirth !== undefined) userDetailsUpdate.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) userDetailsUpdate.gender = gender;
    if (occupation !== undefined) userDetailsUpdate.occupation = occupation;
    if (profileImageUrl) userDetailsUpdate.profileImage = profileImageUrl;
    userDetailsUpdate.updatedAt = new Date();

    // Check if user details record exists
    const [existingDetails] = await tx
      .select()
      .from(userDetails)
      .where(eq(userDetails.userId, userId))
      .limit(1);

    if (existingDetails) {
      // Update existing record
      await tx
        .update(userDetails)
        .set(userDetailsUpdate)
        .where(eq(userDetails.userId, userId));
    } else {
      // Create new record
      userDetailsUpdate.userId = userId;
      userDetailsUpdate.createdAt = new Date();
      await tx
        .insert(userDetails)
        .values(userDetailsUpdate);
    }

    // Return updated user data
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user;
  });

  // Get updated user details for response
  const [userDetail] = await db
    .select()
    .from(userDetails)
    .where(eq(userDetails.userId, userId))
    .limit(1);

  // Generate signed URL for profile image if it exists
  const profileImageSignedUrl = userDetail?.profileImage
    ? await generateSignedUrlFromS3Url(userDetail.profileImage)
    : null;

  const response: AuthResponse = {
    token: req.headers.authorization?.replace('Bearer ', '') || '', // Keep existing token
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      profileImage: profileImageSignedUrl,
      bio: userDetail?.bio || null,
      dateOfBirth: userDetail?.dateOfBirth || null,
      gender: userDetail?.gender || null,
      occupation: userDetail?.occupation || null,
    },
  };

  res.status(200).json({
    success: true,
    data: response,
  });
});