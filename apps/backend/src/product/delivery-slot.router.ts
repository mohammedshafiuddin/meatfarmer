import { Router } from "express";
import {
  createSlot,
  getSlots,
  getSlotById,
  updateSlot,
  deleteSlot,
} from "../controllers/delivery-slot.controller";

const router = Router();

// Delivery slot routes
router.post("/", createSlot);
router.get("/", getSlots);
router.get("/:id", getSlotById);
router.put("/:id", updateSlot);
router.delete("/:id", deleteSlot);

export default router;