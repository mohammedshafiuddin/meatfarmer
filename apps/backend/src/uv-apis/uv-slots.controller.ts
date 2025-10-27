import { Request, Response } from "express";
import { db } from "../db/db_index";
import { deliverySlotInfo } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Get all active delivery slots for users
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