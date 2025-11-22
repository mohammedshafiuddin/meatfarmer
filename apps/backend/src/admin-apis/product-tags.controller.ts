import { Request, Response } from "express";
import { db } from "../db/db_index";
import { productTagInfo } from "../db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "../lib/api-error";
import { imageUploadS3, generateSignedUrlFromS3Url } from "../lib/s3-client";
import { deleteS3Image } from "../lib/delete-image";

/**
 * Create a new product tag
 */
export const createTag = async (req: Request, res: Response) => {
  const { tagName, tagDescription, isDashboardTag } = req.body;

  if (!tagName) {
    throw new ApiError("Tag name is required", 400);
  }

  // Check for duplicate tag name
  const existingTag = await db.query.productTagInfo.findFirst({
    where: eq(productTagInfo.tagName, tagName.trim()),
  });

  if (existingTag) {
    throw new ApiError("A tag with this name already exists", 400);
  }

  let imageUrl: string | null = null;

  // Handle image upload if file is provided
  if (req.file) {
    const key = `tags/${Date.now()}-${req.file.originalname}`;
    imageUrl = await imageUploadS3(req.file.buffer, req.file.mimetype, key);
  }

  const [newTag] = await db
    .insert(productTagInfo)
    .values({
      tagName: tagName.trim(),
      tagDescription,
      imageUrl,
      isDashboardTag: isDashboardTag || false,
    })
    .returning();

  return res.status(201).json({
    tag: newTag,
    message: "Tag created successfully",
  });
};

/**
 * Get all product tags
 */
export const getAllTags = async (req: Request, res: Response) => {
  const tags = await db
    .select()
    .from(productTagInfo)
    .orderBy(productTagInfo.tagName);

  // Generate signed URLs for tag images
  const tagsWithSignedUrls = await Promise.all(
    tags.map(async (tag) => ({
      ...tag,
      imageUrl: tag.imageUrl ? await generateSignedUrlFromS3Url(tag.imageUrl) : null,
    }))
  );

  return res.status(200).json({
    tags: tagsWithSignedUrls,
    message: "Tags retrieved successfully",
  });
};

/**
 * Get a single product tag by ID
 */
export const getTagById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const tag = await db.query.productTagInfo.findFirst({
    where: eq(productTagInfo.id, parseInt(id)),
  });

  if (!tag) {
    throw new ApiError("Tag not found", 404);
  }

  // Generate signed URL for tag image
  const tagWithSignedUrl = {
    ...tag,
    imageUrl: tag.imageUrl ? await generateSignedUrlFromS3Url(tag.imageUrl) : null,
  };

  return res.status(200).json({
    tag: tagWithSignedUrl,
    message: "Tag retrieved successfully",
  });
};

/**
 * Update a product tag
 */
export const updateTag = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tagName, tagDescription, isDashboardTag } = req.body;

  // Get the current tag to check for existing image
  const currentTag = await db.query.productTagInfo.findFirst({
    where: eq(productTagInfo.id, parseInt(id)),
  });

  if (!currentTag) {
    throw new ApiError("Tag not found", 404);
  }

  let imageUrl = currentTag.imageUrl;

  // Handle image upload if new file is provided
  if (req.file) {
    // Delete old image if it exists
    if (currentTag.imageUrl) {
      try {
        await deleteS3Image(currentTag.imageUrl);
      } catch (error) {
        console.error("Failed to delete old image:", error);
        // Continue with update even if delete fails
      }
    }

    
    // Upload new image
    const key = `tags/${Date.now()}-${req.file.originalname}`;
    console.log('file', key)
    imageUrl = await imageUploadS3(req.file.buffer, req.file.mimetype, key);
  }

  const [updatedTag] = await db
    .update(productTagInfo)
    .set({
      tagName: tagName?.trim(),
      tagDescription,
      imageUrl,
      isDashboardTag,
    })
    .where(eq(productTagInfo.id, parseInt(id)))
    .returning();

  return res.status(200).json({
    tag: updatedTag,
    message: "Tag updated successfully",
  });
};

/**
 * Delete a product tag
 */
export const deleteTag = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if tag exists
  const tag = await db.query.productTagInfo.findFirst({
    where: eq(productTagInfo.id, parseInt(id)),
  });

  if (!tag) {
    throw new ApiError("Tag not found", 404);
  }

  // Delete image from S3 if it exists
  if (tag.imageUrl) {
    try {
      await deleteS3Image(tag.imageUrl);
    } catch (error) {
      console.error("Failed to delete image from S3:", error);
      // Continue with deletion even if image delete fails
    }
  }

  // Note: This will fail if tag is still assigned to products due to foreign key constraint
  await db.delete(productTagInfo).where(eq(productTagInfo.id, parseInt(id)));

  return res.status(200).json({
    message: "Tag deleted successfully",
  });
};