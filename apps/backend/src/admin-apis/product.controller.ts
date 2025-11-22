import { Request, Response } from "express";
import { db } from "../db/db_index";
import { productInfo, units, specialDeals, productTags } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { ApiError } from "../lib/api-error";
import { imageUploadS3, getOriginalUrlFromSignedUrl } from "../lib/s3-client";
import { deleteS3Image } from "../lib/delete-image";
import type { SpecialDeal } from "../db/types";

type CreateDeal = {
  quantity: number;
  price: number;
  validTill: string;
};

/**
 * Create a new product
 */
export const createProduct = async (req: Request, res: Response) => {
  const { name, shortDescription, longDescription, unitId, storeId, price, marketPrice, deals, tagIds } = req.body;

  console.log({name, unitId, storeId, price})
  
  // Validate required fields
  if (!name || !unitId || !storeId || !price) {
    throw new ApiError("Name, unitId, storeId, and price are required", 400);
  }

  // Check for duplicate name
  const existingProduct = await db.query.productInfo.findFirst({
    where: eq(productInfo.name, name.trim()),
  });

  if (existingProduct) {
    throw new ApiError("A product with this name already exists", 400);
  }

  // Check if unit exists
  const unit = await db.query.units.findFirst({
    where: eq(units.id, unitId),
  });

  if (!unit) {
    throw new ApiError("Invalid unit ID", 400);
  }

  // Extract images from req.files
  const images = (req.files as Express.Multer.File[])?.filter(item => item.fieldname === 'images');
  let uploadedImageUrls: string[] = [];

  if (images && Array.isArray(images)) {
    const imageUploadPromises = images.map((file, index) => {
      const key = `product-images/${Date.now()}-${index}`;
      return imageUploadS3(file.buffer, file.mimetype, key);
    });

    uploadedImageUrls = await Promise.all(imageUploadPromises);
  }

  // Create product
  const [newProduct] = await db
    .insert(productInfo)
    .values({
      name,
      shortDescription,
      longDescription,
      unitId,
      storeId,
      price,
      marketPrice,
      images: uploadedImageUrls,
    })
    .returning();

  // Handle deals if provided
  let createdDeals: SpecialDeal[] = [];
  if (deals && Array.isArray(deals)) {
    const dealInserts = deals.map((deal: CreateDeal) => ({
      productId: newProduct.id,
      quantity: deal.quantity.toString(),
      price: deal.price.toString(),
      validTill: new Date(deal.validTill),
    }));

    createdDeals = await db
      .insert(specialDeals)
      .values(dealInserts)
      .returning();
  }

  // Handle tag assignments if provided
  if (tagIds && Array.isArray(tagIds)) {
    const tagAssociations = tagIds.map((tagId: number) => ({
      productId: newProduct.id,
      tagId,
    }));

    await db.insert(productTags).values(tagAssociations);
  }

  return res.status(201).json({
    product: newProduct,
    deals: createdDeals,
    message: "Product created successfully",
  });
};

