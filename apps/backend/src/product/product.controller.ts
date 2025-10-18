import { Request, Response } from "express";
import { db } from "../db/db_index";
import { productInfo, units, specialDeals, productSlots } from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { ApiError } from "../lib/api-error";
import { imageUploadS3, generateSignedUrlsFromS3Urls } from "../lib/s3-client";
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
  const { name, shortDescription, longDescription, unitId, price, deals } = req.body;

  console.log({body: req.body})
  
  // Validate required fields
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

  // Generate signed URLs for product images
  const productWithSignedUrls = {
    ...product,
    images: await generateSignedUrlsFromS3Urls((product.images as string[]) || []),
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
  const { name, shortDescription, longDescription, unitId, price } = req.body;

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

  const [updatedProduct] = await db
    .update(productInfo)
    .set({
      name,
      shortDescription,
      longDescription,
      unitId,
      price,
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
    })
    .where(eq(productInfo.id, parseInt(id)))
    .returning();

  if (!updatedProduct) {
    throw new ApiError("Product not found", 404);
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
 * Get all products summary for dropdown
 */
export const getAllProductsSummary = async (req: Request, res: Response) => {
  console.log('from products summary method')

  try {
    const products = await db.query.productInfo.findMany({
      // columns: {
      //   id: true,
      //   name: true,
      //   shortDescription: true,
      //   images: true,
      // },
    });
    console.log({products})


    // Generate signed URLs for product images
    const formattedProducts = await Promise.all(
      products.map(async (product) => ({
        id: product.id,
        name: product.name,
        shortDescription: product.shortDescription,
        imageUrls: await generateSignedUrlsFromS3Urls((product.images as string[]) || []),
      }))
    );

    return res.status(200).json({
      products: formattedProducts,
      count: formattedProducts.length,
    });
  } catch (error) {
    console.error("Get products summary error:", error);
    return res.status(500).json({ error: "Failed to fetch products summary" });
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