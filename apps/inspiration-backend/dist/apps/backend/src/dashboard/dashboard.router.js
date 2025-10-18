"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const router = (0, express_1.Router)();
// Dashboard endpoints
router.get("/featured-doctors", dashboard_controller_1.getFeaturedDoctors);
router.get("/featured-hospitals", dashboard_controller_1.getFeaturedHospitals);
router.get("/appointments-screen", dashboard_controller_1.getAppointmentsScreenData);
exports.default = router;
