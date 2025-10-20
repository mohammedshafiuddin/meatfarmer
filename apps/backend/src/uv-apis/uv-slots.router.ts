import { Router } from "express";
import { getSlots } from "./uv-slots.controller";

const router = Router();

router.get("/", getSlots);

export default router;