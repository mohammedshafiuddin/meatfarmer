import { Request, Response } from 'express';
import { db } from '../db/db_index';
import { staffUsers } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../lib/api-error';

export const staffLogin = async (req: Request, res: Response) => {
  const { name, password } = req.body;

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

  res.json({
    message: 'Login successful',
    token,
    staff: { id: staff.id, name: staff.name },
  });
};