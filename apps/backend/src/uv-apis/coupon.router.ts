import { Router } from "express";
import { verifyToken } from "../middleware/auth";
import { getEligibleCoupons } from "./coupon.controller";

const router = Router();

router.use(verifyToken);

// Get eligible coupons for current user
router.get("/eligible", getEligibleCoupons);

export default router;