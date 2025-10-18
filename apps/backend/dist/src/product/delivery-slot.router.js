"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const delivery_slot_controller_1 = require("../controllers/delivery-slot.controller");
const router = (0, express_1.Router)();
// Delivery slot routes
router.post("/", delivery_slot_controller_1.createSlot);
router.get("/", delivery_slot_controller_1.getSlots);
router.get("/:id", delivery_slot_controller_1.getSlotById);
router.put("/:id", delivery_slot_controller_1.updateSlot);
router.delete("/:id", delivery_slot_controller_1.deleteSlot);
exports.default = router;
