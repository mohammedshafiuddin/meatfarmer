import { Router } from "express";
import productRouter from "./product.router";
import deliverySlotRouter from "./delivery-slot.router";
import orderRouter from "./order.router";
import complaintRouter from "./complaint.router";
import staffRouter from "./staff.router";

const router = Router();

// Product routes
router.use("/products", productRouter);

// Delivery slot routes
router.use("/slots", deliverySlotRouter);

// Order routes
router.use("/orders", orderRouter);

// Complaint routes
router.use("/complaints", complaintRouter);

// Staff routes
router.use("/staff", staffRouter);

const avRouter = router;

export default avRouter;