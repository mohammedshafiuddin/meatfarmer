import { Router } from "express";
import productRouter from "./product/product.router";
import deliverySlotRouter from "./product/delivery-slot.router";

const router = Router();

// Product routes
router.use("/products", productRouter);

// Delivery slot routes
router.use("/slots", deliverySlotRouter);

const v1Router = router;

export default v1Router;