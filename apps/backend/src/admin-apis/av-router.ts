import { Router } from "express";
import { authenticateStaff } from "../middleware/staff-auth";
import productRouter from "./product.router";
import deliverySlotRouter from "./delivery-slot.router";
import orderRouter from "./order.router";
import complaintRouter from "./complaint.router";
import staffRouter from "./staff.router";
import couponRouter from "./coupon.router";

const router = Router();

router.use("/staff", staffRouter);
// Apply staff authentication to all admin routes
router.use(authenticateStaff);

// Product routes
router.use("/products", productRouter);

// Delivery slot routes
router.use("/slots", deliverySlotRouter);

// Order routes
router.use("/orders", orderRouter);

// Complaint routes
router.use("/complaints", complaintRouter);

// Staff routes

// Coupon routes
router.use("/coupons", couponRouter);

const avRouter = router;

export default avRouter;