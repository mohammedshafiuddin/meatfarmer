import { Router } from "express";
import uvProductRouter from "./uv-product.router";
import cartRouter from "./cart.router";
import authRouter from "./auth.router";
import addressRouter from "./address.router";
import orderRouter from "./order.router";
import uvSlotsRouter from "./uv-slots.router";
import complaintRouter from "./complaint.router";

const router = Router();

router.use("/auth", authRouter);
router.use("/products", uvProductRouter);
router.use("/cart", cartRouter);
router.use("/address", addressRouter);
router.use("/orders", orderRouter);
router.use("/slots", uvSlotsRouter);
router.use("/complaints", complaintRouter);

const uvRouter = router;
export default uvRouter;