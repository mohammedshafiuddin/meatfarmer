import { Router } from "express";
import { getUnassignedDoctors, getDoctorResponders, markDoctorLeave, getDoctorUpcomingLeaves, updateDoctorInning } from "./doctor.controller.js";
import { getMyDoctors } from "./my-doctors.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// GET /doctors/unassigned
router.get('/unassigned', getUnassignedDoctors);

// GET /doctors/responders
router.get('/responders', getDoctorResponders);

// GET /doctors/my-doctors - Get doctors based on user's responsibilities
router.get('/my-doctors', verifyToken, getMyDoctors);

// GET /doctors/:doctorId/upcoming-leaves
router.get('/:doctorId/upcoming-leaves', getDoctorUpcomingLeaves);


// POST /doctors/:doctorId/mark-leave
// Body: { startDate: string, endDate: string }
router.post('/:doctorId/mark-leave', markDoctorLeave);

router.post('/update-inning', updateDoctorInning);

const doctorRouter = router;
export default doctorRouter;
