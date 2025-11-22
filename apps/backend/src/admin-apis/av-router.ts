import { Router } from "express";
import { authenticateStaff } from "../middleware/staff-auth";
import productRouter from "./product.router";
import tagRouter from "./tag.router";

const router = Router();

// Apply staff authentication to all admin routes
router.use(authenticateStaff);

// Product routes
router.use("/products", productRouter);

// Tag routes
router.use("/product-tags", tagRouter);

const avRouter = router;

export default avRouter;