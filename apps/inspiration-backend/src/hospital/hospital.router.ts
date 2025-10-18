import { Router } from "express";
import { 
  createHospital, 
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
  getHospitalAdminDashboard,
  getHospitalDoctors
} from "./hospital.controller";
import { verifyToken } from "../middleware/auth";
import uploadHandler from '../lib/upload-handler';

const router = Router();

// Hospital routes
router.post("/", uploadHandler.array('hospitalImages'), createHospital);
router.get("/", getHospitals);

// Hospital admin specific routes
router.get("/admin-dashboard/:hospitalId", verifyToken,getHospitalAdminDashboard);

// Hospital doctors route
router.get("/:hospitalId/doctors", getHospitalDoctors);

// Generic hospital routes with parameters
router.get("/:id", getHospitalById);
router.put("/:id", uploadHandler.array('hospitalImages'),updateHospital);
router.delete("/:id", deleteHospital);

export default router;
