import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,

  updateSlotProducts,
  getSlotsProductIds,
  getSlotProductIds,
} from "./product.controller";
import uploadHandler from '../lib/upload-handler';

const router = Router();

// Product routes
router.post("/", uploadHandler.array('images'), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", uploadHandler.array('images'), updateProduct);
router.delete("/:id", deleteProduct);

// Product summary and slot association routes
router.get("/slots/:slotId/product-ids", getSlotProductIds);
router.put("/slots/:slotId/products", updateSlotProducts);
router.post("/slots/product-ids", getSlotsProductIds);

export default router;