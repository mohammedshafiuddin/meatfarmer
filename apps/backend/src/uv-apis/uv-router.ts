import { Router } from "express";
import uvProductRouter from "./uv-product.router";
import cartRouter from "./cart.router";
import authRouter from "./auth.router";
import addressRouter from "./address.router";
import orderRouter from "./order.router";

const router = Router();

router.use("/auth", authRouter);
router.use("/products", uvProductRouter);
router.use("/cart", cartRouter);
router.use("/address", addressRouter);
router.use("/orders", orderRouter);

const uvRouter = router;
export default uvRouter;