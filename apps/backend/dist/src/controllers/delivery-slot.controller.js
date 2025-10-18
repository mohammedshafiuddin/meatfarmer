"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSlot = exports.updateSlot = exports.getSlotById = exports.getSlots = exports.createSlot = void 0;
const db_index_1 = require("../db/db_index");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const api_error_1 = require("../lib/api-error");
/**
 * Create a new delivery slot
 */
const createSlot = async (req, res) => {
    const { deliveryTime, freezeTime, isActive } = req.body;
    // Validate required fields
    if (!deliveryTime || !freezeTime) {
        throw new api_error_1.ApiError("Delivery time and freeze time are required", 400);
    }
    // Create slot
    const [newSlot] = await db_index_1.db
        .insert(schema_1.deliverySlotInfo)
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
exports.createSlot = createSlot;
/**
 * Get all delivery slots
 */
const getSlots = async (req, res) => {
    const slots = await db_index_1.db.query.deliverySlotInfo.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.deliverySlotInfo.isActive, true),
    });
    return res.status(200).json({
        slots,
        count: slots.length,
    });
};
exports.getSlots = getSlots;
/**
 * Get a slot by ID
 */
const getSlotById = async (req, res) => {
    const { id } = req.params;
    const slot = await db_index_1.db.query.deliverySlotInfo.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.deliverySlotInfo.id, parseInt(id)),
    });
    if (!slot) {
        throw new api_error_1.ApiError("Slot not found", 404);
    }
    return res.status(200).json({
        slot,
    });
};
exports.getSlotById = getSlotById;
/**
 * Update a slot
 */
const updateSlot = async (req, res) => {
    const { id } = req.params;
    const { deliveryTime, freezeTime, isActive } = req.body;
    if (!deliveryTime || !freezeTime) {
        throw new api_error_1.ApiError("Delivery time and freeze time are required", 400);
    }
    const [updatedSlot] = await db_index_1.db
        .update(schema_1.deliverySlotInfo)
        .set({
        deliveryTime: new Date(deliveryTime),
        freezeTime: new Date(freezeTime),
        isActive: isActive !== undefined ? isActive : true,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.deliverySlotInfo.id, parseInt(id)))
        .returning();
    if (!updatedSlot) {
        throw new api_error_1.ApiError("Slot not found", 404);
    }
    return res.status(200).json({
        slot: updatedSlot,
        message: "Slot updated successfully",
    });
};
exports.updateSlot = updateSlot;
/**
 * Delete a slot (soft delete)
 */
const deleteSlot = async (req, res) => {
    const { id } = req.params;
    const [deletedSlot] = await db_index_1.db
        .update(schema_1.deliverySlotInfo)
        .set({ isActive: false })
        .where((0, drizzle_orm_1.eq)(schema_1.deliverySlotInfo.id, parseInt(id)))
        .returning();
    if (!deletedSlot) {
        throw new api_error_1.ApiError("Slot not found", 404);
    }
    return res.status(200).json({
        message: "Slot deleted successfully",
    });
};
exports.deleteSlot = deleteSlot;
