import { Router } from "express";
import { authenticateStaff } from "../middleware/staff-auth";
import productRouter from "./product.router";

const router = Router();

// Apply staff authentication to all admin routes
router.use(authenticateStaff);

// Product routes
router.use("/products", productRouter);

const avRouter = router;

export default avRouter;