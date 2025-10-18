"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlotsProductIds = exports.updateSlotProducts = exports.getSlotProductIds = exports.getAllProductsSummary = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const db_index_1 = require("../db/db_index");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const api_error_1 = require("../lib/api-error");
const s3_client_1 = require("../lib/s3-client");
/**
 * Create a new product
 */
const createProduct = async (req, res) => {
    const { name, shortDescription, longDescription, unitId, price, deals } = req.body;
    console.log({ body: req.body });
    // Validate required fields
    if (!name || !unitId || !price) {
        throw new api_error_1.ApiError("Name, unitId, and price are required", 400);
    }
    // Check if unit exists
    const unit = await db_index_1.db.query.units.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.units.id, unitId),
    });
    if (!unit) {
        throw new api_error_1.ApiError("Invalid unit ID", 400);
    }
    // Extract images from req.files
    const images = req.files?.filter(item => item.fieldname === 'images');
    let uploadedImageUrls = [];
    if (images && Array.isArray(images)) {
        const imageUploadPromises = images.map((file, index) => {
            const key = `product-images/${Date.now()}-${index}`;
            return (0, s3_client_1.imageUploadS3)(file.buffer, file.mimetype, key);
        });
        uploadedImageUrls = await Promise.all(imageUploadPromises);
    }
    // Create product
    const [newProduct] = await db_index_1.db
        .insert(schema_1.productInfo)
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
    let createdDeals = [];
    if (deals && Array.isArray(deals)) {
        const dealInserts = deals.map((deal) => ({
            productId: newProduct.id,
            quantity: deal.quantity.toString(),
            price: deal.price.toString(),
            validTill: new Date(deal.validTill),
        }));
        createdDeals = await db_index_1.db
            .insert(schema_1.specialDeals)
            .values(dealInserts)
            .returning();
    }
    return res.status(201).json({
        product: newProduct,
        deals: createdDeals,
        message: "Product created successfully",
    });
};
exports.createProduct = createProduct;
/**
 * Get all products
 */
const getProducts = async (req, res) => {
    try {
        const products = await db_index_1.db.query.productInfo.findMany({
            with: {
                unit: true,
            },
        });
        // Generate signed URLs for all product images
        const productsWithSignedUrls = await Promise.all(products.map(async (product) => ({
            ...product,
            images: await (0, s3_client_1.generateSignedUrlsFromS3Urls)(product.images || []),
        })));
        return res.status(200).json({
            products: productsWithSignedUrls,
            count: productsWithSignedUrls.length,
        });
    }
    catch (error) {
        console.error("Get products error:", error);
        return res.status(500).json({ error: "Failed to fetch products" });
    }
};
exports.getProducts = getProducts;
/**
 * Get a product by ID
 */
const getProductById = async (req, res) => {
    const { id } = req.params;
    const product = await db_index_1.db.query.productInfo.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.productInfo.id, parseInt(id)),
        with: {
            unit: true,
        },
    });
    if (!product) {
        throw new api_error_1.ApiError("Product not found", 404);
    }
    // Generate signed URLs for product images
    const productWithSignedUrls = {
        ...product,
        images: await (0, s3_client_1.generateSignedUrlsFromS3Urls)(product.images || []),
    };
    return res.status(200).json({
        product: productWithSignedUrls,
    });
};
exports.getProductById = getProductById;
/**
 * Update a product
 */
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, shortDescription, longDescription, unitId, price } = req.body;
    if (!name || !unitId || !price) {
        throw new api_error_1.ApiError("Name, unitId, and price are required", 400);
    }
    // Check if unit exists
    const unit = await db_index_1.db.query.units.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.units.id, unitId),
    });
    if (!unit) {
        throw new api_error_1.ApiError("Invalid unit ID", 400);
    }
    // Extract images from req.files
    const images = req.files?.filter(item => item.fieldname === 'images');
    let uploadedImageUrls = [];
    if (images && Array.isArray(images)) {
        const imageUploadPromises = images.map((file, index) => {
            const key = `product-images/${Date.now()}-${index}`;
            return (0, s3_client_1.imageUploadS3)(file.buffer, file.mimetype, key);
        });
        uploadedImageUrls = await Promise.all(imageUploadPromises);
    }
    const [updatedProduct] = await db_index_1.db
        .update(schema_1.productInfo)
        .set({
        name,
        shortDescription,
        longDescription,
        unitId,
        price,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.productInfo.id, parseInt(id)))
        .returning();
    if (!updatedProduct) {
        throw new api_error_1.ApiError("Product not found", 404);
    }
    return res.status(200).json({
        product: updatedProduct,
        message: "Product updated successfully",
    });
};
exports.updateProduct = updateProduct;
/**
 * Delete a product
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [deletedProduct] = await db_index_1.db
            .delete(schema_1.productInfo)
            .where((0, drizzle_orm_1.eq)(schema_1.productInfo.id, parseInt(id)))
            .returning();
        if (!deletedProduct) {
            throw new api_error_1.ApiError("Product not found", 404);
        }
        return res.status(200).json({
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete product error:", error);
        return res.status(500).json({ error: "Failed to delete product" });
    }
};
exports.deleteProduct = deleteProduct;
/**
 * Get all products summary for dropdown
 */
