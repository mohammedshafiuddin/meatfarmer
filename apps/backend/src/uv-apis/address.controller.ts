import { Request, Response } from 'express';
import { db } from '../db/db_index';
import { addresses } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const getUserAddresses = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const userAddresses = await db.select().from(addresses).where(eq(addresses.userId, userId));
    res.status(200).json({ success: true, data: userAddresses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

export const createAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    // Validate required fields
    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }

    const [newAddress] = await db.insert(addresses).values({
      userId,
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault: isDefault || false,
    }).returning();

    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    console.log(error)
    
    res.status(500).json({ error: 'Failed to create address' });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    // Check if address exists and belongs to user
    const existingAddress = await db.select().from(addresses).where(and(eq(addresses.id, parseInt(id)), eq(addresses.userId, userId))).limit(1);
    if (existingAddress.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }

    const [updatedAddress] = await db.update(addresses).set({
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault: isDefault || false,
    }).where(and(eq(addresses.id, parseInt(id)), eq(addresses.userId, userId))).returning();

    res.status(200).json({ success: true, data: updatedAddress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update address' });
  }
};