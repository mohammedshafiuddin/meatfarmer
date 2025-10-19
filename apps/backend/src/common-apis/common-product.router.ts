import { Router } from "express";
import { getAllProductsSummary } from "./common-product.controller";

const router = Router();

router.get("/summary", getAllProductsSummary);


const commonProductsRouter= router;
export default commonProductsRouter;