import { Router } from "express";
import { getProductDetails } from "./uv-product.controller";

const router = Router();

router.get("/:id", getProductDetails);

export default router;