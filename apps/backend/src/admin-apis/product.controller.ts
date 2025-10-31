import { Request, Response } from "express";
import { db } from "../db/db_index";
import { productInfo, units, specialDeals, productSlots } from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { ApiError } from "../lib/api-error";
import { imageUploadS3, generateSignedUrlsFromS3Urls, getOriginalUrlFromSignedUrl } from "../lib/s3-client";
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
  const { name, shortDescription, longDescription, unitId, price, marketPrice, deals } = req.body;
  
  // Validate required fields
  if (!name || !unitId || !price) {
    throw new ApiError("Name, unitId, and price are required", 400);
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

  return res.status(201).json({
    product: newProduct,
    deals: createdDeals,
    message: "Product created successfully",
  });
};

/**
 * Get all products
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await db.query.productInfo.findMany({
      with: {
        unit: true,
      },
    });

    // Generate signed URLs for all product images
    const productsWithSignedUrls = await Promise.all(
      products.map(async (product) => ({
        ...product,
        images: await generateSignedUrlsFromS3Urls((product.images as string[]) || []),
      }))
    );

    return res.status(200).json({
      products: productsWithSignedUrls,
      count: productsWithSignedUrls.length,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
};

/**
 * Get a product by ID
 */
export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await db.query.productInfo.findFirst({
    where: eq(productInfo.id, parseInt(id)),
    with: {
      unit: true,
    },
  });

  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  // Fetch special deals for this product
  const deals = await db.query.specialDeals.findMany({
    where: eq(specialDeals.productId, parseInt(id)),
    orderBy: specialDeals.quantity,
  });

  // Generate signed URLs for product images
  const productWithSignedUrls = {
    ...product,
    images: await generateSignedUrlsFromS3Urls((product.images as string[]) || []),
    deals,
  };

  return res.status(200).json({
    product: productWithSignedUrls,
  });
};

/**
 * Update a product
 */
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, shortDescription, longDescription, unitId, price, marketPrice, deals:dealsRaw, imagesToDelete:imagesToDeleteRaw } = req.body;

  const deals = dealsRaw ? JSON.parse(dealsRaw) : null;
  const imagesToDelete = imagesToDeleteRaw ? JSON.parse(imagesToDeleteRaw) : [];
  
  if (!name || !unitId || !price) {
    throw new ApiError("Name, unitId, and price are required", 400);
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

  return res.status(200).json({
    product: updatedProduct,
    message: "Product updated successfully",
  });
};

/**
 * Delete a product
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [deletedProduct] = await db
      .delete(productInfo)
      .where(eq(productInfo.id, parseInt(id)))
      .returning();

    if (!deletedProduct) {
      throw new ApiError("Product not found", 404);
    }

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
};

/**
 * Update products associated with a slot (efficient diff-based approach)
 */
export const updateSlotProducts = async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
      throw new ApiError("productIds must be an array", 400);
    }

    // Get current associations
    const currentAssociations = await db.query.productSlots.findMany({
      where: eq(productSlots.slotId, parseInt(slotId)),
      columns: {
        productId: true,
      },
    });

    const currentProductIds = currentAssociations.map(assoc => assoc.productId);
    const newProductIds = productIds.map((id: string) => parseInt(id));

    // Find products to add and remove
    const productsToAdd = newProductIds.filter(id => !currentProductIds.includes(id));
    const productsToRemove = currentProductIds.filter(id => !newProductIds.includes(id));

    // Remove associations for products that are no longer selected
    if (productsToRemove.length > 0) {
      await db.delete(productSlots).where(
        and(
          eq(productSlots.slotId, parseInt(slotId)),
          inArray(productSlots.productId, productsToRemove)
        )
      );
    }

    // Add associations for newly selected products
    if (productsToAdd.length > 0) {
      const newAssociations = productsToAdd.map(productId => ({
        productId,
        slotId: parseInt(slotId),
      }));

      await db.insert(productSlots).values(newAssociations);
    }

    return res.status(200).json({
      message: "Slot products updated successfully",
      added: productsToAdd.length,
      removed: productsToRemove.length,
    });
  } catch (error) {
    console.error("Update slot products error:", error);
    return res.status(500).json({ error: "Failed to update slot products" });
  }
};

/**
 * Get product IDs associated with a slot
 */
export const getSlotProductIds = async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;

    const associations = await db.query.productSlots.findMany({
      where: eq(productSlots.slotId, parseInt(slotId)),
      columns: {
        productId: true,
      },
    });

    const productIds = associations.map(assoc => assoc.productId);

    return res.status(200).json({
      productIds,
    });
  } catch (error) {
    console.error("Get slot product IDs error:", error);
    return res.status(500).json({ error: "Failed to fetch slot product IDs" });
  }
};

/**
 * Get product IDs associated with multiple slots (bulk operation)
 */
export const getSlotsProductIds = async (req: Request, res: Response) => {
  try {
    const { slotIds } = req.body;

    if (!Array.isArray(slotIds)) {
      throw new ApiError("slotIds must be an array", 400);
    }

    if (slotIds.length === 0) {
      return res.status(200).json({});
    }

    // Fetch all associations for the requested slots
    const associations = await db.query.productSlots.findMany({
      where: inArray(productSlots.slotId, slotIds),
      columns: {
        slotId: true,
        productId: true,
      },
    });

    // Group by slotId
    const result = associations.reduce((acc, assoc) => {
      if (!acc[assoc.slotId]) {
        acc[assoc.slotId] = [];
      }
      acc[assoc.slotId].push(assoc.productId);
      return acc;
    }, {} as Record<number, number[]>);

    // Ensure all requested slots have entries (even if empty)
    slotIds.forEach(slotId => {
      if (!result[slotId]) {
        result[slotId] = [];
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get slots product IDs error:", error);
    return res.status(500).json({ error: "Failed to fetch slots product IDs" });
  }
};