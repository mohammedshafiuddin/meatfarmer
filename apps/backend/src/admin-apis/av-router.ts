import { Router } from "express";
import productRouter from "./product.router";
import deliverySlotRouter from "./delivery-slot.router";
import orderRouter from "./order.router";

const router = Router();

// Product routes
router.use("/products", productRouter);

// Delivery slot routes
router.use("/slots", deliverySlotRouter);

// Order routes
router.use("/orders", orderRouter);

const avRouter = router;

export default avRouter;