/**
 * Update a product
 */
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, shortDescription, longDescription, unitId, storeId, price, marketPrice, deals:dealsRaw, imagesToDelete:imagesToDeleteRaw, tagIds } = req.body;

  const deals = dealsRaw ? JSON.parse(dealsRaw) : null;
  const imagesToDelete = imagesToDeleteRaw ? JSON.parse(imagesToDeleteRaw) : [];

  if (!name || !unitId || !storeId || !price) {
    throw new ApiError("Name, unitId, storeId, and price are required", 400);
  }

  // Check if unit exists
  const unit = await db.query.units.findFirst({
    where: eq(units.id, unitId),
  });

  if (!unit) {
    throw new ApiError("Invalid unit ID", 400);
  }

  // Get current product to handle image updates
  const currentProduct = await db.query.productInfo.findFirst({
    where: eq(productInfo.id, parseInt(id)),
  });

  if (!currentProduct) {
    throw new ApiError("Product not found", 404);
  }

  // Handle image deletions
  let currentImages = (currentProduct.images as string[]) || [];
  if (imagesToDelete && imagesToDelete.length > 0) {
    // Convert signed URLs to original S3 URLs for comparison
    const originalUrlsToDelete = imagesToDelete
      .map((signedUrl: string) => getOriginalUrlFromSignedUrl(signedUrl))
      .filter(Boolean); // Remove nulls

    // Find which stored images match the ones to delete
    const imagesToRemoveFromDb = currentImages.filter(storedUrl =>
      originalUrlsToDelete.includes(storedUrl)
    );

    // Delete the matching images from S3
    const deletePromises = imagesToRemoveFromDb.map(imageUrl => deleteS3Image(imageUrl));
    await Promise.all(deletePromises);

    // Remove deleted images from current images array
    currentImages = currentImages.filter(img => !imagesToRemoveFromDb.includes(img));
  }

  // Extract new images from req.files
  const images = (req.files as Express.Multer.File[])?.filter(item => item.fieldname === 'images');
  let uploadedImageUrls: string[] = [];

  if (images && Array.isArray(images)) {
    const imageUploadPromises = images.map((file, index) => {
      const key = `product-images/${Date.now()}-${index}`;
      return imageUploadS3(file.buffer, file.mimetype, key);
    });

    uploadedImageUrls = await Promise.all(imageUploadPromises);
  }

  // Combine remaining current images with new uploaded images
  const finalImages = [...currentImages, ...uploadedImageUrls];

  const [updatedProduct] = await db
    .update(productInfo)
    .set({
      name,
      shortDescription,
      longDescription,
      unitId,
      storeId,
      price,
      marketPrice,
      images: finalImages.length > 0 ? finalImages : undefined,
    })
    .where(eq(productInfo.id, parseInt(id)))
    .returning();

  if (!updatedProduct) {
    throw new ApiError("Product not found", 404);
  }

  // Handle deals if provided
  if (deals && Array.isArray(deals)) {
    // Get existing deals
    const existingDeals = await db.query.specialDeals.findMany({
      where: eq(specialDeals.productId, parseInt(id)),
    });

    // Create maps for comparison
    const existingDealsMap = new Map(existingDeals.map(deal => [`${deal.quantity}-${deal.price}`, deal]));
    const newDealsMap = new Map(deals.map((deal: CreateDeal) => [`${deal.quantity}-${deal.price}`, deal]));

    // Find deals to add, update, and remove
    const dealsToAdd = deals.filter((deal: CreateDeal) => {
      const key = `${deal.quantity}-${deal.price}`;
      return !existingDealsMap.has(key);
    });

    const dealsToRemove = existingDeals.filter(deal => {
      const key = `${deal.quantity}-${deal.price}`;
      return !newDealsMap.has(key);
    });

    const dealsToUpdate = deals.filter((deal: CreateDeal) => {
      const key = `${deal.quantity}-${deal.price}`;
      const existing = existingDealsMap.get(key);
      return existing && existing.validTill.toISOString().split('T')[0] !== deal.validTill;
    });

    // Remove old deals
    if (dealsToRemove.length > 0) {
      await db.delete(specialDeals).where(
        inArray(specialDeals.id, dealsToRemove.map(deal => deal.id))
      );
    }

    // Add new deals
    if (dealsToAdd.length > 0) {
      const dealInserts = dealsToAdd.map((deal: CreateDeal) => ({
        productId: parseInt(id),
        quantity: deal.quantity.toString(),
        price: deal.price.toString(),
        validTill: new Date(deal.validTill),
      }));
      await db.insert(specialDeals).values(dealInserts);
    }

    // Update existing deals
    for (const deal of dealsToUpdate) {
      const key = `${deal.quantity}-${deal.price}`;
      const existingDeal = existingDealsMap.get(key);
      if (existingDeal) {
        await db.update(specialDeals)
          .set({ validTill: new Date(deal.validTill) })
          .where(eq(specialDeals.id, existingDeal.id));
      }
    }
  }

  console.log({tagIds})
  
  // Handle tag assignments if provided
  // if (tagIds && Array.isArray(tagIds)) {
  if (tagIds && Boolean(tagIds)) {
    // Remove existing tags
    await db.delete(productTags).where(eq(productTags.productId, parseInt(id)));

    const tagIdsArray = Array.isArray(tagIds) ? tagIds : [+tagIds]
    // Add new tags
    const tagAssociations = tagIdsArray.map((tagId: number) => ({
      productId: parseInt(id),
      tagId,
    }));

    await db.insert(productTags).values(tagAssociations);
  }

  return res.status(200).json({
    product: updatedProduct,
    message: "Product updated successfully",
  });
};