import { Router } from "express";
import { createProduct, updateProduct } from "./product.controller";
import uploadHandler from '../lib/upload-handler';

const router = Router();

// Product routes
router.post("/", uploadHandler.array('images'), createProduct);
router.put("/:id", uploadHandler.array('images'), updateProduct);

export default router;