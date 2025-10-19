import { Router } from "express";
import uvProductRouter from "./uv-product.router";
import cartRouter from "./cart.router";
import authRouter from "./auth.router";

const router = Router();

router.use("/auth", authRouter);
router.use("/products", uvProductRouter);
router.use("/cart", cartRouter);

const uvRouter = router;
export default uvRouter;