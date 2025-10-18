"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doctor_controller_js_1 = require("./doctor.controller.js");
const my_doctors_controller_js_1 = require("./my-doctors.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /doctors/unassigned
router.get('/unassigned', doctor_controller_js_1.getUnassignedDoctors);
// GET /doctors/responders
router.get('/responders', doctor_controller_js_1.getDoctorResponders);
// GET /doctors/my-doctors - Get doctors based on user's responsibilities
router.get('/my-doctors', auth_js_1.verifyToken, my_doctors_controller_js_1.getMyDoctors);
// GET /doctors/:doctorId/upcoming-leaves
router.get('/:doctorId/upcoming-leaves', doctor_controller_js_1.getDoctorUpcomingLeaves);
// POST /doctors/:doctorId/mark-leave
// Body: { startDate: string, endDate: string }
router.post('/:doctorId/mark-leave', doctor_controller_js_1.markDoctorLeave);
router.post('/update-inning', doctor_controller_js_1.updateDoctorInning);
const doctorRouter = router;
exports.default = doctorRouter;
