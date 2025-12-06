import { Request, Response, NextFunction } from 'express';
import { db } from '../db/db_index';
import { complaints } from '../db/schema';
import { ApiError } from '../lib/api-error';
import catchAsync from '../lib/catch-async';
import { imageUploadS3 } from '../lib/s3-client';

interface RaiseComplaintRequest {
  orderId?: string;
  complaintBody: string;
}

export const raiseComplaint = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('raising complaint')
  
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError('User not authenticated', 401);
  }

  console.log({body: req.body})
  
  const { orderId, complaintBody }: RaiseComplaintRequest = req.body;
  console.log({userId, orderId, complaintBody})

  let orderIdNum: number | null = null;

  if (orderId) {
    const readableIdMatch = orderId.match(/^ORD(\d+)$/);
    if (readableIdMatch) {
      orderIdNum = parseInt(readableIdMatch[1]);
    }
  }

  // Handle image uploads
  const images = (req.files as Express.Multer.File[])?.filter(item => item.fieldname === 'images');
  let uploadedImageUrls: string[] = [];

  if (images && Array.isArray(images)) {
    const imageUploadPromises = images.map((file, index) => {
      const key = `complaint-images/${Date.now()}-${index}`;
      return imageUploadS3(file.buffer, file.mimetype, key);
    });

    uploadedImageUrls = await Promise.all(imageUploadPromises);
  }

  await db.insert(complaints).values({
    userId,
    orderId: orderIdNum,
    complaintBody: complaintBody.trim(),
    images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
  });

  res.status(200).json({
    success: true,
    message: 'Complaint raised successfully'
  });
});