import { Request, Response } from "express";
import { db } from "../db/db_index";
import { deliverySlotInfo } from "../db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "../lib/api-error";

/**
 * Create a new delivery slot
 */
export const createSlot = async (req: Request, res: Response) => {
  const { deliveryTime, freezeTime, isActive } = req.body;

  // Validate required fields
  if (!deliveryTime || !freezeTime) {
    throw new ApiError("Delivery time and freeze time are required", 400);
  }

  // Create slot
  const [newSlot] = await db
    .insert(deliverySlotInfo)
    .values({
      deliveryTime: new Date(deliveryTime),
      freezeTime: new Date(freezeTime),
      isActive: isActive !== undefined ? isActive : true,
    })
    .returning();

  return res.status(201).json({
    slot: newSlot,
    message: "Slot created successfully",
  });
};

/**
 * Get all delivery slots
 */
export const getSlots = async (req: Request, res: Response) => {
  const slots = await db.query.deliverySlotInfo.findMany({
    where: eq(deliverySlotInfo.isActive, true),
  });

  
  return res.status(200).json({
    slots,
    count: slots.length,
  });
};

/**
 * Get a slot by ID
 */
export const getSlotById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const slot = await db.query.deliverySlotInfo.findFirst({
    where: eq(deliverySlotInfo.id, parseInt(id)),
  });

  if (!slot) {
    throw new ApiError("Slot not found", 404);
  }

  return res.status(200).json({
    slot,
  });
};

/**
 * Update a slot
 */
export const updateSlot = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { deliveryTime, freezeTime, isActive } = req.body;

  if (!deliveryTime || !freezeTime) {
    throw new ApiError("Delivery time and freeze time are required", 400);
  }

  const [updatedSlot] = await db
    .update(deliverySlotInfo)
    .set({
      deliveryTime: new Date(deliveryTime),
      freezeTime: new Date(freezeTime),
      isActive: isActive !== undefined ? isActive : true,
    })
    .where(eq(deliverySlotInfo.id, parseInt(id)))
    .returning();

  if (!updatedSlot) {
    throw new ApiError("Slot not found", 404);
  }

  return res.status(200).json({
    slot: updatedSlot,
    message: "Slot updated successfully",
  });
};

/**
 * Delete a slot (soft delete)
 */
export const deleteSlot = async (req: Request, res: Response) => {
  const { id } = req.params;

  const [deletedSlot] = await db
    .update(deliverySlotInfo)
    .set({ isActive: false })
    .where(eq(deliverySlotInfo.id, parseInt(id)))
    .returning();

  if (!deletedSlot) {
    throw new ApiError("Slot not found", 404);
  }

  return res.status(200).json({
    message: "Slot deleted successfully",
  });
};

/**
 * Get delivery sequence for a slot
 */
export const getDeliverySequence = async (req: Request, res: Response) => {
  const { id } = req.params;

  const slot = await db.query.deliverySlotInfo.findFirst({
    where: eq(deliverySlotInfo.id, parseInt(id)),
  });

  if (!slot) {
    throw new ApiError("Slot not found", 404);
  }

  return res.status(200).json({
    deliverySequence: slot.deliverySequence || [],
  });
};

/**
 * Update delivery sequence for a slot
 */
export const updateDeliverySequence = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { deliverySequence } = req.body;

  // Validate that deliverySequence is an array of numbers
  if (!Array.isArray(deliverySequence) || !deliverySequence.every(id => typeof id === 'number')) {
    throw new ApiError("deliverySequence must be an array of order IDs", 400);
  }

  const [updatedSlot] = await db
    .update(deliverySlotInfo)
    .set({ deliverySequence })
    .where(eq(deliverySlotInfo.id, parseInt(id)))
    .returning({
      id: deliverySlotInfo.id,
      deliverySequence: deliverySlotInfo.deliverySequence,
    });

  if (!updatedSlot) {
    throw new ApiError("Slot not found", 404);
  }

  return res.status(200).json({
    slot: updatedSlot,
    message: "Delivery sequence updated successfully",
  });
};