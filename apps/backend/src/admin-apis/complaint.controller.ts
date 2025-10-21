import { Request, Response } from 'express';
import { db } from '../db/db_index';
import { complaints, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const getComplaints = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [complaintsData, totalCountResult] = await Promise.all([
      db
        .select({
          id: complaints.id,
          complaintBody: complaints.complaintBody,
          userId: complaints.userId,
          orderId: complaints.orderId,
          isResolved: complaints.isResolved,
          createdAt: complaints.createdAt,
          userName: users.name,
        })
        .from(complaints)
        .leftJoin(users, eq(complaints.userId, users.id))
        .orderBy(complaints.createdAt)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: db.$count(complaints) })
        .from(complaints),
    ]);

    const totalCount = totalCountResult[0].count;

    res.json({
      complaints: complaintsData.map(c => ({
        id: c.id,
        text: c.complaintBody,
        userId: c.userId,
        userName: c.userName,
        orderId: c.orderId,
        status: c.isResolved ? 'resolved' : 'pending',
        createdAt: c.createdAt,
      })),
      totalCount,
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

export const resolveComplaint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db
      .update(complaints)
      .set({ isResolved: true })
      .where(eq(complaints.id, parseInt(id)));

    res.json({ message: 'Complaint resolved successfully' });
  } catch (error) {
    console.error('Resolve complaint error:', error);
    res.status(500).json({ error: 'Failed to resolve complaint' });
  }
};