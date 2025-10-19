import { Router } from "express";
import commonProductsRouter from "./common-product.router";

const router = Router();

router.use('/products', commonProductsRouter)

const commonRouter = router;

export default commonRouter;