const getAllProductsSummary = async (req, res) => {
    console.log('from products summary method');
    try {
        const products = await db_index_1.db.query.productInfo.findMany({
        // columns: {
        //   id: true,
        //   name: true,
        //   shortDescription: true,
        //   images: true,
        // },
        });
        console.log({ products });
        // Generate signed URLs for product images
        const formattedProducts = await Promise.all(products.map(async (product) => ({
            id: product.id,
            name: product.name,
            shortDescription: product.shortDescription,
            imageUrls: await (0, s3_client_1.generateSignedUrlsFromS3Urls)(product.images || []),
        })));
        return res.status(200).json({
            products: formattedProducts,
            count: formattedProducts.length,
        });
    }
    catch (error) {
        console.error("Get products summary error:", error);
        return res.status(500).json({ error: "Failed to fetch products summary" });
    }
};
exports.getAllProductsSummary = getAllProductsSummary;
/**
 * Get product IDs associated with a slot
 */
const getSlotProductIds = async (req, res) => {
    try {
        const { slotId } = req.params;
        const associations = await db_index_1.db.query.productSlots.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.productSlots.slotId, parseInt(slotId)),
            columns: {
                productId: true,
            },
        });
        const productIds = associations.map(assoc => assoc.productId);
        return res.status(200).json({
            productIds,
        });
    }
    catch (error) {
        console.error("Get slot product IDs error:", error);
        return res.status(500).json({ error: "Failed to fetch slot product IDs" });
    }
};
exports.getSlotProductIds = getSlotProductIds;
/**
 * Update products associated with a slot (efficient diff-based approach)
 */
const updateSlotProducts = async (req, res) => {
    try {
        const { slotId } = req.params;
        const { productIds } = req.body;
        if (!Array.isArray(productIds)) {
            throw new api_error_1.ApiError("productIds must be an array", 400);
        }
        // Get current associations
        const currentAssociations = await db_index_1.db.query.productSlots.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.productSlots.slotId, parseInt(slotId)),
            columns: {
                productId: true,
            },
        });
        const currentProductIds = currentAssociations.map(assoc => assoc.productId);
        const newProductIds = productIds.map((id) => parseInt(id));
        // Find products to add and remove
        const productsToAdd = newProductIds.filter(id => !currentProductIds.includes(id));
        const productsToRemove = currentProductIds.filter(id => !newProductIds.includes(id));
        // Remove associations for products that are no longer selected
        if (productsToRemove.length > 0) {
            await db_index_1.db.delete(schema_1.productSlots).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.productSlots.slotId, parseInt(slotId)), (0, drizzle_orm_1.inArray)(schema_1.productSlots.productId, productsToRemove)));
        }
        // Add associations for newly selected products
        if (productsToAdd.length > 0) {
            const newAssociations = productsToAdd.map(productId => ({
                productId,
                slotId: parseInt(slotId),
            }));
            await db_index_1.db.insert(schema_1.productSlots).values(newAssociations);
        }
        return res.status(200).json({
            message: "Slot products updated successfully",
            added: productsToAdd.length,
            removed: productsToRemove.length,
        });
    }
    catch (error) {
        console.error("Update slot products error:", error);
        return res.status(500).json({ error: "Failed to update slot products" });
    }
};
exports.updateSlotProducts = updateSlotProducts;
/**
 * Get product IDs associated with multiple slots (bulk operation)
 */
const getSlotsProductIds = async (req, res) => {
    try {
        const { slotIds } = req.body;
        if (!Array.isArray(slotIds)) {
            throw new api_error_1.ApiError("slotIds must be an array", 400);
        }
        if (slotIds.length === 0) {
            return res.status(200).json({});
        }
        // Fetch all associations for the requested slots
        const associations = await db_index_1.db.query.productSlots.findMany({
            where: (0, drizzle_orm_1.inArray)(schema_1.productSlots.slotId, slotIds),
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
        }, {});
        // Ensure all requested slots have entries (even if empty)
        slotIds.forEach(slotId => {
            if (!result[slotId]) {
                result[slotId] = [];
            }
        });
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Get slots product IDs error:", error);
        return res.status(500).json({ error: "Failed to fetch slots product IDs" });
    }
};
exports.getSlotsProductIds = getSlotsProductIds;
