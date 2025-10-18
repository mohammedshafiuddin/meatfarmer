import { Router } from "express";
import { getFeaturedDoctors, getFeaturedHospitals, getAppointmentsScreenData } from "./dashboard.controller";

const router = Router();

// Dashboard endpoints
router.get("/featured-doctors", getFeaturedDoctors);
router.get("/featured-hospitals", getFeaturedHospitals);
router.get("/appointments-screen", getAppointmentsScreenData);

export default router;
