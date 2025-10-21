import { Request, Response } from 'express';
import { db } from '../db/db_index';
import { complaints } from '../db/schema';

export const raiseComplaint = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { orderId, complaintBody } = req.body;

    if (!complaintBody || !complaintBody.trim()) {
      return res.status(400).json({ error: 'Complaint body is required' });
    }

    let orderIdNum: number | null = null;
    if (orderId) {
      const readableIdMatch = orderId.match(/^ORD(\d+)$/);
      if (readableIdMatch) {
        orderIdNum = parseInt(readableIdMatch[1]);
      }
    }

    await db.insert(complaints).values({
      userId,
      orderId: orderIdNum,
      complaintBody: complaintBody.trim(),
    });

    res.status(201).json({ success: true, message: 'Complaint raised successfully' });
  } catch (error) {
    console.error('Raise complaint error:', error);
    res.status(500).json({ error: 'Failed to raise complaint' });
  }
};