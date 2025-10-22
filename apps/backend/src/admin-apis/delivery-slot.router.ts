import { Router } from "express";
import {
  createSlot,
  getSlots,
  getSlotById,
  updateSlot,
  deleteSlot,
  getDeliverySequence,
  updateDeliverySequence,
} from "./delivery-slot.controller";

const router = Router();

// Delivery slot routes
router.post("/", createSlot);
router.get("/", getSlots);
router.get("/:id", getSlotById);
router.put("/:id", updateSlot);
router.delete("/:id", deleteSlot);

// Delivery sequence routes
router.get("/:id/delivery-sequence", getDeliverySequence);
router.put("/:id/delivery-sequence", updateDeliverySequence);

export default router;