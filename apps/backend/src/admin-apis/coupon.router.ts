import { Router } from "express";
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "./coupon.controller";

const router = Router();

// Coupon routes
router.post("/", createCoupon);
router.get("/", getCoupons);
router.get("/:id", getCouponById);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

// Coupon validation route (for user-facing validation)
router.post("/validate", validateCoupon);

export default router;