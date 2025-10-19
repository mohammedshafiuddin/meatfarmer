import { Router } from "express";
import uvProductRouter from "./uv-product.router";

const router = Router();

router.use("/products", uvProductRouter);

const uvRouter = router;
export default uvRouter;