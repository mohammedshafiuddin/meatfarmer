import { Router } from "express";
import { getAllSpecializations } from "./specialization.controller.js";

const router = Router();

// GET /api/v1/specializations
router.get('/', getAllSpecializations);

const specializationRouter = router;

export default specializationRouter;
